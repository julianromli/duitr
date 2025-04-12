-- =============================================
-- Category Reset Migration Script
-- This script migrates categories from UUID to INTEGER
-- =============================================

-- =============================================
-- Step 0: Drop existing functions and triggers
-- =============================================

-- Drop any existing triggers first
DROP TRIGGER IF EXISTS verify_transaction_category ON transactions;
DROP TRIGGER IF EXISTS verify_budget_category ON budgets;
DROP TRIGGER IF EXISTS set_default_category_trigger ON transactions;
DROP TRIGGER IF EXISTS set_default_category_trigger_budget ON budgets;

-- Then drop any functions
DROP FUNCTION IF EXISTS verify_category_id CASCADE;
DROP FUNCTION IF EXISTS set_default_category_for_transaction CASCADE;
DROP FUNCTION IF EXISTS set_default_category_for_budget CASCADE;

-- Create a temporary table to track migration progress
CREATE TEMPORARY TABLE IF NOT EXISTS migration_progress (
    step TEXT PRIMARY KEY,
    completed BOOLEAN DEFAULT FALSE,
    error_message TEXT DEFAULT NULL
);

-- Initialize steps
INSERT INTO migration_progress (step) VALUES
('triggers_dropped'),
('backup_created'),
('categories_recreated'),
('mappings_created'),
('transactions_updated'),
('budgets_updated'),
('functions_recreated');

-- Create error handling function
CREATE OR REPLACE FUNCTION log_migration_error(step_name TEXT, err_message TEXT) 
RETURNS VOID AS $$
BEGIN
    UPDATE migration_progress 
    SET error_message = err_message
    WHERE step = step_name;
    
    RAISE NOTICE 'Migration error at step %: %', step_name, err_message;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Step 1: Create backup
-- =============================================

-- Create a backup of the existing categories table
CREATE TABLE IF NOT EXISTS categories_backup AS 
SELECT * FROM categories;

-- Mark step as completed
UPDATE migration_progress SET completed = TRUE WHERE step = 'backup_created';

-- Fix 'other' category keys to use the proper prefixes
DO $$
BEGIN
    UPDATE categories_backup
    SET category_key = CASE
        WHEN type = 'expense' THEN 'expense_other'
        WHEN type = 'income' THEN 'income_other'
        ELSE category_key
    END
    WHERE category_key = 'other';
END$$;

-- Check if there are any duplicate UUIDs in the backup 
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT id, COUNT(*) 
        FROM categories_backup 
        GROUP BY id 
        HAVING COUNT(*) > 1
    ) AS duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Warning: Found % categories with duplicate IDs in the backup', duplicate_count;
    END IF;
END$$;

-- =============================================
-- Step 2: Create new categories table
-- =============================================

-- Drop existing categories table after backup
DROP TABLE IF EXISTS categories CASCADE;

-- Create new categories table with integer primary key
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_key TEXT UNIQUE NOT NULL,
    en_name TEXT NOT NULL,
    id_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert expense categories
INSERT INTO categories (category_key, en_name, id_name, type) VALUES
('expense_groceries', 'Groceries', 'Kebutuhan Rumah', 'expense'),
('expense_food', 'Dining', 'Makan di Luar', 'expense'),
('expense_transportation', 'Transportation', 'Transportasi', 'expense'),
('expense_subscription', 'Subscription', 'Berlangganan', 'expense'),
('expense_housing', 'Housing', 'Perumahan', 'expense'),
('expense_entertainment', 'Entertainment', 'Hiburan', 'expense'),
('expense_shopping', 'Shopping', 'Belanja', 'expense'),
('expense_health', 'Health', 'Kesehatan', 'expense'),
('expense_education', 'Education', 'Pendidikan', 'expense'),
('expense_travel', 'Travel', 'Perjalanan', 'expense'),
('expense_personal', 'Personal Care', 'Personal Care', 'expense'),
('expense_other', 'Other', 'Lainnya', 'expense');

-- Insert income categories
INSERT INTO categories (category_key, en_name, id_name, type) VALUES
('income_salary', 'Salary', 'Gaji', 'income'),
('income_business', 'Business', 'Bisnis', 'income'),
('income_investment', 'Investment', 'Investasi', 'income'),
('income_gift', 'Gift', 'Hadiah', 'income'),
('income_other', 'Other', 'Lainnya', 'income');

-- Add system category for transfers
INSERT INTO categories (category_key, en_name, id_name, type) VALUES
('system_transfer', 'Transfer', 'Transfer', 'system');

-- Update progress
UPDATE migration_progress SET completed = TRUE WHERE step = 'categories_recreated';

-- =============================================
-- Step 3: Create and populate mapping table
-- =============================================

-- Create a mapping table to maintain relationship between old UUID and new integer IDs
CREATE TABLE category_id_mapping (
    old_id UUID,
    new_id INTEGER REFERENCES categories(category_id),
    category_key TEXT,
    PRIMARY KEY (old_id)
);

-- Insert mappings from backup to new categories based on category_key
INSERT INTO category_id_mapping (old_id, new_id, category_key)
SELECT cb.id, c.category_id, c.category_key
FROM categories_backup cb
JOIN categories c ON 
    -- Try to match by exact category_key
    (cb.category_key = c.category_key) OR
    -- If category_key is not found, try to infer from name
    (cb.en_name = c.en_name) OR
    (cb.id_name = c.id_name)
ON CONFLICT (old_id) DO NOTHING;

-- For any old categories that didn't map, assign to appropriate "other" category by type
INSERT INTO category_id_mapping (old_id, new_id, category_key)
SELECT cb.id, c.category_id, c.category_key
FROM categories_backup cb
JOIN categories c ON 
    CASE 
        WHEN cb.type = 'expense' THEN c.category_key = 'expense_other'
        WHEN cb.type = 'income' THEN c.category_key = 'income_other'
        WHEN cb.type = 'system' THEN c.category_key = 'system_transfer'
        ELSE c.category_key = 'expense_other'
    END
WHERE NOT EXISTS (
    SELECT 1 FROM category_id_mapping cim WHERE cim.old_id = cb.id
)
ON CONFLICT (old_id) DO NOTHING;

-- Update progress
UPDATE migration_progress SET completed = TRUE WHERE step = 'mappings_created';

-- =============================================
-- Step 4: Update the transactions table
-- =============================================

-- First, create a temporary column to hold new integer IDs
ALTER TABLE transactions 
ADD COLUMN temp_category_id INTEGER;

-- Update transactions to use new category IDs from mapping table
UPDATE transactions t
SET temp_category_id = cim.new_id
FROM category_id_mapping cim
WHERE t.category_id = cim.old_id;

-- For transactions without a mapping, default to "other" category based on type
UPDATE transactions t
SET temp_category_id = 
    CASE 
        WHEN t.type = 'expense' THEN (SELECT category_id FROM categories WHERE category_key = 'expense_other')
        WHEN t.type = 'income' THEN (SELECT category_id FROM categories WHERE category_key = 'income_other')
        WHEN t.type = 'transfer' THEN (SELECT category_id FROM categories WHERE category_key = 'system_transfer')
        ELSE (SELECT category_id FROM categories WHERE category_key = 'expense_other')
    END
WHERE t.temp_category_id IS NULL;

-- Drop the original category_id column and rename the new one
ALTER TABLE transactions 
DROP COLUMN category_id CASCADE;

ALTER TABLE transactions 
RENAME COLUMN temp_category_id TO category_id;

-- Add foreign key constraint
ALTER TABLE transactions
ADD CONSTRAINT fk_transaction_category
FOREIGN KEY (category_id) REFERENCES categories(category_id);

-- Update progress
UPDATE migration_progress SET completed = TRUE WHERE step = 'transactions_updated';

-- =============================================
-- Step 5: Update the budgets table
-- =============================================

-- First, create a temporary column to hold new integer IDs
ALTER TABLE budgets 
ADD COLUMN temp_category_id INTEGER;

-- Update budgets to use new category IDs from mapping table
UPDATE budgets b
SET temp_category_id = cim.new_id
FROM category_id_mapping cim
WHERE b.category_id = cim.old_id;

-- For budgets without a mapping, default to "expense_other"
UPDATE budgets b
SET temp_category_id = (SELECT category_id FROM categories WHERE category_key = 'expense_other')
WHERE b.temp_category_id IS NULL;

-- Drop the original category_id column and rename the new one
ALTER TABLE budgets 
DROP COLUMN category_id CASCADE;

ALTER TABLE budgets 
RENAME COLUMN temp_category_id TO category_id;

-- Add foreign key constraint
ALTER TABLE budgets
ADD CONSTRAINT fk_budget_category
FOREIGN KEY (category_id) REFERENCES categories(category_id);

-- Update progress
UPDATE migration_progress SET completed = TRUE WHERE step = 'budgets_updated';

-- =============================================
-- Step 6: Clean up old columns if they exist
-- =============================================

-- Drop 'category' column from transactions if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE transactions DROP COLUMN category;
    END IF;
END$$;

-- Drop 'category' column from budgets if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budgets' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE budgets DROP COLUMN category;
    END IF;
END$$;

-- =============================================
-- Step 7: Create triggers and functions
-- =============================================

-- Create function for transaction defaults
CREATE OR REPLACE FUNCTION set_default_category_for_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- If category_id is null, set a default based on transaction type
    IF NEW.category_id IS NULL THEN
        IF NEW.type = 'expense' THEN
            NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'expense_other');
        ELSIF NEW.type = 'income' THEN
            NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'income_other');
        ELSIF NEW.type = 'transfer' THEN
            NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'system_transfer');
        ELSE
            NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'expense_other');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for budget defaults
CREATE OR REPLACE FUNCTION set_default_category_for_budget()
RETURNS TRIGGER AS $$
BEGIN
    -- If category_id is null, set to expense_other as default
    IF NEW.category_id IS NULL THEN
        NEW.category_id := (SELECT category_id FROM categories WHERE category_key = 'expense_other');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a new version of verify_category_id function
CREATE OR REPLACE FUNCTION verify_category_id()
RETURNS TRIGGER AS $$
DECLARE
    other_expense_id INTEGER;
    other_income_id INTEGER;
    transfer_id INTEGER;
BEGIN
    -- Get default category IDs for fallback
    SELECT category_id INTO other_expense_id FROM categories WHERE category_key = 'expense_other' LIMIT 1;
    SELECT category_id INTO other_income_id FROM categories WHERE category_key = 'income_other' LIMIT 1;
    SELECT category_id INTO transfer_id FROM categories WHERE category_key = 'system_transfer' LIMIT 1;
    
    -- Ensure category_id is provided or set a default
    IF NEW.category_id IS NULL THEN
        IF NEW.type = 'expense' THEN
            NEW.category_id := other_expense_id;
        ELSIF NEW.type = 'income' THEN
            NEW.category_id := other_income_id;
        ELSIF NEW.type = 'transfer' THEN
            NEW.category_id := transfer_id;
        END IF;
    END IF;
    
    -- Verify category_id exists in categories table
    IF NOT EXISTS (SELECT 1 FROM categories WHERE category_id = NEW.category_id) THEN
        IF NEW.type = 'expense' THEN
            NEW.category_id := other_expense_id;
        ELSIF NEW.type = 'income' THEN
            NEW.category_id := other_income_id;
        ELSIF NEW.type = 'transfer' THEN
            NEW.category_id := transfer_id;
        END IF;
    END IF;
    
    -- For transfers, ensure category is the transfer category
    IF NEW.type = 'transfer' AND 
       NOT EXISTS (SELECT 1 FROM categories WHERE category_id = NEW.category_id AND type = 'system') THEN
        NEW.category_id := transfer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create transaction triggers
DROP TRIGGER IF EXISTS verify_transaction_category ON transactions;
CREATE TRIGGER verify_transaction_category
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION verify_category_id();

DROP TRIGGER IF EXISTS set_default_category_trigger ON transactions;
CREATE TRIGGER set_default_category_trigger
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION set_default_category_for_transaction();

-- Create budget triggers
DROP TRIGGER IF EXISTS verify_budget_category ON budgets;
CREATE TRIGGER verify_budget_category
BEFORE INSERT OR UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION verify_category_id();

DROP TRIGGER IF EXISTS set_default_category_trigger_budget ON budgets;
CREATE TRIGGER set_default_category_trigger_budget
BEFORE INSERT OR UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION set_default_category_for_budget();

-- Update progress
UPDATE migration_progress SET completed = TRUE WHERE step = 'functions_recreated';

-- =============================================
-- Step 8: Final validation
-- =============================================

DO $$
DECLARE
    category_count INTEGER;
    transaction_null_count INTEGER;
    budget_null_count INTEGER;
BEGIN
    -- Check that we have all required categories
    SELECT COUNT(*) INTO category_count FROM categories;
    IF category_count < 15 THEN
        RAISE WARNING 'Expected at least 15 categories, but found only %', category_count;
    END IF;
    
    -- Check for any null category_ids in transactions
    SELECT COUNT(*) INTO transaction_null_count 
    FROM transactions 
    WHERE category_id IS NULL;
    
    IF transaction_null_count > 0 THEN
        RAISE WARNING 'Found % transactions with NULL category_id', transaction_null_count;
        
        -- Fix any remaining null categories
        UPDATE transactions
        SET category_id = (
            SELECT category_id FROM categories 
            WHERE category_key = CASE
                WHEN transactions.type = 'expense' THEN 'expense_other'
                WHEN transactions.type = 'income' THEN 'income_other'
                WHEN transactions.type = 'transfer' THEN 'system_transfer'
                ELSE 'expense_other'
            END
        )
        WHERE category_id IS NULL;
    END IF;
    
    -- Check for any null category_ids in budgets
    SELECT COUNT(*) INTO budget_null_count 
    FROM budgets 
    WHERE category_id IS NULL;
    
    IF budget_null_count > 0 THEN
        RAISE WARNING 'Found % budgets with NULL category_id', budget_null_count;
        
        -- Fix any remaining null categories
        UPDATE budgets
        SET category_id = (SELECT category_id FROM categories WHERE category_key = 'expense_other')
        WHERE category_id IS NULL;
    END IF;
    
    -- Log successful completion
    RAISE NOTICE 'Migration validation complete: % categories, fixed % transaction nulls, fixed % budget nulls', 
        category_count, transaction_null_count, budget_null_count;
END$$;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Category migration completed successfully.';
    RAISE NOTICE 'Please update your application code to use the new integer category IDs.';
END$$; 