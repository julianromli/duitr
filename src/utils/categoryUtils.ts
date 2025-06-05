
// Utility functions for category operations
import { Category } from '@/types/categories';

export const getCategoryById = (categories: Category[], id: string | number): Category | undefined => {
  const searchId = typeof id === 'string' ? id : id.toString();
  return categories.find(cat => cat.id === searchId || cat.category_id?.toString() === searchId);
};

export const getCategoryDisplayName = (category: Category | undefined): string => {
  return category?.id_name || category?.en_name || 'Unknown';
};

export const filterCategoriesByType = (categories: Category[], type: string): Category[] => {
  return categories.filter(cat => cat.type === type);
};
