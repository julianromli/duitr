
// Service: categoryService
// Description: Handles category data operations with Supabase
// Enhanced getCategoryById function with overloaded signatures for flexibility

import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/categories';
import { transformCategory } from '@/types/categories';
import { DEFAULT_CATEGORIES } from '@/utils/categoryUtils';

// Helper function to get default categories as fallback
function getDefaultCategoriesAsFallback(): Category[] {
  const allCategories = [
    ...DEFAULT_CATEGORIES.expense,
    ...DEFAULT_CATEGORIES.income,
    ...DEFAULT_CATEGORIES.system
  ];
  
  return allCategories.map(cat => ({
    id: cat.id,
    category_id: parseInt(cat.id),
    en_name: cat.name,
    id_name: cat.name,
    type: cat.category_key.split('_')[0],
    category_key: cat.category_key,
    icon: 'circle',
    color: '#6B7280',
    user_id: null,
    created_at: new Date().toISOString()
  }));
}

// Helper function to get default categories by type
function getDefaultCategoriesByType(type: string): Category[] {
  const typeCategories = DEFAULT_CATEGORIES[type as keyof typeof DEFAULT_CATEGORIES] || [];
  
  return typeCategories.map(cat => ({
    id: cat.id,
    category_id: parseInt(cat.id),
    en_name: cat.name,
    id_name: cat.name,
    type: type,
    category_key: cat.category_key,
    icon: 'circle',
    color: '#6B7280',
    user_id: null,
    created_at: new Date().toISOString()
  }));
}

export async function fetchCategories(userId?: string): Promise<Category[]> {
  try {
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
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01' || error.message.includes('relation "categories" does not exist')) {
        console.warn('Categories table does not exist, using default categories');
        return getDefaultCategoriesAsFallback();
      }
      console.error('Error fetching categories:', error);
      throw error;
    }

    // Transform database format to app format and ensure id field exists
    return (data || []).map(item => transformCategory({
      ...item,
      id: item.category_id?.toString() || item.id || ''
    }));
  } catch (error: any) {
    // Handle any other errors including network issues
    if (error.code === '42P01' || error.message?.includes('relation "categories" does not exist')) {
      console.warn('Categories table does not exist, using default categories');
      return getDefaultCategoriesAsFallback();
    }
    console.error('Error in fetchCategories:', error);
    return getDefaultCategoriesAsFallback();
  }
}

export async function fetchCategoriesByType(type: string, userId?: string): Promise<Category[]> {
  try {
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
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01' || error.message.includes('relation "categories" does not exist')) {
        console.warn('Categories table does not exist, using default categories for type:', type);
        return getDefaultCategoriesByType(type);
      }
      console.error('Error fetching categories by type:', error);
      throw error;
    }

    // Transform database format to app format and ensure id field exists
    return (data || []).map(item => transformCategory({
      ...item,
      id: item.category_id?.toString() || item.id || ''
    }));
  } catch (error: any) {
    // Handle any other errors including network issues
    if (error.code === '42P01' || error.message?.includes('relation "categories" does not exist')) {
      console.warn('Categories table does not exist, using default categories for type:', type);
      return getDefaultCategoriesByType(type);
    }
    console.error('Error in fetchCategoriesByType:', error);
    return getDefaultCategoriesByType(type);
  }
}

export async function updateCategoryIcon(categoryId: string, icon: string, userId?: string): Promise<void> {
  try {
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
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01' || error.message.includes('relation "categories" does not exist')) {
        console.warn('Categories table does not exist, cannot update category icon');
        return; // Silently fail for missing table
      }
      console.error('Error updating category icon:', error);
      throw error;
    }
  } catch (error: any) {
    // Handle any other errors including network issues
    if (error.code === '42P01' || error.message?.includes('relation "categories" does not exist')) {
      console.warn('Categories table does not exist, cannot update category icon');
      return; // Silently fail for missing table
    }
    console.error('Error in updateCategoryIcon:', error);
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
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01' || error.message.includes('relation "categories" does not exist')) {
        console.warn('Categories table does not exist, using default category fallback');
        const defaultCategories = getDefaultCategoriesAsFallback();
        return defaultCategories.find(cat => cat.id === searchId || cat.category_id?.toString() === searchId);
      }
      console.warn('Error fetching category by ID:', error);
      return undefined;
    }

    return data ? transformCategory(data) : undefined;
  } catch (error: any) {
    // Handle any other errors including network issues
    if (error.code === '42P01' || error.message?.includes('relation "categories" does not exist')) {
      console.warn('Categories table does not exist, using default category fallback');
      const defaultCategories = getDefaultCategoriesAsFallback();
      return defaultCategories.find(cat => cat.id === searchId || cat.category_id?.toString() === searchId);
    }
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
