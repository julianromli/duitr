import i18next from 'i18next';
import { 
  CATEGORIES, 
  CategoryDefinition, 
  CategoryType, 
  getCategoryName as getStaticCategoryName
} from '@/types/categories';
import { getCategoryById, getCategoryName as getDynamicCategoryName } from '@/services/categoryService';

/**
 * Get the localized category name based on the current language
 * @param categoryId The unique category ID
 * @param i18n The i18next instance for current language
 * @returns The localized category name
 */
export async function getLocalizedCategoryName(categoryId: string | number, i18n: typeof i18next): Promise<string> {
  const currentLanguage = i18n.language || 'id';
  
  try {
    // Check if it's a number (new integer ID from DB)
    if (typeof categoryId === 'number' || (typeof categoryId === 'string' && !isNaN(Number(categoryId)))) {
      try {
        const name = await getDynamicCategoryName(categoryId, currentLanguage);
        // If we got a valid name back, return it
        if (name && name !== 'Other') {
          return name;
        }
      } catch (dbError) {
        console.warn(`Error getting category name from database for ID ${categoryId}:`, dbError);
        // Continue to fallback mechanism
      }
      
      // If we get here, the category might exist but the service couldn't find it
      // Let's check DEFAULT_CATEGORIES as fallback
      if (typeof categoryId === 'number' || !isNaN(Number(categoryId))) {
        const numericId = Number(categoryId);
        // Try to find the category in DEFAULT_CATEGORIES by id
        for (const type in DEFAULT_CATEGORIES) {
          const category = DEFAULT_CATEGORIES[type as CategoryType].find(cat => cat.id === String(numericId));
          if (category) {
            // Return the properly localized name
            if (currentLanguage === 'id') {
              const translations: Record<string, string> = {
                "Groceries": "Belanjaan",
                "Dining": "Makanan",
                "Transportation": "Transportasi",
                "Subscription": "Langganan",
                "Housing": "Perumahan",
                "Entertainment": "Hiburan",
                "Shopping": "Belanja",
                "Health": "Kesehatan",
                "Education": "Pendidikan",
                "Travel": "Perjalanan",
                "Personal": "Pribadi",
                "Other": "Lainnya",
                "Donate": "Sedekah",
                "Salary": "Gaji",
                "Business": "Bisnis",
                "Investment": "Investasi",
                "Gift": "Hadiah",
                "Transfer": "Transfer"
              };
              return translations[category.name] || category.name;
            }
            return category.name;
          }
        }
      }
    }
  
    // Continue with existing logic for other cases
    // Check if it's a UUID (from database)
    if (typeof categoryId === 'string' && categoryId.includes('-')) {
      try {
        return await getDynamicCategoryName(categoryId, currentLanguage);
      } catch (error) {
        console.warn(`Error getting category name for UUID ${categoryId}:`, error);
        // Continue to fallback
      }
    }
    
    // Check if it's a category key string (e.g., 'expense_groceries')
    if (typeof categoryId === 'string' && categoryId.includes('_')) {
      // First try to get from the database by category_key
      try {
        return await getDynamicCategoryName(categoryId, currentLanguage);
      } catch (error) {
        console.warn(`Error getting category name for key ${categoryId}:`, error);
        // Fallback to static system
        return getStaticCategoryName(categoryId, currentLanguage);
      }
    }
    
    // Fallback to legacy system
    return getStaticCategoryName(String(categoryId), currentLanguage);
  } catch (error) {
    console.error(`Error getting category name for ID ${categoryId}:`, error);
    // Ultimate fallback
    return currentLanguage === 'id' ? 'Lainnya' : 'Other';
  }
}

/**
 * Convert category string ID to integer ID or UUID depending on the database schema
 * @param categoryStringId The category string ID (e.g., 'expense_groceries')
 * @returns ID representation of the category
 */
export function getCategoryUuidFromStringId(categoryStringId: string): number {
  // Handle empty or undefined case
  if (!categoryStringId) return 12; // Default to expense_other (ID 12)

  // Map string category keys to the corresponding integer IDs
  // These IDs are based on the order they were inserted in the category_reset_fixed.sql migration
  const categoryKeyToId: Record<string, number> = {
    // Expense categories (inserted first, IDs 1-12)
    'expense_groceries': 1,
    'expense_food': 2,
    'expense_dining': 2,  // Maps to food ID
    'expense_transportation': 3,
    'expense_subscription': 4,
    'expense_utilities': 4, // Maps to subscription ID
    'expense_housing': 5,
    'expense_entertainment': 6,
    'expense_shopping': 7,
    'expense_health': 8,
    'expense_healthcare': 8, // Maps to health ID
    'expense_education': 9,
    'expense_travel': 10,
    'expense_personal': 11,
    'expense_personal_care': 11, // Maps to personal ID
    'expense_gifts': 6, // Maps to entertainment ID for now
    'expense_gift': 6, // Maps to entertainment ID for now
    'expense_other': 12,
    'expense_donation': 19, // Donation expense
    
    // Income categories (inserted second, IDs 13-17)
    'income_salary': 13,
    'income_business': 14,
    'income_investment': 15,
    'income_gift': 16,
    'income_freelance': 17, // Maps to other income ID
    'income_refund': 17, // Maps to other income ID
    'income_bonus': 17, // Maps to other income ID
    'income_other': 17,
    
    // System category (inserted last, ID 18)
    'system_transfer': 18,
    'transfer': 18 // Shorthand for system_transfer
  };

  // Check if we have a direct mapping
  if (categoryKeyToId[categoryStringId] !== undefined) {
    return categoryKeyToId[categoryStringId];
  }

  // Handle numeric IDs (already converted)
  if (!isNaN(Number(categoryStringId))) {
    const numId = Number(categoryStringId);
    // Check if it's a valid ID - accept any positive number
    if (numId >= 1) {
      return numId;
    }
  }

  // Fallback based on category type prefix
  if (categoryStringId.startsWith('expense_')) {
    return 12; // expense_other
  } else if (categoryStringId.startsWith('income_')) {
    return 17; // income_other
  } else if (categoryStringId.startsWith('system_') || categoryStringId === 'transfer') {
    return 18; // system_transfer
  }

  // Default fallback
  return 12; // expense_other
}

/**
 * Convert a category ID from the database back to a category string key
 * @param id The ID that represents a category
 * @returns The original category string ID or a default value
 */
export function getCategoryStringIdFromUuid(id: string | number): string {
  // If it's a number, we need to find the corresponding category_key
  if (typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id)))) {
    // Convert to number to ensure consistent comparison
    const numId = Number(id);
    
    // Map numeric IDs back to string keys based on migration order
    const idToCategoryKey: Record<number, string> = {
      // Expense categories (inserted first, IDs 1-12)
      1: 'expense_groceries',
      2: 'expense_food', // Also covers 'expense_dining'
      3: 'expense_transportation',
      4: 'expense_subscription', // Also covers 'expense_utilities'
      5: 'expense_housing',
      6: 'expense_entertainment', // Also covers 'expense_gifts'
      7: 'expense_shopping',
      8: 'expense_health', // Also covers 'expense_healthcare'
      9: 'expense_education',
      10: 'expense_travel',
      11: 'expense_personal', // Also covers 'expense_personal_care'
      12: 'expense_other',
      
      // Income categories (inserted second, IDs 13-17)
      13: 'income_salary',
      14: 'income_business',
      15: 'income_investment',
      16: 'income_gift',
      17: 'income_other', // Also covers other income types
      
      // System category (inserted last, ID 18)
      18: 'system_transfer',
      
      // Additional category
      19: 'expense_donation'
    };
    
    // Return the mapped category key or a default based on range
    if (idToCategoryKey[numId]) {
      return idToCategoryKey[numId];
    }
    
    // Fallback based on ID ranges
    if (numId <= 12) {
      return 'expense_other';
    } else if (numId <= 17) {
      return 'income_other';
    } else {
      return 'system_transfer';
    }
  }

  // If not a valid UUID or ID, return a default
  if (!id || typeof id !== 'string') {
    return 'expense_other';
  }

  // Map UUIDs to category string IDs
  const uuidToCategoryMap: Record<string, string> = {
    // Expense categories
    'e0a9d994-7a7e-4ac1-8a4c-348f850e1050': 'expense_groceries',
    'b1a62a4e-ed5d-4b3b-95d6-21d03f5a3cb7': 'expense_food',
    'c5b9e8a7-3df6-42a9-b2d1-6c85f5e6d964': 'expense_transportation',
    'd4c7f6e0-2bf3-45a1-9d82-7a4e8b9c325d': 'expense_housing',
    'f3e9d2b1-6c7a-485b-a0d9-3e9f8c7a6b5d': 'expense_utilities',
    '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d': 'expense_entertainment',
    '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e': 'expense_shopping',
    '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f': 'expense_health',
    '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a': 'expense_education',
    '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b': 'expense_personal',
    '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c': 'expense_travel',
    '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d': 'expense_gift',
    '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e': 'expense_other',

    // Income categories
    '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f': 'income_salary',
    '0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a': 'income_business',
    '1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b': 'income_investment',
    '2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c': 'income_allowance',
    '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d': 'income_gift',
    '4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e': 'income_other',

    // Transfer
    '5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f': 'system_transfer'
  };

  // Look up the string ID from the map
  const categoryId = uuidToCategoryMap[id];
  if (categoryId) {
    return categoryId;
  }

  // Try to infer category type from UUID if not found in the map
  if (id.includes('expense')) {
    return 'expense_other';
  } else if (id.includes('income')) {
    return 'income_other';
  } else if (id.includes('transfer') || id.includes('system')) {
    return 'system_transfer';
  }

  // Default fallback
  return 'expense_other';
}

/**
 * Get all categories of a specific type with localized names
 * @param type The category type to filter by
 * @param i18n The i18next instance for current language
 * @returns Array of localized categories
 */
export async function getLocalizedCategoriesByType(
  type: CategoryType,
  i18n: typeof i18next
): Promise<{ id: string | number; name: string }[]> {
  try {
    // Import functions from categoryService
    const { getCategoriesByType } = await import('@/services/categoryService');
    
    try {
      // Get categories from the database
      const categories = await getCategoriesByType(type);
      const currentLanguage = i18n.language || 'id';
      
      if (!categories || categories.length === 0) {
        console.log(`No ${type} categories found in database, using defaults`);
        return getDefaultCategories(type, currentLanguage);
      }
      
      // Map to simple format with localized names
      return categories.map(category => ({
        // Use numeric category_id for database compatibility
        id: typeof category.category_id === 'number' ? category.category_id : 
            (typeof category.category_id === 'string' && !isNaN(Number(category.category_id))) ? 
              Number(category.category_id) : category.id,
        name: currentLanguage === 'id' ? category.id_name : category.en_name
      }));
    } catch (dbError) {
      // Database query failed, log error and return default categories
      console.error(`Database error getting ${type} categories:`, dbError);
      return getDefaultCategories(type, i18n.language);
    }
  } catch (error) {
    console.error('Error getting categories:', error);
    // Use the default categories as fallback
    return getDefaultCategories(type, i18n.language);
  }
}

/**
 * Convert a legacy category name to a category ID
 * @param categoryName The legacy category name
 * @param type The transaction type
 * @param i18n The i18next instance for current language
 * @returns The corresponding category ID
 */
export function legacyCategoryNameToId(
  categoryName: string, 
  type: 'income' | 'expense' | 'transfer',
  i18n: typeof i18next
): string {
  if (type === 'transfer') {
    return 'system_transfer';
  }
  
  const currentLanguage = i18n.language || 'id';
  const categoryType: CategoryType = type === 'income' ? 'income' : 'expense';
  
  const matchingCategory = CATEGORIES
    .filter(category => category.type === categoryType)
    .find(category => {
      if (currentLanguage === 'id') {
        return category.nameId.toLowerCase() === categoryName.toLowerCase();
      } else {
        return category.nameEn.toLowerCase() === categoryName.toLowerCase();
      }
    });
  
  if (matchingCategory) {
    return matchingCategory.id;
  }
  
  // Special case for transfers
  if (categoryName.toLowerCase() === 'transfer') {
    return 'system_transfer';
  }
  
  // Default to 'other' for the appropriate type
  return categoryType === 'income' ? 'income_other' : 'expense_other';
}

// Add default categories as fallback when Supabase isn't available
export const DEFAULT_CATEGORIES = {
  expense: [
    { id: "1", name: "Groceries" },
    { id: "2", name: "Dining" },
    { id: "3", name: "Transportation" },
    { id: "4", name: "Subscription" },
    { id: "5", name: "Housing" },
    { id: "6", name: "Entertainment" },
    { id: "7", name: "Shopping" },
    { id: "8", name: "Health" },
    { id: "9", name: "Education" },
    { id: "10", name: "Travel" },
    { id: "11", name: "Personal" },
    { id: "12", name: "Other" },
    { id: "19", name: "Donate" }
  ],
  income: [
    { id: "13", name: "Salary" },
    { id: "14", name: "Business" },
    { id: "15", name: "Investment" },
    { id: "16", name: "Gift" },
    { id: "17", name: "Other" }
  ],
  system: [
    { id: "18", name: "Transfer" }
  ]
};

// Get default categories by type
export function getDefaultCategories(type: CategoryType, language: string = 'en'): { id: string; name: string }[] {
  // Return translated default categories
  const categories = DEFAULT_CATEGORIES[type] || [];
  
  if (language === 'id') {
    // Translate to Indonesian
    return categories.map(cat => {
      const translations: Record<string, string> = {
        // Expense categories
        "Groceries": "Belanjaan",
        "Dining": "Makanan",
        "Transportation": "Transportasi",
        "Subscription": "Langganan",
        "Housing": "Perumahan",
        "Entertainment": "Hiburan",
        "Shopping": "Belanja",
        "Health": "Kesehatan",
        "Education": "Pendidikan",
        "Travel": "Perjalanan",
        "Personal": "Pribadi",
        "Other": "Lainnya",
        "Donate": "Sedekah",
        
        // Income categories
        "Salary": "Gaji",
        "Business": "Bisnis",
        "Investment": "Investasi",
        "Gift": "Hadiah",
        
        // System
        "Transfer": "Transfer"
      };
      
      return {
        id: cat.id,
        name: translations[cat.name] || cat.name
      };
    });
  }
  
  return categories;
} 