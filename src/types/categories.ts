
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
