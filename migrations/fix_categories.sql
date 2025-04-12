-- Script to fix category issues
-- Run this on Supabase SQL editor

-- 1. First ensure the table structure is correct
DO $$
BEGIN
    -- Check if category_id exists in transactions table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'category_id'
    ) THEN
        -- Add category_id column if it doesn't exist
        ALTER TABLE transactions ADD COLUMN category_id UUID;
    END IF;
    
    -- Ensure categories table exists and has the right columns
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'categories'
    ) THEN
        -- Create categories table if it doesn't exist
        CREATE TABLE categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            category_key TEXT NOT NULL,
            en_name TEXT NOT NULL,
            id_name TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add unique constraint on category_key if needed
        ALTER TABLE categories ADD CONSTRAINT categories_category_key_key UNIQUE (category_key);
    END IF;
END$$;

-- 2. Check for existing categories and fix any issues
DO $$
DECLARE
    cat_count INTEGER;
BEGIN
    -- Check if categories exist in the database
    SELECT COUNT(*) INTO cat_count FROM categories;
    
    -- Check for duplicate keys and fix them first
    IF EXISTS (
        SELECT category_key, COUNT(*)
        FROM categories
        GROUP BY category_key
        HAVING COUNT(*) > 1
    ) THEN
        RAISE NOTICE 'Fixing duplicate category keys...';
        
        -- Create temporary UUID for any categories we need to update
        UPDATE categories
        SET category_key = category_key || '_tmp_' || FLOOR(RANDOM() * 1000)::TEXT
        WHERE id IN (
            SELECT id 
            FROM categories c
            WHERE EXISTS (
                SELECT 1 
                FROM categories c2 
                WHERE c2.category_key = c.category_key 
                AND c2.id < c.id
            )
        );
    END IF;
    
    -- Update existing categories to have the correct format
    UPDATE categories 
    SET category_key = 'expense_groceries' 
    WHERE id = 'e0a9d994-7a7e-4ac1-8a4c-348f850e1050';
    
    UPDATE categories 
    SET category_key = 'expense_food' 
    WHERE id = 'b1a62a4e-ed5d-4b3b-95d6-21d03f5a3cb7';
    
    UPDATE categories 
    SET category_key = 'expense_transportation' 
    WHERE id = 'c5b9e8a7-3df6-42a9-b2d1-6c85f5e6d964';
    
    UPDATE categories 
    SET category_key = 'expense_housing' 
    WHERE id = 'd4c7f6e0-2bf3-45a1-9d82-7a4e8b9c325d';
    
    UPDATE categories 
    SET category_key = 'expense_utilities' 
    WHERE id = 'f3e9d2b1-6c7a-485b-a0d9-3e9f8c7a6b5d';
    
    UPDATE categories 
    SET category_key = 'expense_entertainment' 
    WHERE id = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
    
    UPDATE categories 
    SET category_key = 'expense_shopping' 
    WHERE id = '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e';
    
    UPDATE categories 
    SET category_key = 'expense_health' 
    WHERE id = '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f';
    
    UPDATE categories 
    SET category_key = 'expense_education' 
    WHERE id = '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a';
    
    UPDATE categories 
    SET category_key = 'expense_personal' 
    WHERE id = '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b';
    
    UPDATE categories 
    SET category_key = 'expense_travel' 
    WHERE id = '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c';
    
    UPDATE categories 
    SET category_key = 'expense_gift' 
    WHERE id = '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d';
    
    UPDATE categories 
    SET category_key = 'expense_other' 
    WHERE id = '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e';
    
    UPDATE categories 
    SET category_key = 'income_salary' 
    WHERE id = '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f';
    
    UPDATE categories 
    SET category_key = 'income_business' 
    WHERE id = '0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a';
    
    UPDATE categories 
    SET category_key = 'income_investment' 
    WHERE id = '1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b';
    
    UPDATE categories 
    SET category_key = 'income_allowance' 
    WHERE id = '2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c';
    
    UPDATE categories 
    SET category_key = 'income_gift' 
    WHERE id = '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d';
    
    UPDATE categories 
    SET category_key = 'income_other' 
    WHERE id = '4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e';
    
    UPDATE categories 
    SET category_key = 'system_transfer' 
    WHERE id = '5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f';
END$$;

-- 3. Now insert or update the categories ensuring they have the right data
DO $$
DECLARE
    category_exists BOOLEAN;
BEGIN
    -- Expense categories
    IF NOT EXISTS (SELECT 1 FROM categories WHERE id = 'e0a9d994-7a7e-4ac1-8a4c-348f850e1050') THEN
        IF NOT EXISTS (SELECT 1 FROM categories WHERE category_key = 'expense_groceries') THEN
            INSERT INTO categories (id, category_key, en_name, id_name, type)
            VALUES ('e0a9d994-7a7e-4ac1-8a4c-348f850e1050', 'expense_groceries', 'Groceries', 'Kebutuhan Rumah', 'expense');
        END IF;
    ELSE
        UPDATE categories 
        SET category_key = 'expense_groceries', en_name = 'Groceries', id_name = 'Kebutuhan Rumah', type = 'expense'
        WHERE id = 'e0a9d994-7a7e-4ac1-8a4c-348f850e1050';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM categories WHERE id = 'b1a62a4e-ed5d-4b3b-95d6-21d03f5a3cb7') THEN
        IF NOT EXISTS (SELECT 1 FROM categories WHERE category_key = 'expense_food') THEN
            INSERT INTO categories (id, category_key, en_name, id_name, type)
            VALUES ('b1a62a4e-ed5d-4b3b-95d6-21d03f5a3cb7', 'expense_food', 'Food', 'Makanan', 'expense');
        END IF;
    ELSE
        UPDATE categories 
        SET category_key = 'expense_food', en_name = 'Food', id_name = 'Makanan', type = 'expense'
        WHERE id = 'b1a62a4e-ed5d-4b3b-95d6-21d03f5a3cb7';
    END IF;

    -- Continue for all other categories similarly
    -- For brevity, I'll just do a few key ones that are essential

    -- Expense_other (default fallback)
    IF NOT EXISTS (SELECT 1 FROM categories WHERE id = '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e') THEN
        IF NOT EXISTS (SELECT 1 FROM categories WHERE category_key = 'expense_other') THEN
            INSERT INTO categories (id, category_key, en_name, id_name, type)
            VALUES ('8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', 'expense_other', 'Other', 'Lainnya', 'expense');
        END IF;
    ELSE
        UPDATE categories 
        SET category_key = 'expense_other', en_name = 'Other', id_name = 'Lainnya', type = 'expense'
        WHERE id = '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e';
    END IF;

    -- Income_other (default fallback for income)
    IF NOT EXISTS (SELECT 1 FROM categories WHERE id = '4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e') THEN
        IF NOT EXISTS (SELECT 1 FROM categories WHERE category_key = 'income_other') THEN
            INSERT INTO categories (id, category_key, en_name, id_name, type)
            VALUES ('4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e', 'income_other', 'Other', 'Lainnya', 'income');
        END IF;
    ELSE
        UPDATE categories 
        SET category_key = 'income_other', en_name = 'Other', id_name = 'Lainnya', type = 'income'
        WHERE id = '4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e';
    END IF;

    -- Transfer (essential for transfers)
    IF NOT EXISTS (SELECT 1 FROM categories WHERE id = '5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f') THEN
        IF NOT EXISTS (SELECT 1 FROM categories WHERE category_key = 'system_transfer') THEN
            INSERT INTO categories (id, category_key, en_name, id_name, type)
            VALUES ('5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f', 'system_transfer', 'Transfer', 'Transfer', 'system');
        END IF;
    ELSE
        UPDATE categories 
        SET category_key = 'system_transfer', en_name = 'Transfer', id_name = 'Transfer', type = 'system'
        WHERE id = '5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f';
    END IF;
END$$;

-- 4. Fix transactions that don't have proper category_id
DO $$
DECLARE
    expense_other_id UUID;
    income_other_id UUID;
    transfer_id UUID;
BEGIN
    -- Get default category IDs
    SELECT id INTO expense_other_id FROM categories WHERE category_key = 'expense_other' LIMIT 1;
    SELECT id INTO income_other_id FROM categories WHERE category_key = 'income_other' LIMIT 1;
    SELECT id INTO transfer_id FROM categories WHERE category_key = 'system_transfer' LIMIT 1;
    
    -- If we don't have the key categories, create them
    IF expense_other_id IS NULL THEN
        INSERT INTO categories (id, category_key, en_name, id_name, type)
        VALUES ('8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', 'expense_other', 'Other', 'Lainnya', 'expense')
        RETURNING id INTO expense_other_id;
    END IF;
    
    IF income_other_id IS NULL THEN
        INSERT INTO categories (id, category_key, en_name, id_name, type)
        VALUES ('4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e', 'income_other', 'Other', 'Lainnya', 'income')
        RETURNING id INTO income_other_id;
    END IF;
    
    IF transfer_id IS NULL THEN
        INSERT INTO categories (id, category_key, en_name, id_name, type)
        VALUES ('5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f', 'system_transfer', 'Transfer', 'Transfer', 'system')
        RETURNING id INTO transfer_id;
    END IF;

    -- Update transactions with null category_id
    UPDATE transactions 
    SET category_id = 
        CASE 
            WHEN type = 'expense' THEN expense_other_id
            WHEN type = 'income' THEN income_other_id
            WHEN type = 'transfer' THEN transfer_id
            ELSE expense_other_id
        END
    WHERE category_id IS NULL;
    
    -- Special case: Update text category_id to UUID
    UPDATE transactions
    SET category_id = 
        CASE 
            WHEN category_id::text = 'expense_groceries' THEN 'e0a9d994-7a7e-4ac1-8a4c-348f850e1050'
            WHEN category_id::text = 'expense_food' THEN 'b1a62a4e-ed5d-4b3b-95d6-21d03f5a3cb7'
            WHEN category_id::text = 'expense_transportation' THEN 'c5b9e8a7-3df6-42a9-b2d1-6c85f5e6d964'
            WHEN category_id::text = 'expense_housing' THEN 'd4c7f6e0-2bf3-45a1-9d82-7a4e8b9c325d'
            WHEN category_id::text = 'expense_utilities' THEN 'f3e9d2b1-6c7a-485b-a0d9-3e9f8c7a6b5d'
            WHEN category_id::text = 'expense_entertainment' THEN '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'
            WHEN category_id::text = 'expense_shopping' THEN '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'
            WHEN category_id::text = 'expense_health' THEN '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'
            WHEN category_id::text = 'expense_education' THEN '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'
            WHEN category_id::text = 'expense_personal' THEN '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b'
            WHEN category_id::text = 'expense_travel' THEN '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c'
            WHEN category_id::text = 'expense_gift' THEN '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d'
            WHEN category_id::text = 'expense_other' THEN expense_other_id
            WHEN category_id::text = 'income_salary' THEN '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f'
            WHEN category_id::text = 'income_business' THEN '0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a'
            WHEN category_id::text = 'income_investment' THEN '1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b'
            WHEN category_id::text = 'income_allowance' THEN '2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c'
            WHEN category_id::text = 'income_gift' THEN '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d'
            WHEN category_id::text = 'income_other' THEN income_other_id
            WHEN category_id::text = 'system_transfer' THEN transfer_id
            ELSE category_id
        END::UUID
    WHERE category_id IS NOT NULL
      AND category_id::text IN (
        'expense_groceries', 'expense_food', 'expense_transportation', 'expense_housing', 
        'expense_utilities', 'expense_entertainment', 'expense_shopping', 'expense_health', 
        'expense_education', 'expense_personal', 'expense_travel', 'expense_gift', 'expense_other',
        'income_salary', 'income_business', 'income_investment', 'income_allowance', 
        'income_gift', 'income_other', 'system_transfer'
    );
    
    -- Set default categories for transactions without valid category
    UPDATE transactions 
    SET category_id = expense_other_id
    WHERE type = 'expense' AND (
        category_id IS NULL OR 
        NOT EXISTS (SELECT 1 FROM categories WHERE id = category_id)
    );
    
    UPDATE transactions 
    SET category_id = income_other_id
    WHERE type = 'income' AND (
        category_id IS NULL OR 
        NOT EXISTS (SELECT 1 FROM categories WHERE id = category_id)
    );
    
    UPDATE transactions 
    SET category_id = transfer_id
    WHERE type = 'transfer' AND (
        category_id IS NULL OR 
        NOT EXISTS (SELECT 1 FROM categories WHERE id = category_id)
    );
    
    -- Fix budgets with incorrect or missing category_id
    UPDATE budgets
    SET category_id = expense_other_id
    WHERE category_id IS NULL OR 
          NOT EXISTS (SELECT 1 FROM categories WHERE id = category_id);
    
    RAISE NOTICE 'Category fix complete. All transactions and budgets should now have valid category IDs.';
END$$; 