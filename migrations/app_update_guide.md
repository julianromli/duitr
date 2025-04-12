# Duitr App Update Guide: Category System Migration

This guide provides instructions for updating the Duitr app to use the new integer-based category system after running the `category_reset.sql` script.

## Overview of Changes

We've migrated from UUID-based categories to integer-based categories for better performance and maintainability. This affects:

1. How categories are stored in the database
2. How transactions and budgets reference categories 
3. How your app code needs to handle categories

## Required Code Changes

### 1. Update `src/utils/categoryUtils.ts`

Delete or modify these functions as they're no longer needed with integer IDs:
- `getCategoryUuidFromStringId`
- `getCategoryStringIdFromUuid`

Add new functions like these:

```typescript
/**
 * Get category information by ID
 * @param categoryId The integer category ID
 * @returns The category object or null if not found
 */
export async function getCategoryById(categoryId: number) {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('category_id', categoryId)
    .single();
  
  return data;
}

/**
 * Get all categories of a specific type
 * @param type The category type (expense, income, or system)
 * @returns Array of categories
 */
export async function getCategoriesByType(type: 'expense' | 'income' | 'system') {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('type', type)
    .order('category_id');
  
  return data || [];
}
```

### 2. Update `src/context/FinanceContext.tsx`

Update the transaction and budget handling functions to use integer-based category IDs:

#### In `addTransaction` function:

```typescript
// Instead of:
const dbCategoryId = getCategoryUuidFromStringId(categoryId);

// Simply use the integer ID directly:
const categoryId = findCategoryIdByKey(transaction.type, transaction.categoryKey);
```

#### Creating a helper function:

```typescript
/**
 * Find category ID based on transaction type and category name
 */
const findCategoryIdByKey = async (type: 'expense' | 'income' | 'transfer', categoryKey?: string) => {
  // For transfers, always use the transfer category
  if (type === 'transfer') {
    const { data } = await supabase
      .from('categories')
      .select('category_id')
      .eq('category_key', 'system_transfer')
      .single();
    return data?.category_id;
  }
  
  // If categoryKey is provided, find matching category
  if (categoryKey) {
    const { data } = await supabase
      .from('categories')
      .select('category_id')
      .eq('category_key', categoryKey)
      .single();
    if (data) return data.category_id;
  }
  
  // Default to "other" category based on type
  const defaultKey = type === 'income' ? 'income_other' : 'expense_other';
  const { data } = await supabase
    .from('categories')
    .select('category_id')
    .eq('category_key', defaultKey)
    .single();
  return data?.category_id;
};
```

### 3. Update UI Forms

#### Transaction Forms (`Tambah Pengeluaran`, `Tambah Pemasukan`):

1. In the category dropdowns, fetch categories with integer IDs:

```typescript
// Load expense categories
const loadExpenseCategories = async () => {
  const categories = await getCategoriesByType('expense');
  setExpenseCategories(categories.map(cat => ({
    id: cat.category_id,
    name: i18n.language === 'id' ? cat.id_name : cat.en_name,
    key: cat.category_key
  })));
};
```

2. When saving a transaction, use the selected category ID directly:

```typescript
// When saving transaction
const handleSave = () => {
  addTransaction({
    // ...other fields
    categoryId: selectedCategory.id, // This is now an integer
    // ...other fields
  });
};
```

#### Budget Form (`Buat Anggaran Baru`):

Similarly update the budget form to use the integer category IDs.

### 4. Update Category Display Components

Update any component that displays category information to fetch categories by integer ID:

```typescript
// Instead of using categoryId (UUID) and converting it to a string ID
const [categoryName, setCategoryName] = useState('');

useEffect(() => {
  const loadCategory = async () => {
    if (transaction.categoryId) {
      const category = await getCategoryById(transaction.categoryId);
      setCategoryName(i18n.language === 'id' ? category.id_name : category.en_name);
    }
  };
  
  loadCategory();
}, [transaction.categoryId, i18n.language]);
```

## Testing Your Changes

After implementing these changes:

1. Test all forms to ensure categories load correctly
2. Test adding new transactions and budgets with different categories
3. Verify that transaction history displays the correct category names
4. Test budget reports and summaries to ensure categories are displayed correctly

## Common Issues

- **Missing categories**: If you see "undefined" or empty category names, check that you're correctly fetching and using the category data
- **Type errors**: Update your TypeScript interfaces to use `number` instead of `string` for category IDs
- **Database constraints**: If you encounter foreign key constraint errors, ensure all your transactions and budgets use valid category IDs

## Need Help?

If you encounter issues with this migration, please contact the developer team for assistance. 