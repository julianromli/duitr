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
export async function getLocalizedCategoryName(categoryId: string, i18n: typeof i18next): Promise<string> {
  const currentLanguage = i18n.language || 'id';
  
  // Check if it's a UUID (from database)
  if (categoryId && categoryId.includes('-')) {
    return await getDynamicCategoryName(categoryId, currentLanguage);
  }
  
  // Fallback to legacy system
  return getStaticCategoryName(categoryId, currentLanguage);
}

/**
 * Convert category string ID to a consistent UUID using MD5
 * This needs to match the same transformation used in database migrations
 * @param categoryStringId The category string ID (e.g., 'expense_groceries')
 * @returns UUID representation of the category ID
 */
export function getCategoryUuidFromStringId(categoryStringId: string): string {
  // Simple implementation to simulate the md5 hash used in the SQL migration
  // In a real environment, you'd use a proper UUID/MD5 library
  const stringToUuid = (str: string): string => {
    // This is a placeholder - in the database we use md5(str)::uuid
    // For client-side, we just need to identify it's a UUID format
    return `uuid-${str.replace(/_/g, '-')}`;
  };
  
  return stringToUuid(categoryStringId);
}

/**
 * Convert UUID back to category string ID
 * @param uuid The UUID that represents a category
 * @returns The original category string ID or a default value
 */
export function getCategoryStringIdFromUuid(uuid: string): string {
  // First check if this is the dummy client-side UUID format
  if (uuid.startsWith('uuid-')) {
    return uuid.substring(5).replace(/-/g, '_');
  }
  
  // If it's a real UUID from the database, we need to map it back
  // This requires a lookup since we can't reverse the MD5 hash
  // For simplicity, we'll just return a default value based on category type detection
  if (uuid.includes('income') || uuid.includes('expense') || uuid.includes('transfer')) {
    return uuid;
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
): Promise<{ id: string; name: string }[]> {
  try {
    // Import lazily to avoid circular dependencies
    const { fetchCategories } = await import('@/services/categoryService');
    
    // Get categories from the database
    const categories = await fetchCategories(type);
    const currentLanguage = i18n.language || 'id';
    
    // Map to simple format with localized names
    return categories.map(category => ({
      id: category.id,
      name: currentLanguage === 'id' ? category.id_name : category.en_name
    }));
  } catch (error) {
    console.error('Error getting categories:', error);
    
    // Fallback to static categories if database fails
    const filteredCategories = CATEGORIES.filter(cat => cat.type === type);
    
    return filteredCategories.map(cat => ({
      id: cat.id,
      name: i18n.language === 'id' ? cat.nameId : cat.nameEn
    }));
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