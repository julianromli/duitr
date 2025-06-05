
// Category type definitions matching the database schema
export interface Category {
  id: string; // Using category_id as id for compatibility
  category_id?: number;
  category_key?: string;
  en_name: string;
  id_name: string;
  type?: string;
  icon?: string;
  created_at?: string;
}

export interface CategoryOption {
  value: string;
  label: string;
  type?: string;
  icon?: string;
}

// Fix for category mapping - transform database format to app format
export const transformCategory = (dbCategory: any): Category => ({
  id: dbCategory.category_id?.toString() || dbCategory.id,
  category_id: dbCategory.category_id,
  category_key: dbCategory.category_key,
  en_name: dbCategory.en_name,
  id_name: dbCategory.id_name,
  type: dbCategory.type,
  icon: dbCategory.icon,
  created_at: dbCategory.created_at
});
