
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

export async function getCategoryById(categories: Category[], id: string | number): Promise<Category | undefined> {
  const searchId = typeof id === 'string' ? id : id.toString();
  return categories.find(cat => cat.id === searchId || cat.category_id?.toString() === searchId);
}
