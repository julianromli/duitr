
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

// Legacy utility functions for backwards compatibility
export const DEFAULT_CATEGORIES = [
  { id: '1', en_name: 'Food & Drinks', id_name: 'Makanan & Minuman', type: 'expense', category_key: 'expense_food' },
  { id: '2', en_name: 'Transportation', id_name: 'Transportasi', type: 'expense', category_key: 'expense_transport' },
  { id: '3', en_name: 'Shopping', id_name: 'Belanja', type: 'expense', category_key: 'expense_shopping' },
  { id: '4', en_name: 'Entertainment', id_name: 'Hiburan', type: 'expense', category_key: 'expense_entertainment' },
  { id: '5', en_name: 'Bills & Utilities', id_name: 'Tagihan & Utilitas', type: 'expense', category_key: 'expense_bills' },
  { id: '6', en_name: 'Healthcare', id_name: 'Kesehatan', type: 'expense', category_key: 'expense_health' },
  { id: '7', en_name: 'Education', id_name: 'Pendidikan', type: 'expense', category_key: 'expense_education' },
  { id: '8', en_name: 'Other', id_name: 'Lainnya', type: 'expense', category_key: 'expense_other' },
  { id: '9', en_name: 'Salary', id_name: 'Gaji', type: 'income', category_key: 'income_salary' },
  { id: '10', en_name: 'Business', id_name: 'Bisnis', type: 'income', category_key: 'income_business' },
  { id: '11', en_name: 'Investment', id_name: 'Investasi', type: 'income', category_key: 'income_investment' },
  { id: '12', en_name: 'Other Income', id_name: 'Pendapatan Lain', type: 'income', category_key: 'income_other' },
  { id: '13', en_name: 'Transfer', id_name: 'Transfer', type: 'system', category_key: 'system_transfer' }
];

export const getLocalizedCategoriesByType = (type: string): Category[] => {
  return DEFAULT_CATEGORIES.filter(cat => cat.type === type);
};

export const getLocalizedCategoryName = (categoryId: string): string => {
  const category = DEFAULT_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.id_name || category?.en_name || 'Unknown';
};

export const getCategoryStringIdFromUuid = (uuid: string): string => {
  // For backwards compatibility - just return the uuid as string
  return uuid;
};

export const getCategoryUuidFromStringId = (stringId: string): string => {
  // For backwards compatibility - just return the stringId
  return stringId;
};

export const getDefaultCategories = (): Category[] => {
  return DEFAULT_CATEGORIES;
};

export const legacyCategoryNameToId = (name: string): string => {
  const category = DEFAULT_CATEGORIES.find(cat => 
    cat.en_name.toLowerCase() === name.toLowerCase() || 
    cat.id_name.toLowerCase() === name.toLowerCase()
  );
  return category?.id || '8'; // Default to 'Other' expense
};
