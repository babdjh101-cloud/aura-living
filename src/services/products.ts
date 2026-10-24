import { Product } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_PRODUCTS } from './mockData';
import { fetchCategories } from './categories';
import { deleteProductImage } from './storage';

const LOCAL_STORAGE_KEY = 'aura_products_cache';

export function getLocalProducts(): Product[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

export function saveLocalProducts(products: Product[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
}

export interface ProductFilterOptions {
  categorySlug?: string;
  search?: string;
  availability?: string;
  isFeatured?: boolean;
  sortBy?: 'featured' | 'newest' | 'price_asc' | 'price_desc';
  limit?: number;
  offset?: number;
}

export async function fetchProducts(options: ProductFilterOptions = {}): Promise<{
  products: Product[];
  total: number;
}> {
  const categories = await fetchCategories();

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('products')
        .select('*, categories(*)', { count: 'exact' });

      if (options.isFeatured) {
        query = query.eq('is_featured', true);
      }

      if (options.availability && options.availability !== 'all') {
        query = query.eq('availability_status', options.availability);
      }

      if (options.categorySlug && options.categorySlug !== 'all') {
        const cat = categories.find((c) => c.slug === options.categorySlug);
        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      }

      if (options.search && options.search.trim()) {
        const term = `%${options.search.trim()}%`;
        query = query.or(`name.ilike.${term},description.ilike.${term},sku.ilike.${term}`);
      }

      // Sorting
      switch (options.sortBy) {
        case 'price_asc':
          query = query.order('regular_price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('regular_price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'featured':
        default:
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
          break;
      }

      if (options.limit) {
        const from = options.offset || 0;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (!error && data) {
        if (data.length > 0) {
          const formatted = data.map((item: any) => ({
            ...item,
            category: item.categories || null,
          })) as Product[];
          return { products: formatted, total: count || formatted.length };
        }
        
        // If Supabase table is empty (e.g. newly initialized database before running seed data),
        // fallback to curated showcase products so the website is never blank.
        if (!options.search && (!options.categorySlug || options.categorySlug === 'all')) {
          console.info('Supabase products table is currently empty; displaying showcase products.');
        } else {
          return { products: [], total: 0 };
        }
      } else if (error) {
        console.warn('Supabase products query failed, using local cache:', error.message);
      }
    } catch (err) {
      console.warn('Supabase products fetch failed:', err);
    }
  }

  // Local storage fallback filtering
  let items = getLocalProducts().map((p) => ({
    ...p,
    category: categories.find((c) => c.id === p.category_id) || null,
  }));

  // Mirror RLS rule: hide unpublished products for public catalog browsing
  items = items.filter((p) => p.is_published !== false);

  if (options.isFeatured) {
    items = items.filter((p) => p.is_featured);
  }

  if (options.availability && options.availability !== 'all') {
    items = items.filter((p) => p.availability_status === options.availability);
  }

  if (options.categorySlug && options.categorySlug !== 'all') {
    items = items.filter((p) => p.category?.slug === options.categorySlug);
  }

  if (options.search && options.search.trim()) {
    const s = options.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s)
    );
  }

  switch (options.sortBy) {
    case 'price_asc':
      items.sort((a, b) => (a.discount_price ?? a.regular_price) - (b.discount_price ?? b.regular_price));
      break;
    case 'price_desc':
      items.sort((a, b) => (b.discount_price ?? b.regular_price) - (a.discount_price ?? a.regular_price));
      break;
    case 'newest':
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'featured':
    default:
      items.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
      break;
  }

  const total = items.length;
  if (options.limit) {
    const from = options.offset || 0;
    items = items.slice(from, from + options.limit);
  }

  return { products: items, total };
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const categories = await fetchCategories();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        return {
          ...data,
          category: data.categories || null,
        } as Product;
      }
    } catch (err) {
      console.warn('Supabase product query error:', err);
    }
  }

  const item = getLocalProducts().find((p) => p.slug === slug);
  if (!item) return null;
  return {
    ...item,
    category: categories.find((c) => c.id === item.category_id) || null,
  };
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const categories = await fetchCategories();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          ...data,
          category: data.categories || null,
        } as Product;
      }
    } catch (err) {
      console.warn('Supabase product query error:', err);
    }
  }

  const item = getLocalProducts().find((p) => p.id === id);
  if (!item) return null;
  return {
    ...item,
    category: categories.find((c) => c.id === item.category_id) || null,
  };
}

function sanitizeProductPayload(updates: Record<string, any>): Record<string, any> {
  const allowedColumns = [
    'name',
    'slug',
    'sku',
    'description',
    'category_id',
    'regular_price',
    'discount_price',
    'main_image',
    'additional_images',
    'stock_quantity',
    'availability_status',
    'is_featured',
    'is_published',
  ];
  const cleaned: Record<string, any> = {};
  for (const key of allowedColumns) {
    if (key in updates && updates[key] !== undefined) {
      cleaned[key] = updates[key];
    }
  }
  return cleaned;
}

export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>
): Promise<Product> {
  const cleaned = sanitizeProductPayload(productData as Record<string, any>);

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('products')
      .insert([cleaned])
      .select('*, categories(*)');

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Failed to create product: A product with this SKU or slug already exists (${error.message}).`);
      }
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('row-level security')) {
        throw new Error(
          'Failed to create product: Permission denied. Your account is not recognized as an administrator in the database.'
        );
      }
      throw new Error(`Failed to create product: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create product: No record returned from database.');
    }

    const created = {
      ...data[0],
      category: data[0].categories || null,
    } as Product;

    const list = getLocalProducts();
    list.unshift(created);
    saveLocalProducts(list);
    return created;
  }

  const newProduct: Product = {
    ...productData,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = getLocalProducts();
  list.unshift(newProduct);
  saveLocalProducts(list);
  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'created_at' | 'category'>>
): Promise<Product> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid Product ID is required to update a product.');
  }

  const cleanedUpdates = sanitizeProductPayload(updates as Record<string, any>);

  if (isSupabaseConfigured()) {
    // Execute update without blind .single() to inspect returned row count
    const { data, error } = await supabase
      .from('products')
      .update(cleanedUpdates)
      .eq('id', id)
      .select('*, categories(*)');

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Failed to update product: A product with this SKU or slug already exists (${error.message}).`);
      }
      if (error.code === '23503') {
        throw new Error(`Failed to update product: The selected category does not exist in the database (${error.message}).`);
      }
      throw new Error(`Failed to update product: ${error.message}`);
    }

    // Explicitly verify exactly 1 row was updated
    if (!data || data.length === 0) {
      // 0 rows updated: Diagnosing the exact root cause
      // 1. Check if product exists in public.products table
      const { data: existingRow, error: checkErr } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', id)
        .maybeSingle();

      if (!existingRow) {
        throw new Error(
          `Product update failed: Product with ID "${id}" was not found in the database. ` +
          `If this product is from local fallback demo data, please insert it via the Admin Panel or run seed migrations.`
        );
      }

      // 2. Product exists, so RLS policy blocked the update
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(
          `Product update failed: Permission denied. No authenticated administrator session found. Please log in.`
        );
      }

      // 3. User is authenticated, check if in admin_users roster
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!adminRecord) {
        throw new Error(
          `Product update failed: Permission denied. Your account (${session.user.email || session.user.id}) ` +
          `is not registered in the 'admin_users' table. An existing super admin must grant you admin access.`
        );
      }

      throw new Error(
        `Product update failed: Row-level security prevented modifying product "${existingRow.name}" (ID: ${id}).`
      );
    }

    if (data.length > 1) {
      throw new Error(
        `Product update integrity error: Expected 1 updated product, but ${data.length} were returned.`
      );
    }

    const updatedProduct = {
      ...data[0],
      category: data[0].categories || null,
    } as Product;

    // Keep local cache synchronized
    const list = getLocalProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = updatedProduct;
      saveLocalProducts(list);
    }

    return updatedProduct;
  }

  // Fallback for offline demo mode
  const list = getLocalProducts();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) {
    throw new Error(`Product not found: ID "${id}" does not exist in local inventory.`);
  }

  list[idx] = {
    ...list[idx],
    ...cleanedUpdates,
    updated_at: new Date().toISOString(),
  };
  saveLocalProducts(list);
  return list[idx];
}

export async function deleteProduct(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Valid Product ID is required to delete a product.');
  }

  const existing = await fetchProductById(id);
  if (existing?.main_image) {
    try {
      await deleteProductImage(existing.main_image);
    } catch (err) {
      console.warn('Storage cleanup non-critical error:', err);
    }
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      if (error.code === '42501' || error.message.includes('permission denied')) {
        throw new Error('Permission denied: Administrator privileges required to delete products.');
      }
      throw new Error(`Failed to delete product: ${error.message}`);
    }

    if (!data || data.length === 0) {
      // Check if product exists or was blocked
      const { data: existingRow } = await supabase.from('products').select('id').eq('id', id).maybeSingle();
      if (!existingRow) {
        throw new Error(`Product delete failed: Product with ID "${id}" was not found in the database.`);
      }
      throw new Error('Product delete failed: Permission denied by row-level security policy.');
    }

    const list = getLocalProducts().filter((p) => p.id !== id);
    saveLocalProducts(list);
    return;
  }

  const list = getLocalProducts().filter((p) => p.id !== id);
  saveLocalProducts(list);
}
