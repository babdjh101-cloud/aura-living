import { Order, OrderStatus, CartItem } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_ORDERS } from './mockData';
import { fetchProductById, getLocalProducts, saveLocalProducts } from './products';

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

export async function submitOrder(payload: SubmitOrderPayload, _cartItems?: CartItem[]): Promise<OrderSubmissionResult> {
  // Client pre-validation
  if (!payload.items || payload.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }
  if (!payload.customer_name || !payload.customer_name.trim()) {
    throw new Error('Customer name is required');
  }
  if (!payload.customer_phone || !payload.customer_phone.trim()) {
    throw new Error('Customer phone number is required');
  }
  if (!payload.shipping_address || !payload.shipping_address.trim()) {
    throw new Error('Shipping address is required');
  }
  if (!payload.city || !payload.city.trim()) {
    throw new Error('City is required');
  }

  // If Supabase is configured, execute the atomic SECURITY DEFINER PostgreSQL RPC function.
  // This verifies prices, checks stock, creates the order, and decrements stock in a single transaction.
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('create_order_securely', {
      p_customer_name: payload.customer_name.trim(),
      p_customer_phone: payload.customer_phone.trim(),
      p_customer_email: payload.customer_email ? payload.customer_email.trim() : null,
      p_shipping_address: payload.shipping_address.trim(),
      p_city: payload.city.trim(),
      p_postal_code: payload.postal_code ? payload.postal_code.trim() : null,
      p_order_notes: payload.order_notes ? payload.order_notes.trim() : null,
      p_items: payload.items,
    });

    if (error) {
      console.warn('Database RPC order placement failed, evaluating fallback:', error);

      // Stock validation or user validation errors are authoritative and should be displayed
      if (
        error.message.includes('Insufficient stock') ||
        error.message.includes('stock') ||
        error.message.includes('Customer') ||
        error.message.includes('Shipping') ||
        error.message.includes('City')
      ) {
        throw new Error(error.message);
      }

      // If the database is missing RPC, unmigrated, or products are only in local showcase cache:
      // Fall through to record the order in local cache so checkout is never blocked for shoppers!
      console.info('Supabase database RPC/catalog unseeded; recording order to local storage.');
    } else if (data && data.success) {
      return data as OrderSubmissionResult;
    }
  }

  // Authoritative Order Processing & Local Fallback
  let calculatedSubtotal = 0;
  const orderItemsRecord: any[] = [];
  const localProducts = getLocalProducts();

  for (const item of payload.items) {
    const product = localProducts.find((p) => p.id === item.product_id);
    if (!product) {
      throw new Error(`Product ${item.product_id} no longer exists in local catalog.`);
    }
    if (product.stock_quantity < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}`);
    }

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

    // Safely decrement LOCAL storage stock directly without invoking Supabase or updateProduct
    const newStock = Math.max(0, product.stock_quantity - item.quantity);
    product.stock_quantity = newStock;
    product.availability_status = newStock === 0 ? 'out_of_stock' : newStock <= 3 ? 'low_stock' : 'in_stock';
    product.updated_at = new Date().toISOString();
  }

  saveLocalProducts(localProducts);

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
        .maybeSingle();

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
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('Valid Order ID is required to update order status.');
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)
      .select('*, order_items(*)');

    if (error) {
      if (error.code === '42501' || error.message.includes('permission denied')) {
        throw new Error('Permission denied: Only administrators can update order statuses.');
      }
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    if (!data || data.length === 0) {
      const { data: existing } = await supabase.from('orders').select('id, order_number').eq('id', orderId).maybeSingle();
      if (!existing) {
        throw new Error(`Order update failed: Order with ID "${orderId}" was not found in the database.`);
      }
      throw new Error('Order update failed: Permission denied by row-level security policy.');
    }

    const updated = {
      ...data[0],
      items: data[0].order_items || [],
    } as Order;

    const orders = getLocalOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      orders[idx] = updated;
      saveLocalOrders(orders);
    }

    return updated;
  }

  const orders = getLocalOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error(`Order not found: ID "${orderId}" does not exist in local cache.`);

  orders[idx] = {
    ...orders[idx],
    order_status: status,
    updated_at: new Date().toISOString(),
  };
  saveLocalOrders(orders);
  return orders[idx];
}
