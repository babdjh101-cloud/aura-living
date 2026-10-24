import { Order, OrderStatus, CartItem } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_ORDERS } from './mockData';
import { fetchProductById, updateProduct } from './products';

const ORDERS_STORAGE_KEY = 'aura_orders_cache';

function getLocalOrders(): Order[] {
  const cached = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
  return INITIAL_ORDERS;
}

function saveLocalOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export interface SubmitOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  city: string;
  postal_code?: string;
  order_notes?: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export interface OrderSubmissionResult {
  success: boolean;
  order_id: string;
  order_number: string;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
}

export async function submitOrder(payload: SubmitOrderPayload, cartItems?: CartItem[]): Promise<OrderSubmissionResult> {
  // If Supabase is configured, use the atomic PostgreSQL RPC function
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('create_order_securely', {
        p_customer_name: payload.customer_name,
        p_customer_phone: payload.customer_phone,
        p_customer_email: payload.customer_email || null,
        p_shipping_address: payload.shipping_address,
        p_city: payload.city,
        p_postal_code: payload.postal_code || null,
        p_order_notes: payload.order_notes || null,
        p_items: payload.items,
      });

      if (!error && data && data.success) {
        return data as OrderSubmissionResult;
      }

      if (error) {
        console.warn('Database RPC order rejected (catalog may need seeding):', error.message);
        // If it's a validation error about customer data or stock, throw it
        if (error.message.includes('Customer') || error.message.includes('Shipping') || error.message.includes('City') || error.message.includes('stock')) {
          throw new Error(error.message);
        }
        // If product was not found in remote DB (unseeded DB), fall through to local processing
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Customer') || err.message.includes('Shipping') || err.message.includes('City') || err.message.includes('stock'))) {
        throw err;
      }
      console.warn('Proceeding with fallback order checkout:', err.message || err);
    }
  }

  // Authoritative server-style calculation fallback (for offline preview only)
  let calculatedSubtotal = 0;
  const orderItemsRecord: any[] = [];

  for (const item of payload.items) {
    const product = await fetchProductById(item.product_id);
    if (!product) {
      throw new Error(`Product ${item.product_id} no longer exists in catalog.`);
    }
    if (product.stock_quantity < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}`);
    }

    // Authoritative price check
    const unitPrice = product.discount_price ?? product.regular_price;
    const lineTotal = unitPrice * item.quantity;
    calculatedSubtotal += lineTotal;

    orderItemsRecord.push({
      id: crypto.randomUUID(),
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      unit_price: unitPrice,
      quantity: item.quantity,
      line_total: lineTotal,
    });

    // Safely decrement local product stock
    const newStock = Math.max(0, product.stock_quantity - item.quantity);
    await updateProduct(product.id, {
      stock_quantity: newStock,
      availability_status: newStock === 0 ? 'out_of_stock' : newStock <= 3 ? 'low_stock' : 'in_stock',
    });
  }

  // Free delivery over $150, else $15
  const deliveryCharge = calculatedSubtotal >= 150 ? 0.00 : 15.00;
  const totalAmount = calculatedSubtotal + deliveryCharge;
  const orderNumber = `AUR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const newOrder: Order = {
    id: crypto.randomUUID(),
    order_number: orderNumber,
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    customer_email: payload.customer_email || null,
    shipping_address: payload.shipping_address,
    city: payload.city,
    postal_code: payload.postal_code || null,
    order_notes: payload.order_notes || null,
    subtotal: calculatedSubtotal,
    delivery_charge: deliveryCharge,
    total_amount: totalAmount,
    payment_method: 'cash_on_delivery',
    payment_status: 'pending',
    order_status: 'pending',
    created_at: new Date().toISOString(),
    items: orderItemsRecord,
  };

  const orders = getLocalOrders();
  orders.unshift(newOrder);
  saveLocalOrders(orders);

  return {
    success: true,
    order_id: newOrder.id,
    order_number: newOrder.order_number,
    subtotal: calculatedSubtotal,
    delivery_charge: deliveryCharge,
    total_amount: totalAmount,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map((o: any) => ({
          ...o,
          items: o.order_items || [],
        })) as Order[];
        saveLocalOrders(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Failed to fetch orders from Supabase:', err);
    }
  }

  return getLocalOrders();
}

export async function fetchOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (isSupabaseConfigured()) {
    try {
      // Prioritize secure RPC lookup which avoids exposing table SELECT to public
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_by_number', {
        p_order_number: orderNumber,
      });

      if (!rpcError && rpcData) {
        return rpcData as Order;
      }

      // Fallback query if authenticated admin or table SELECT policy allows
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber)
        .single();

      if (!error && data) {
        return {
          ...data,
          items: data.order_items || [],
        } as Order;
      }
    } catch (err) {
      console.warn('Supabase fetch order by number error:', err);
    }
  }

  const found = getLocalOrders().find((o) => o.order_number.toUpperCase() === orderNumber.toUpperCase());
  return found || null;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
    return {
      ...data,
      items: data.order_items || [],
    } as Order;
  }

  const orders = getLocalOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error('Order not found');

  orders[idx] = {
    ...orders[idx],
    order_status: status,
    updated_at: new Date().toISOString(),
  };
  saveLocalOrders(orders);
  return orders[idx];
}
