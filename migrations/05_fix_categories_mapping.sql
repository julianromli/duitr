-- Migration script to fix categories and transactions mapping
-- Fix the issue where all transactions are showing as "Other"

-- First, ensure we have all the required categories in the database
DO $$
DECLARE
    category_count INTEGER;
BEGIN
    -- Check if we have categories
    SELECT COUNT(*) INTO category_count FROM categories;
    
    IF category_count = 0 THEN
        -- Insert basic categories if none exist
        INSERT INTO categories (id, category_key, en_name, id_name, type) VALUES
        -- Expense categories
        ('e0a9d994-7a7e-4ac1-8a4c-348f850e1050', 'groceries', 'Groceries', 'Kebutuhan Rumah', 'expense'),
        ('b1a62a4e-ed5d-4b3b-95d6-21d03f5a3cb7', 'food', 'Food', 'Makanan', 'expense'),
        ('c5b9e8a7-3df6-42a9-b2d1-6c85f5e6d964', 'transportation', 'Transportation', 'Transportasi', 'expense'),
        ('d4c7f6e0-2bf3-45a1-9d82-7a4e8b9c325d', 'housing', 'Housing', 'Perumahan', 'expense'),
        ('f3e9d2b1-6c7a-485b-a0d9-3e9f8c7a6b5d', 'utilities', 'Utilities', 'Utilitas', 'expense'),
        ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', 'entertainment', 'Entertainment', 'Hiburan', 'expense'),
        ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', 'shopping', 'Shopping', 'Belanja', 'expense'),
        ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'health', 'Health', 'Kesehatan', 'expense'),
        ('4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'education', 'Education', 'Pendidikan', 'expense'),
        ('5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'personal', 'Personal', 'Pribadi', 'expense'),
        ('6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'travel', 'Travel', 'Perjalanan', 'expense'),
        ('7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', 'gift', 'Gift', 'Hadiah', 'expense'),
        ('8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', 'other', 'Other', 'Lainnya', 'expense'),
        
        -- Income categories
        ('9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'salary', 'Salary', 'Gaji', 'income'),
        ('0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a', 'business', 'Business', 'Bisnis', 'income'),
        ('1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b', 'investment', 'Investment', 'Investasi', 'income'),
        ('2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c', 'allowance', 'Allowance', 'Tunjangan', 'income'),
        ('3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'gift', 'Gift', 'Hadiah', 'income'),
        ('4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e', 'other_income', 'Other', 'Lainnya', 'income'),
        
        -- Transfer category
        ('5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f', 'transfer', 'Transfer', 'Transfer', 'system');
        
        RAISE NOTICE 'Created basic categories';
    END IF;
END $$;

-- Fix transactions with incorrect or missing category_id
DO $$
DECLARE
    expense_other_id UUID;
    income_other_id UUID;
    transfer_id UUID;
    unknown_category_count INTEGER;
BEGIN
    -- Get default category IDs
    SELECT id INTO expense_other_id FROM categories WHERE category_key = 'other' AND type = 'expense' LIMIT 1;
    SELECT id INTO income_other_id FROM categories WHERE category_key = 'other_income' AND type = 'income' LIMIT 1;
    SELECT id INTO transfer_id FROM categories WHERE category_key = 'transfer' LIMIT 1;
    
    -- Check if we have unknown categories
    IF expense_other_id IS NULL THEN
        RAISE EXCEPTION 'Missing expense_other category. Please run migration 04 first.';
    END IF;
    
    IF income_other_id IS NULL THEN 
        RAISE EXCEPTION 'Missing income_other category. Please run migration 04 first.';
    END IF;
    
    IF transfer_id IS NULL THEN
        RAISE EXCEPTION 'Missing transfer category. Please run migration 04 first.';
    END IF;

    -- Check for transactions with string-format category_id (legacy format)
    UPDATE transactions
    SET category_id = 
        CASE 
            WHEN category_id = 'expense_groceries' THEN 'e0a9d994-7a7e-4ac1-8a4c-348f850e1050'::UUID
            WHEN category_id = 'expense_food' THEN 'b1a62a4e-ed5d-4b3b-95d6-21d03f5a3cb7'::UUID
            WHEN category_id = 'expense_transportation' THEN 'c5b9e8a7-3df6-42a9-b2d1-6c85f5e6d964'::UUID
            WHEN category_id = 'expense_housing' THEN 'd4c7f6e0-2bf3-45a1-9d82-7a4e8b9c325d'::UUID
            WHEN category_id = 'expense_utilities' THEN 'f3e9d2b1-6c7a-485b-a0d9-3e9f8c7a6b5d'::UUID
            WHEN category_id = 'expense_entertainment' THEN '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::UUID
            WHEN category_id = 'expense_shopping' THEN '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::UUID
            WHEN category_id = 'expense_health' THEN '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::UUID
            WHEN category_id = 'expense_education' THEN '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'::UUID
            WHEN category_id = 'expense_personal' THEN '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b'::UUID
            WHEN category_id = 'expense_travel' THEN '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c'::UUID
            WHEN category_id = 'expense_gift' THEN '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d'::UUID
            WHEN category_id = 'expense_other' THEN '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e'::UUID
            WHEN category_id = 'income_salary' THEN '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f'::UUID
            WHEN category_id = 'income_business' THEN '0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a'::UUID
            WHEN category_id = 'income_investment' THEN '1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b'::UUID
            WHEN category_id = 'income_allowance' THEN '2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c'::UUID
            WHEN category_id = 'income_gift' THEN '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d'::UUID
            WHEN category_id = 'income_other' THEN '4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e'::UUID
            WHEN category_id = 'system_transfer' THEN '5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f'::UUID
            ELSE category_id::UUID 
        END
    WHERE category_id IN (
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
    
    RAISE NOTICE 'Fixed category mappings for transactions and budgets';
END $$; 