import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchProducts } from './products';
import { fetchOrders } from './orders';
import { Order, Product } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './mockData';

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
      // 1. Session user/app metadata check
      const { data: { session } } = await supabase.auth.getSession();
      const userMetaRole = session?.user?.user_metadata?.role;
      const appMetaRole = session?.user?.app_metadata?.role;
      if (
        userMetaRole === 'admin' ||
        userMetaRole === 'super_admin' ||
        appMetaRole === 'admin' ||
        appMetaRole === 'super_admin'
      ) {
        return true;
      }

      // 2. RPC function check (if installed)
      try {
        const { data: rpcAdmin } = await supabase.rpc('is_admin');
        if (rpcAdmin === true) return true;
      } catch {
        // RPC might not exist yet before migration
      }

      // 3. Database admin_users table check
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data && (data.role === 'admin' || data.role === 'super_admin')) {
        return true;
      }

      // 4. If table is empty or unseeded, gracefully allow first authenticated user
      const { count } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
      if (count === 0) {
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

export async function seedSupabaseInitialData(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase is not configured in environment variables.' };
  }

  try {
    // 1. Seed categories
    const categoriesPayload = INITIAL_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image_url: c.image_url,
      display_order: c.display_order,
    }));

    const { error: catErr } = await supabase.from('categories').upsert(categoriesPayload, { onConflict: 'slug' });
    if (catErr) {
      return { success: false, message: `Failed to seed categories: ${catErr.message}` };
    }

    // 2. Seed products
    const productsPayload = INITIAL_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description,
      category_id: p.category_id,
      regular_price: p.regular_price,
      discount_price: p.discount_price,
      main_image: p.main_image,
      additional_images: p.additional_images || [],
      stock_quantity: p.stock_quantity,
      availability_status: p.availability_status,
      is_featured: p.is_featured,
      is_published: true,
    }));

    const { error: prodErr } = await supabase.from('products').upsert(productsPayload, { onConflict: 'slug' });
    if (prodErr) {
      return { success: false, message: `Categories seeded, but failed to seed products: ${prodErr.message}` };
    }

    return {
      success: true,
      message: `Successfully populated ${INITIAL_CATEGORIES.length} categories and ${INITIAL_PRODUCTS.length} products into Supabase!`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Unexpected error while seeding Supabase.' };
  }
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
