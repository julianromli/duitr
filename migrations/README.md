# Category System Migration

This directory contains migration scripts to fix category data inconsistencies in the Duitr app's database, ensuring proper translation support across languages.

## Problem

The current design stores category names as text (e.g., "Dining" or "Makan di Luar") directly in the `transactions` and `budgets` tables. This causes:

1. Inconsistent categories when switching between languages
2. Duplicate categories in statistics and reports
3. No proper translation support

## Solution

The migration converts the system to use a centralized `categories` table with:
- Unique UUIDs for each category
- English and Indonesian translations
- Type classification (income, expense, or system)

## Migration Scripts

Execute these scripts in order:

1. `01_update_categories_table.sql`: Adds type column and ensures all required categories exist
2. `02_map_transaction_categories.sql`: Maps text categories to UUIDs in transactions table
3. `03_map_budget_categories.sql`: Maps text categories to UUIDs in budgets table  
4. `04_finalize_category_migration.sql`: Makes the migration permanent by dropping old columns
5. `05_app_integration_guide.md`: Guide for updating the app to use the new system

## Execution Instructions

Run these scripts from your Supabase SQL editor or using the `psql` command-line tool:

```bash
# Connect to your database
psql -U your_user -d your_database

# Run each script in order
\i 01_update_categories_table.sql
\i 02_map_transaction_categories.sql
\i 03_map_budget_categories.sql
\i 04_finalize_category_migration.sql
```

Or in Supabase:
1. Open SQL Editor
2. Copy and paste each script
3. Run them in sequence
4. Check for any errors

## Verification

After running each script, verify that:

1. The `categories` table has the correct structure and data
2. All transactions have valid `category_id` values
3. All budgets have valid `category_id` values

## Safety Features

The scripts include safety checks:
- Verification of data consistency before dropping columns
- Foreign key constraints to maintain data integrity
- Triggers to validate category IDs on future inserts/updates

## Rollback

If you need to rollback the migration, restore from a backup before proceeding.

## App Updates Required

After completing the database migration, the app code needs to be updated to:
1. Fetch categories from the `categories` table
2. Display the appropriate translation based on user language
3. Save category IDs instead of category names

See `05_app_integration_guide.md` for detailed instructions on updating the app code.

# Category Migration Fix

This directory contains database migration scripts for fixing category-related issues in the application.

## Problem: All transactions showing as "Other" and can't be edited

If you're experiencing an issue where all transactions are showing as "Other" category, and you cannot edit transactions, follow these steps to fix the problem:

### 1. Run the SQL migration script

Open your Supabase dashboard and navigate to the SQL Editor. Copy and paste the contents of `fix_categories.sql` into the SQL Editor and run it.

This script will:
- Ensure the categories table exists with the correct structure
- Insert all required category definitions with the correct UUIDs
- Fix any transactions and budgets with missing or incorrect category_id values

### 2. Update your application code

The issue might also be caused by incorrect category handling in your JavaScript code. Make sure your FinanceContext.tsx file is updated to handle the category IDs correctly by:

1. Always converting string category IDs to UUIDs when storing in the database
2. Converting UUIDs back to string IDs when displaying in the UI

The key changes that need to be made are:

```typescript
// In addTransaction function:
const categoryId = transaction.categoryId || 
  (transaction.type === 'transfer' 
    ? 'system_transfer' 
    : legacyCategoryNameToId(transaction.category || '', transaction.type, i18next));

// Always convert string ID to UUID format
const dbCategoryId = getCategoryUuidFromStringId(categoryId);
```

```typescript  
// In updateTransaction function:
const categoryId = updatedTransaction.categoryId || 
  (updatedTransaction.type === 'transfer' 
    ? 'system_transfer' 
    : legacyCategoryNameToId(updatedTransaction.category || '', updatedTransaction.type, i18next));

// Always convert string ID to UUID format
const dbCategoryId = getCategoryUuidFromStringId(categoryId);
```

### 3. Restart your application

After making these changes, restart your application for the changes to take effect.

## Common issues and troubleshooting

1. If you still see "Other" for all categories, check that the categories exist in your Supabase database by running:
   ```sql
   SELECT * FROM categories;
   ```

2. If transactions can't be edited, check for any JavaScript errors in your browser console, which might indicate type issues or problems with your API calls.

3. Make sure your migration scripts have run successfully. You can check if the category_id column exists and has the correct data type (UUID) by running:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'transactions' AND column_name = 'category_id';
   ``` 