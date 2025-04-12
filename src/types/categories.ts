// Category system with unique IDs for consistent data storage across translations
// This file defines the mapping between category IDs and their translations

export type CategoryType = 'income' | 'expense' | 'system';

/**
 * Category interface for database categories
 */
export interface Category {
  id: string;
  category_key: string;
  en_name: string;
  id_name: string;
  type: CategoryType;
  created_at?: string;
}

/**
 * Legacy category system helpers - to be removed after migration
 */
export interface CategoryDefinition {
  id: string;
  type: 'income' | 'expense';
  nameEn: string;
  nameId: string;
}

// Define all categories with unique IDs - this will be replaced with database categories
export const CATEGORIES: CategoryDefinition[] = [
  // Income categories
  { id: 'income_salary', type: 'income', nameEn: 'Salary', nameId: 'Gaji' },
  { id: 'income_business', type: 'income', nameEn: 'Business', nameId: 'Bisnis' },
  { id: 'income_investment', type: 'income', nameEn: 'Investment', nameId: 'Investasi' },
  { id: 'income_gift', type: 'income', nameEn: 'Gift', nameId: 'Hadiah' },
  { id: 'income_freelance', type: 'income', nameEn: 'Freelance', nameId: 'Pekerja Lepas' },
  { id: 'income_refund', type: 'income', nameEn: 'Refund', nameId: 'Pengembalian' },
  { id: 'income_bonus', type: 'income', nameEn: 'Bonus', nameId: 'Bonus' },
  { id: 'income_other', type: 'income', nameEn: 'Other', nameId: 'Lainnya' },
  
  // Expense categories
  { id: 'expense_groceries', type: 'expense', nameEn: 'Groceries', nameId: 'Kebutuhan Rumah' },
  { id: 'expense_dining', type: 'expense', nameEn: 'Dining', nameId: 'Makan di Luar' },
  { id: 'expense_transportation', type: 'expense', nameEn: 'Transportation', nameId: 'Transportasi' },
  { id: 'expense_utilities', type: 'expense', nameEn: 'Subscription', nameId: 'Berlangganan' },
  { id: 'expense_housing', type: 'expense', nameEn: 'Housing', nameId: 'Perumahan' },
  { id: 'expense_entertainment', type: 'expense', nameEn: 'Entertainment', nameId: 'Hiburan' },
  { id: 'expense_shopping', type: 'expense', nameEn: 'Shopping', nameId: 'Belanja' },
  { id: 'expense_healthcare', type: 'expense', nameEn: 'Healthcare', nameId: 'Kesehatan' },
  { id: 'expense_education', type: 'expense', nameEn: 'Education', nameId: 'Pendidikan' },
  { id: 'expense_personal_care', type: 'expense', nameEn: 'Personal Care', nameId: 'Personal Care' },
  { id: 'expense_travel', type: 'expense', nameEn: 'Travel', nameId: 'Perjalanan' },
  { id: 'expense_gifts', type: 'expense', nameEn: 'Gifts', nameId: 'Hadiah' },
  { id: 'expense_other', type: 'expense', nameEn: 'Other', nameId: 'Lainnya' },
  
  // Special categories
  { id: 'system_transfer', type: 'expense', nameEn: 'Transfer', nameId: 'Transfer' }
];

// Helper function to get a category by ID
export function getCategoryById(id: string): CategoryDefinition | undefined {
  return CATEGORIES.find(category => category.id === id);
}

// Helper function to get a category ID by name and type
export function getCategoryId(name: string, type: CategoryType, language: string): string {
  // Normalize name for comparison
  const normalizedName = name.toLowerCase().trim();
  
  // Filter categories by type
  const categoriesOfType = CATEGORIES.filter(cat => cat.type === type);
  
  // Find category in specified language
  const fieldName = language === 'id' ? 'nameId' : 'nameEn';
  const category = categoriesOfType.find(cat => 
    (cat[fieldName as keyof CategoryDefinition] as string).toLowerCase() === normalizedName
  );
  
  // If found, return its ID
  if (category) {
    return category.id;
  }
  
  // If not found, return default "other" category for the given type
  return type === 'income' ? 'income_other' : 'expense_other';
}

// Helper function to get category name by ID based on language
export function getCategoryName(id: string, language: string): string {
  const category = CATEGORIES.find(cat => cat.id === id);
  
  if (!category) {
    return id && id.includes('_') ? id.split('_')[1] : 'Other';
  }

  return language === 'id' ? category.nameId : category.nameEn;
}

// Helper function to get all categories of a specific type
export function getCategoriesByType(type: CategoryType): CategoryDefinition[] {
  return CATEGORIES.filter(category => category.type === type);
} 