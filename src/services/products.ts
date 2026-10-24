import { Product } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './mockData';
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
        
        // If query returned 0 rows, check whether the entire Supabase table is empty (unseeded)
        // or if it's just this specific filter that has no matches.
        const hasFilters = Boolean(
          (options.search && options.search.trim()) ||
          (options.categorySlug && options.categorySlug !== 'all') ||
          options.isFeatured
        );

        if (hasFilters) {
          try {
            const { count: overallCount } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true });

            if (overallCount && overallCount > 0) {
              // Real empty filter result in an actively populated database
              return { products: [], total: 0 };
            }
          } catch {
            // Table might not exist or error, fallback to showcase
          }
        }
        // Database as a whole has 0 products: fallback to curated showcase products so the website is never blank.
        console.info('Supabase products table is unseeded or empty; displaying curated catalog.');
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
        .maybeSingle();

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
        .maybeSingle();

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

/**
 * Validates whether a category_id exists in the database categories table before insertion/update.
 * If the category does not exist in the database, it attempts to provision the category from
 * default initial categories. If it still cannot be satisfied, returns null to avoid foreign key violations.
 */
export async function ensureCategoryIdValid(categoryId: string | null | undefined): Promise<string | null> {
  if (!categoryId || typeof categoryId !== 'string' || categoryId.trim() === '') {
    return null;
  }

  const trimmedId = categoryId.trim();

  if (!isSupabaseConfigured()) {
    return trimmedId;
  }

  try {
    // 1. Check if category exists directly by ID in Supabase
    const { data: directMatch, error: directErr } = await supabase
      .from('categories')
      .select('id')
      .eq('id', trimmedId)
      .maybeSingle();

    if (!directErr && directMatch) {
      return directMatch.id;
    }

    // 2. ID not found directly in Supabase categories table.
    // Check if it matches an initial category by ID or slug.
    const matchingInitial =
      INITIAL_CATEGORIES.find((c) => c.id === trimmedId || c.slug === trimmedId);

    if (matchingInitial) {
      // Check if this category exists by slug in Supabase (with potentially different UUID)
      const { data: catBySlug } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', matchingInitial.slug)
        .maybeSingle();

      if (catBySlug) {
        return catBySlug.id;
      }

      // Try inserting the category into Supabase so the foreign key constraint is satisfied
      const { data: inserted, error: insertErr } = await supabase
        .from('categories')
        .upsert(
          {
            id: matchingInitial.id,
            name: matchingInitial.name,
            slug: matchingInitial.slug,
            description: matchingInitial.description || '',
            image_url: matchingInitial.image_url || '',
            display_order: matchingInitial.display_order || 0,
          },
          { onConflict: 'slug' }
        )
        .select('id')
        .maybeSingle();

      if (!insertErr && inserted) {
        return inserted.id;
      }
    }

    // 3. Fallback: Check if ANY valid category exists in Supabase
    const { data: anyCategory } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (anyCategory) {
      console.warn(`Category "${trimmedId}" not found in Supabase. Linking to existing category "${anyCategory.id}".`);
      return anyCategory.id;
    }

    // 4. Categories table is empty or category cannot be satisfied:
    // Return null to avoid Postgres products_category_id_fkey foreign key constraint violation
    console.warn(`Category "${trimmedId}" does not exist in Supabase. Using null to avoid foreign key violation.`);
    return null;
  } catch (err) {
    console.warn('Category foreign key validation error:', err);
    return null;
  }
}

export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>
): Promise<Product> {
  const cleaned = sanitizeProductPayload(productData as Record<string, any>);

  if (isSupabaseConfigured()) {
    if (cleaned.category_id) {
      cleaned.category_id = await ensureCategoryIdValid(cleaned.category_id);
    }

    const { data, error } = await supabase
      .from('products')
      .insert([cleaned])
      .select('*, categories(*)');

    if (error) {
      // Foreign key violation recovery: retry with category_id = null so product creation never fails
      if (error.code === '23503') {
        console.warn('Foreign key violation on category_id during createProduct; retrying with category_id = null');
        const fallbackPayload = { ...cleaned, category_id: null };
        const { data: retryData, error: retryErr } = await supabase
          .from('products')
          .insert([fallbackPayload])
          .select('*, categories(*)');

        if (!retryErr && retryData && retryData.length > 0) {
          const created = {
            ...retryData[0],
            category: null,
          } as Product;
          const list = getLocalProducts();
          list.unshift(created);
          saveLocalProducts(list);
          return created;
        }
      }

      const isLocalAdmin = typeof window !== 'undefined' && Boolean(localStorage.getItem('aura_local_admin_session'));
      if (isLocalAdmin) {
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
    if (cleanedUpdates.category_id !== undefined) {
      cleanedUpdates.category_id = await ensureCategoryIdValid(cleanedUpdates.category_id);
    }

    // Execute update without blind .single() to inspect returned row count
    const { data, error } = await supabase
      .from('products')
      .update(cleanedUpdates)
      .eq('id', id)
      .select('*, categories(*)');

    if (error) {
      // Foreign key violation recovery: retry with category_id = null so product update never crashes
      if (error.code === '23503') {
        console.warn('Foreign key violation on category_id during updateProduct; retrying with category_id = null');
        const fallbackUpdates = { ...cleanedUpdates, category_id: null };
        const { data: retryData, error: retryErr } = await supabase
          .from('products')
          .update(fallbackUpdates)
          .eq('id', id)
          .select('*, categories(*)');

        if (!retryErr && retryData && retryData.length > 0) {
          const updatedProduct = {
            ...retryData[0],
            category: null,
          } as Product;
          const list = getLocalProducts();
          const idx = list.findIndex((p) => p.id === id);
          if (idx !== -1) {
            list[idx] = updatedProduct;
            saveLocalProducts(list);
          }
          return updatedProduct;
        }
      }

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
        // If this product is present in local cache (e.g. initial demo showcase), update the local cache
        const localList = getLocalProducts();
        const localIdx = localList.findIndex((p) => p.id === id);
        if (localIdx !== -1) {
          localList[localIdx] = {
            ...localList[localIdx],
            ...cleanedUpdates,
            updated_at: new Date().toISOString(),
          };
          saveLocalProducts(localList);
          return localList[localIdx];
        }

        throw new Error(
          `Product update failed: Product with ID "${id}" was not found in the database. ` +
          `If this product is from local fallback demo data, please insert it via the Admin Panel or run seed migrations.`
        );
      }

      // 2. Product exists in DB, but update returned 0 rows
      const isLocalAdmin = typeof window !== 'undefined' && Boolean(localStorage.getItem('aura_local_admin_session'));
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (isLocalAdmin) {
          const localList = getLocalProducts();
          const localIdx = localList.findIndex((p) => p.id === id);
          if (localIdx !== -1) {
            localList[localIdx] = {
              ...localList[localIdx],
              ...cleanedUpdates,
              updated_at: new Date().toISOString(),
            };
            saveLocalProducts(localList);
            return localList[localIdx];
          }
        }
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
        // Product was only in local store cache
        const list = getLocalProducts().filter((p) => p.id !== id);
        saveLocalProducts(list);
        return;
      }
      const isLocalAdmin = typeof window !== 'undefined' && Boolean(localStorage.getItem('aura_local_admin_session'));
      if (isLocalAdmin) {
        const list = getLocalProducts().filter((p) => p.id !== id);
        saveLocalProducts(list);
        return;
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
