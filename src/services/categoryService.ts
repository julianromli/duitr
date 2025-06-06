
// Service: categoryService
// Description: Handles category data operations with Supabase
// Enhanced getCategoryById function with overloaded signatures for flexibility

import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/categories';
import { transformCategory } from '@/types/categories';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id_name');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  // Transform database format to app format and ensure id field exists
  return (data || []).map(item => transformCategory({
    ...item,
    id: item.category_id?.toString() || item.id || ''
  }));
}

export async function fetchCategoriesByType(type: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('type', type)
    .order('id_name');

  if (error) {
    console.error('Error fetching categories by type:', error);
    throw error;
  }

  // Transform database format to app format and ensure id field exists
  return (data || []).map(item => transformCategory({
    ...item,
    id: item.category_id?.toString() || item.id || ''
  }));
}

export async function updateCategoryIcon(categoryId: string, icon: string): Promise<void> {
  // Convert string ID back to number for database
  const numericId = parseInt(categoryId, 10);
  
  const { error } = await supabase
    .from('categories')
    .update({ icon })
    .eq('category_id', numericId);

  if (error) {
    console.error('Error updating category icon:', error);
    throw error;
  }
}

// Overloaded function - can be called with or without categories array
export async function getCategoryById(id: string | number): Promise<Category | undefined>;
export async function getCategoryById(categories: Category[], id: string | number): Promise<Category | undefined>;
export async function getCategoryById(categoriesOrId: Category[] | string | number, id?: string | number): Promise<Category | undefined> {
  // If first parameter is an array, use the old signature
  if (Array.isArray(categoriesOrId) && id !== undefined) {
    const searchId = typeof id === 'string' ? id : id.toString();
    return categoriesOrId.find(cat => cat.id === searchId || cat.category_id?.toString() === searchId);
  }

  // If first parameter is not an array, fetch from database
  const categoryId = categoriesOrId as string | number;
  const searchId = typeof categoryId === 'string' ? categoryId : categoryId.toString();

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`category_id.eq.${searchId},id.eq.${searchId}`)
      .single();

    if (error) {
      console.warn('Error fetching category by ID:', error);
      return undefined;
    }

    return data ? transformCategory(data) : undefined;
  } catch (error) {
    console.warn('Error in getCategoryById:', error);
    return undefined;
  }
}

// Updated function to match new signature
export const getLocalizedCategoryNameById = (categories: Category[], categoryId: string | number): string => {
  const searchId = typeof categoryId === 'string' ? categoryId : categoryId.toString();
  const category = categories.find(cat => cat.id === searchId || cat.category_id?.toString() === searchId);
  return category?.id_name || category?.en_name || 'Unknown';
};
