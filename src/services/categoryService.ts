import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string | number;
  category_id?: number;
  category_key?: string;
  id_name: string;
  en_name: string;
  type?: 'income' | 'expense' | 'system';
  icon?: string;
  created_at?: string;
}

/**
 * Get all categories from the database
 * @returns A list of categories
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id_name');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get categories filtered by type
 * @param type Category type ('income' or 'expense')
 * @returns A list of categories of the specified type
 */
export const getCategoriesByType = async (type: 'income' | 'expense' | 'system'): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', type)
      .order('id_name');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching ${type} categories:`, error);
    throw error;
  }
};

/**
 * Get a single category by ID
 * @param id The UUID or integer ID of the category
 * @returns The category object or null if not found
 */
export const getCategoryById = async (id: string | number): Promise<Category | null> => {
  try {
    let query;
    
    if (typeof id === 'number' || !isNaN(Number(id))) {
      query = supabase
        .from('categories')
        .select('*')
        .eq('category_id', id)
        .single();
    } else if (typeof id === 'string' && id.includes('_')) {
      query = supabase
        .from('categories')
        .select('*')
        .eq('category_key', id)
        .single();
    } else {
      query = supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
    }
    
    const { data, error } = await query;
      
    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`Category not found with ID: ${id}`);
        return null;
      }
      
      // For other errors, log but don't throw to avoid breaking the app
      console.error(`Database error fetching category: ${error.message}`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
};

/**
 * Get category name in current language
 * @param id Category UUID or integer ID
 * @param language Current language code (en or id)
 * @returns Localized category name
 */
export async function getCategoryName(id: string | number, language: string = 'id'): Promise<string> {
  if (!id) return 'Other';
  
  if (typeof id === 'string' && id.includes('_')) {
    const parts = id.split('_');
    if (parts.length > 1) {
      const categoryName = parts[1];
      return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    }
  }
  
  try {
    const category = await getCategoryById(id);
    if (!category) {
      console.warn(`Category not found for ID: ${id}, returning default name`);
      return 'Other';
    }
    
    return language === 'id' ? category.id_name : category.en_name;
  } catch (error) {
    console.error(`Error getting category name for ID: ${id}`, error);
    return 'Other';
  }
} 