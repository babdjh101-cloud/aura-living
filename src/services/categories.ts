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
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
    return data as Category;
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
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
    return data as Category;
  }

  const list = getLocalCategories();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Category not found');
  list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
  saveLocalCategories(list);
  return list[idx];
}

export async function deleteCategory(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete category: ${error.message}`);
    return;
  }

  const list = getLocalCategories().filter((c) => c.id !== id);
  saveLocalCategories(list);
}
