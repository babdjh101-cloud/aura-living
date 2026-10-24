import { Category } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_CATEGORIES } from './mockData';

const LOCAL_STORAGE_KEY = 'aura_categories_cache';

function getLocalCategories(): Category[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
  return INITIAL_CATEGORIES;
}

function saveLocalCategories(cats: Category[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cats));
}

export async function fetchCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.warn('Supabase categories error, falling back to cached seed data:', error.message);
        return getLocalCategories();
      }
      if (data && data.length > 0) {
        saveLocalCategories(data);
        return data as Category[];
      }
    } catch (err) {
      console.warn('Failed to query Supabase categories:', err);
    }
  }
  return getLocalCategories();
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await fetchCategories();
  return categories.find((c) => c.slug === slug) || null;
}

export async function createCategory(cat: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('categories')
      .insert([cat])
      .select();

    if (error) {
      const isLocalAdmin = typeof window !== 'undefined' && Boolean(localStorage.getItem('aura_local_admin_session'));
      if (isLocalAdmin) {
        const newCat: Category = {
          ...cat,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const list = getLocalCategories();
        list.push(newCat);
        saveLocalCategories(list);
        return newCat;
      }
      if (error.code === '42501' || error.message.includes('permission denied')) {
        throw new Error('Permission denied: Administrator privileges required to create categories.');
      }
      if (error.code === '23505') {
        throw new Error(`Category creation failed: A category with this slug or name already exists.`);
      }
      throw new Error(`Failed to create category: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create category: Database did not return inserted record. Check administrator permissions.');
    }

    return data[0] as Category;
  }

  const newCat: Category = {
    ...cat,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const list = getLocalCategories();
  list.push(newCat);
  saveLocalCategories(list);
  return newCat;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  if (!id || typeof id !== 'string') {
    throw new Error('Valid Category ID is required to update a category.');
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      const isLocalAdmin = typeof window !== 'undefined' && Boolean(localStorage.getItem('aura_local_admin_session'));
      if (isLocalAdmin) {
        const list = getLocalCategories();
        const idx = list.findIndex((c) => c.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
          saveLocalCategories(list);
          return list[idx];
        }
      }
      if (error.code === '23505') {
        throw new Error(`A category with this name or slug already exists: ${error.message}`);
      }
      if (error.code === '42501' || error.message.includes('permission denied')) {
        throw new Error('Permission denied: Administrator privileges required to update categories.');
      }
      throw new Error(`Failed to update category: ${error.message}`);
    }

    if (!data || data.length === 0) {
      const { data: existing } = await supabase.from('categories').select('id, name').eq('id', id).maybeSingle();
      const isLocalAdmin = typeof window !== 'undefined' && Boolean(localStorage.getItem('aura_local_admin_session'));
      if (!existing || isLocalAdmin) {
        const list = getLocalCategories();
        const idx = list.findIndex((c) => c.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
          saveLocalCategories(list);
          return list[idx];
        }
        if (!existing) {
          throw new Error(`Category update failed: Category with ID "${id}" was not found in the database.`);
        }
      }
      throw new Error('Category update failed: Permission denied by row-level security policy.');
    }

    const updated = data[0] as Category;
    const list = getLocalCategories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      list[idx] = updated;
      saveLocalCategories(list);
    }
    return updated;
  }

  const list = getLocalCategories();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Category not found');
  list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
  saveLocalCategories(list);
  return list[idx];
}

export async function deleteCategory(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Valid Category ID is required to delete a category.');
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('categories').delete().eq('id', id).select('id');
    if (error) {
      const isLocalAdmin = typeof window !== 'undefined' && Boolean(localStorage.getItem('aura_local_admin_session'));
      if (isLocalAdmin) {
        const list = getLocalCategories().filter((c) => c.id !== id);
        saveLocalCategories(list);
        return;
      }
      if (error.code === '42501' || error.message.includes('permission denied')) {
        throw new Error('Permission denied: Administrator privileges required to delete categories.');
      }
      throw new Error(`Failed to delete category: ${error.message}`);
    }

    if (!data || data.length === 0) {
      const { data: existing } = await supabase.from('categories').select('id').eq('id', id).maybeSingle();
      const isLocalAdmin = typeof window !== 'undefined' && Boolean(localStorage.getItem('aura_local_admin_session'));
      if (!existing || isLocalAdmin) {
        const list = getLocalCategories().filter((c) => c.id !== id);
        saveLocalCategories(list);
        return;
      }
      throw new Error('Category delete failed: Permission denied by row-level security policy.');
    }

    const list = getLocalCategories().filter((c) => c.id !== id);
    saveLocalCategories(list);
    return;
  }

  const list = getLocalCategories().filter((c) => c.id !== id);
  saveLocalCategories(list);
}
