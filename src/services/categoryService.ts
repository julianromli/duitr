import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  id_name: string;
  en_name: string;
  type: 'income' | 'expense';
  icon?: string;
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
export const getCategoriesByType = async (type: 'income' | 'expense'): Promise<Category[]> => {
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
 * @param id The UUID of the category
 * @returns The category object or null if not found
 */
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned means category not found
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

/**
 * Get category name in current language
 * @param id Category UUID
 * @param language Current language code (en or id)
 * @returns Localized category name
 */
export async function getCategoryName(id: string, language: string = 'id'): Promise<string> {
  if (!id) return 'Other';
  
  const category = await getCategoryById(id);
  if (!category) return 'Other';
  
  return language === 'id' ? category.id_name : category.en_name;
} 