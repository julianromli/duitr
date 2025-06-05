
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

  // Transform database format to app format
  return (data || []).map(transformCategory);
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

  // Transform database format to app format
  return (data || []).map(transformCategory);
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
