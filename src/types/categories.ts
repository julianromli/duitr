
// Category type definitions matching the database schema
export interface Category {
  id: string; // Using category_id as id for compatibility
  category_id?: number;
  category_key?: string;
  en_name: string;
  id_name: string;
  type?: string;
  icon?: string;
  color?: string;
  user_id?: string;
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
  id: dbCategory.id || dbCategory.category_id?.toString() || '',
  category_id: dbCategory.category_id,
  category_key: dbCategory.category_key,
  en_name: dbCategory.en_name,
  id_name: dbCategory.id_name,
  type: dbCategory.type,
  icon: dbCategory.icon,
  color: dbCategory.color,
  user_id: dbCategory.user_id,
  created_at: dbCategory.created_at
});

// Legacy type for PinjamanItem to fix missing properties
export interface PinjamanItem {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  icon?: string;
  is_settled?: boolean;
  created_at?: string;
  user_id: string;
  description?: string;
  lender_name?: string;
}

// WantToBuyItem type with proper category and priority constraints
export interface WantToBuyItem {
  id: string;
  name: string;
  price: number;
  estimated_date: string;
  category: "Keinginan" | "Kebutuhan";
  priority: "Tinggi" | "Sedang" | "Rendah";
  icon?: string;
  is_purchased?: boolean;
  created_at?: string;
  user_id: string;
}
