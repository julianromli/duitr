# App Integration Guide for Category System

This document provides guidance on updating the app's forms to integrate with the new category system.

## Background

The database has been migrated to use a consistent category system with the following structure:
- Each category has a unique UUID stored in the `categories` table
- Categories have translations in both English (`en_name`) and Indonesian (`id_name`)
- Categories are typed as 'income', 'expense', or 'system'
- The `category_id` column in transactions and budgets tables now references the categories table

## Updating App Components

### 1. Update Category Types Definition

```typescript
// src/types/categories.ts

export type CategoryType = 'income' | 'expense' | 'system';

export interface Category {
  id: string;
  en_name: string;
  id_name: string;
  type: CategoryType;
}
```

### 2. Create Service Function to Fetch Categories

```typescript
// src/services/categoryService.ts

import { supabase } from '@/lib/supabase';
import { Category } from '@/types/categories';

export async function fetchCategories(type?: 'income' | 'expense' | 'system'): Promise<Category[]> {
  let query = supabase.from('categories').select('*');
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  
  return data as Category[];
}
```

### 3. Update Form Components

#### Transaction Form

```tsx
// In transaction form component

import { useEffect, useState } from 'react';
import { fetchCategories } from '@/services/categoryService';
import { Category } from '@/types/categories';
import { useTranslation } from 'react-i18next';

// Inside your component
const [categories, setCategories] = useState<Category[]>([]);
const { i18n } = useTranslation();
const isIndonesian = i18n.language === 'id';

useEffect(() => {
  // Load categories based on transaction type
  const loadCategories = async () => {
    const type = formData.type === 'expense' ? 'expense' : 'income';
    const fetchedCategories = await fetchCategories(type);
    setCategories(fetchedCategories);
  };
  
  loadCategories();
}, [formData.type]);

// In your JSX, replace the category dropdown
return (
  // ...other form elements
  <Select 
    value={formData.categoryId || ''} 
    onChange={e => setFormData({...formData, categoryId: e.target.value})}
  >
    <option value="" disabled>Select category</option>
    {categories.map(category => (
      <option key={category.id} value={category.id}>
        {isIndonesian ? category.id_name : category.en_name}
      </option>
    ))}
  </Select>
  // ...other form elements
);
```

#### Budget Form

Follow a similar approach for the budget form, but only fetch expense categories:

```typescript
// In your useEffect
const loadCategories = async () => {
  const fetchedCategories = await fetchCategories('expense');
  setCategories(fetchedCategories);
};
```

### 4. Update API Calls

When creating or updating transactions/budgets:

```typescript
// When adding a transaction
const newTransaction = {
  // ...other fields
  category_id: formData.categoryId, // Use category_id instead of category
  // No need to send the category field anymore
};

// Submit to database
const { data, error } = await supabase
  .from('transactions')
  .insert(newTransaction);
```

### 5. Update Display Components

For components that display category names:

```tsx
// CategoryDisplay component
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface CategoryDisplayProps {
  categoryId: string;
}

const CategoryDisplay: React.FC<CategoryDisplayProps> = ({ categoryId }) => {
  const [categoryName, setCategoryName] = useState('');
  const { i18n } = useTranslation();
  const nameField = i18n.language === 'id' ? 'id_name' : 'en_name';
  
  useEffect(() => {
    const getCategory = async () => {
      const { data } = await supabase
        .from('categories')
        .select(nameField)
        .eq('id', categoryId)
        .single();
        
      if (data) {
        setCategoryName(data[nameField]);
      }
    };
    
    if (categoryId) {
      getCategory();
    }
  }, [categoryId, nameField]);
  
  return <span>{categoryName}</span>;
};
```

## Testing

After implementing these changes:

1. Test adding new transactions with both English and Indonesian UI
2. Verify that existing transactions display correctly with the right category names
3. Ensure budget creation and display works with the new category system
4. Test switching languages and verify that category names change appropriately

## Notes

- The `category` column has been removed from both tables
- All new records must include a valid `category_id`
- The database now enforces category validity through foreign key constraints
- The API will return an error if an invalid category ID is provided 