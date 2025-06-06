
// Category utilities for handling category data and localization
// Updated to load categories from Supabase database with fallback to defaults
// Fixed function signatures to match usage

import { Category } from '@/types/categories';

export const DEFAULT_CATEGORIES = {
  expense: [
    { id: '1', name: 'Groceries', category_key: 'expense_groceries' },
    { id: '2', name: 'Dining', category_key: 'expense_dining' },
    { id: '3', name: 'Transportation', category_key: 'expense_transportation' },
    { id: '4', name: 'Subscription', category_key: 'expense_subscription' },
    { id: '5', name: 'Housing', category_key: 'expense_housing' },
    { id: '6', name: 'Entertainment', category_key: 'expense_entertainment' },
    { id: '7', name: 'Shopping', category_key: 'expense_shopping' },
    { id: '8', name: 'Health', category_key: 'expense_health' },
    { id: '9', name: 'Education', category_key: 'expense_education' },
    { id: '10', name: 'Travel', category_key: 'expense_travel' },
    { id: '11', name: 'Personal', category_key: 'expense_personal' },
    { id: '12', name: 'Other', category_key: 'expense_other' },
    { id: '13', name: 'Donate', category_key: 'expense_donate' },
    { id: '20', name: 'Investment', category_key: 'expense_investment' }
  ],
  income: [
    { id: '14', name: 'Salary', category_key: 'income_salary' },
    { id: '15', name: 'Business', category_key: 'income_business' },
    { id: '16', name: 'Investment', category_key: 'income_investment' },
    { id: '17', name: 'Gift', category_key: 'income_gift' },
    { id: '18', name: 'Other', category_key: 'income_other' }
  ],
  system: [
    { id: '19', name: 'Transfer', category_key: 'system_transfer' }
  ]
};

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

// Updated function signature - single parameter only
export const getLocalizedCategoriesByType = async (type: string): Promise<{id: string | number; name: string}[]> => {
  try {
    // Try to load from Supabase first
    const { fetchCategoriesByType } = await import('@/services/categoryService');
    const categories = await fetchCategoriesByType(type);

    if (categories && categories.length > 0) {
      return categories.map(cat => ({
        id: cat.id || cat.category_id?.toString() || '',
        name: cat.id_name || cat.en_name || 'Unknown'
      }));
    }
  } catch (error) {
    console.warn('Failed to load categories from Supabase, using defaults:', error);
  }

  // Fallback to default categories
  return DEFAULT_CATEGORIES[type as keyof typeof DEFAULT_CATEGORIES] || [];
};

export const getLocalizedCategoryName = (categoryId: string): string => {
  const allCategories = [
    ...DEFAULT_CATEGORIES.expense,
    ...DEFAULT_CATEGORIES.income,
    ...DEFAULT_CATEGORIES.system
  ];
  const category = allCategories.find(cat => cat.id === categoryId);
  return category?.name || 'Unknown';
};

export const getCategoryStringIdFromUuid = (uuid: string): string => {
  return uuid;
};

export const getCategoryUuidFromStringId = (stringId: string): string => {
  return stringId;
};

export const getDefaultCategories = (): Category[] => {
  const allCategories = [
    ...DEFAULT_CATEGORIES.expense,
    ...DEFAULT_CATEGORIES.income,
    ...DEFAULT_CATEGORIES.system
  ];
  
  return allCategories.map(cat => ({
    id: cat.id,
    en_name: cat.name,
    id_name: cat.name,
    type: cat.category_key.split('_')[0],
    category_key: cat.category_key
  }));
};

export const legacyCategoryNameToId = (name: string): string => {
  const allCategories = [
    ...DEFAULT_CATEGORIES.expense,
    ...DEFAULT_CATEGORIES.income,
    ...DEFAULT_CATEGORIES.system
  ];
  const category = allCategories.find(cat => 
    cat.name.toLowerCase() === name.toLowerCase()
  );
  return category?.id || '12'; // Default to 'Other' expense
};

// Updated function signatures to match usage - single parameter version
export const getLocalizedCategoryNameById = (categoryId: string | number): string => {
  return getLocalizedCategoryName(categoryId.toString());
};

// Single parameter version for backward compatibility
export const getCategoryName = (categoryId: string | number): string => {
  return getLocalizedCategoryName(categoryId.toString());
};
