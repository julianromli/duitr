
// Service: categoryService
// Description: Handles category data operations with Supabase
// Enhanced getCategoryById function with overloaded signatures for flexibility

import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/categories';
import { transformCategory } from '@/types/categories';

export async function fetchCategories(userId?: string): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*');

  if (userId) {
    // Fetch both default categories (user_id IS NULL) and user's custom categories
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    // If no userId provided, fetch only default categories
    query = query.is('user_id', null);
  }

  query = query.order('type').order('id_name');

  const { data, error } = await query;

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

export async function fetchCategoriesByType(type: string, userId?: string): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('type', type);

  if (userId) {
    // Fetch both default categories (user_id IS NULL) and user's custom categories
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    // If no userId provided, fetch only default categories
    query = query.is('user_id', null);
  }

  query = query.order('id_name');

  const { data, error } = await query;

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

export async function updateCategoryIcon(categoryId: string, icon: string, userId?: string): Promise<void> {
  // Convert string ID back to number for database
  const numericId = parseInt(categoryId, 10);
  
  let query = supabase
    .from('categories')
    .update({ icon })
    .eq('category_id', numericId);

  // If userId is provided, ensure user can only update their own categories
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;

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
