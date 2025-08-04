-- Remove foreign key constraint that references categories table
-- This fixes the "relation 'categories' does not exist" error

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transaction_category;

-- Add comment to document the change
COMMENT ON COLUMN transactions.category_id IS 'Category ID as integer, no foreign key constraint to allow flexible category management';