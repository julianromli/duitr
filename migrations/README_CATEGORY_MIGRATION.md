# Category System Migration

This directory contains migration scripts to update the database schema to support a language-independent category system.

## Background

Previously, the app stored category names directly in the database (e.g., "Dining" or "Makan di Luar"), which caused inconsistencies when switching between languages. Users would see duplicate categories in their transaction history and statistics when they changed the app language.

The new system uses unique category IDs that are consistent across languages. Each category ID maps to a display name in each supported language.

## Migration Steps

1. Add a `category_id` column to the `transactions` and `budgets` tables
2. Populate the new column based on existing category names
3. Update the application code to use the new ID-based system
4. Ensure all UI components display the correct localized category names

## Migration Scripts

- `add_category_id.sql`: Adds and populates the `category_id` column in the `transactions` table
- `update_budgets_with_category_id.sql`: Adds and populates the `category_id` column in the `budgets` table

## Implementation Details

The category system is implemented with the following components:

1. `src/types/categories.ts`: Defines the category types, IDs, and translations
2. `src/utils/categoryUtils.ts`: Provides utility functions to work with the new category system
3. Updates to various components to use the category IDs instead of names

## Running the Migration

To execute the migration scripts, run:

```bash
# Execute the transaction migration
psql -U your_db_user -d your_db_name -f migrations/add_category_id.sql

# Execute the budget migration
psql -U your_db_user -d your_db_name -f migrations/update_budgets_with_category_id.sql
```

## Verification

After running the migration:

1. Check that all transactions and budgets have a valid `category_id`
2. Confirm that switching languages preserves category grouping in statistics
3. Verify that transaction history shows consistent categories regardless of language 