export type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  display_order: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  category_id: string | null;
  category?: Category | null;
  regular_price: number;
  discount_price: number | null;
  main_image: string;
  additional_images: string[];
  stock_quantity: number;
  availability_status: AvailabilityStatus;
  is_featured: boolean;
  is_published?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedPrice: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string | null;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  city: string;
  postal_code?: string | null;
  order_notes?: string | null;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  payment_method: 'cash_on_delivery';
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string | null;
  role: 'admin' | 'super_admin';
  created_at: string;
}
