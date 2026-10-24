import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchProducts } from './products';
import { fetchOrders } from './orders';
import { Order, Product } from '../types';

export interface AdminMetrics {
  totalProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
  lowStockItems: Product[];
}

export async function checkIsAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data && (data.role === 'admin' || data.role === 'super_admin')) {
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error checking admin status:', err);
      return false;
    }
  }

  // Fallback demo mode check (for testing before Supabase configuration)
  return true;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [{ products }, orders] = await Promise.all([
    fetchProducts({ limit: 100 }),
    fetchOrders(),
  ]);

  const lowStockItems = products.filter(
    (p) => p.stock_quantity <= 3 || p.availability_status === 'low_stock' || p.availability_status === 'out_of_stock'
  );

  const pendingOrders = orders.filter((o) => o.order_status === 'pending');
  const totalRevenue = orders
    .filter((o) => o.order_status !== 'cancelled')
    .reduce((acc, curr) => acc + Number(curr.total_amount), 0);

  return {
    totalProducts: products.length,
    lowStockProducts: lowStockItems.length,
    totalOrders: orders.length,
    pendingOrders: pendingOrders.length,
    totalRevenue,
    recentOrders: orders.slice(0, 5),
    lowStockItems: lowStockItems.slice(0, 5),
  };
}
