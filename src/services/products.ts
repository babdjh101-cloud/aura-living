import { Product } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_PRODUCTS } from './mockData';
import { fetchCategories } from './categories';
import { deleteProductImage } from './storage';

const LOCAL_STORAGE_KEY = 'aura_products_cache';

function getLocalProducts(): Product[] {
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

function saveLocalProducts(products: Product[]) {
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
        const formatted = data.map((item: any) => ({
          ...item,
          category: item.categories || null,
        })) as Product[];
        return { products: formatted, total: count || formatted.length };
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

export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>
): Promise<Product> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select('*, categories(*)')
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
    return {
      ...data,
      category: data.categories || null,
    } as Product;
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
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*, categories(*)')
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
    return {
      ...data,
      category: data.categories || null,
    } as Product;
  }

  const list = getLocalProducts();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Product not found');

  list[idx] = {
    ...list[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveLocalProducts(list);
  return list[idx];
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await fetchProductById(id);
  if (existing?.main_image) {
    try {
      await deleteProductImage(existing.main_image);
    } catch (err) {
      console.warn('Storage cleanup non-critical error:', err);
    }
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
    return;
  }

  const list = getLocalProducts().filter((p) => p.id !== id);
  saveLocalProducts(list);
}
