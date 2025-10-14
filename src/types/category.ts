/**
 * Category Type Definitions
 * 
 * Clean, simplified types for the category system.
 * All categories use integer IDs consistently.
 */

/**
 * Category interface with bilingual support
 * All categories MUST have both en_name and id_name
 */
export interface Category {
  category_id: number;           // Primary key (integer)
  category_key: string;          // Unique key (for reference only, not used in logic)
  en_name: string;               // English name (REQUIRED)
  id_name: string;               // Indonesian name (REQUIRED)
  type: 'income' | 'expense' | 'system';
  icon: string;                  // Lucide icon name
  color: string;                 // Hex color code
  user_id: string | null;        // null = default category, string = custom user category
  created_at: string;
}

/**
 * Input for creating a new custom category
 */
export interface CreateCategoryInput {
  name: string;                  // Will be used for both en_name and id_name
  type: 'income' | 'expense';
  icon?: string;                 // Optional, defaults to 'circle'
  color?: string;                // Optional, defaults to '#6B7280'
}

/**
 * Input for updating an existing category
 */
export interface UpdateCategoryInput {
  name?: string;                 // Will update both en_name and id_name
  icon?: string;
  color?: string;
}

/**
 * Category option for dropdowns/selectors
 */
export interface CategoryOption {
  value: number;                 // category_id
  label: string;                 // Localized name
  type: 'income' | 'expense' | 'system';
  icon?: string;
  color?: string;
}
