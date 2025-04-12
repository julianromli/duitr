-- Step 4: Finalize migration by dropping the old category column and making category_id required

-- First, identify and fix inconsistent category_id values
DO $$
DECLARE
    invalid_cat_count INTEGER;
    other_expense_id UUID;
    other_income_id UUID;
    transfer_id UUID;
BEGIN
    -- Get the 'other' category IDs for fallback
    SELECT id INTO other_expense_id FROM categories WHERE category_key = 'other' LIMIT 1;
    SELECT id INTO other_income_id FROM categories WHERE category_key = 'other_income' LIMIT 1;
    SELECT id INTO transfer_id FROM categories WHERE category_key = 'transfer' LIMIT 1;
    
    -- Check for transactions with invalid category_id (not in categories table)
    SELECT COUNT(*) INTO invalid_cat_count
    FROM public.transactions t
    WHERE t.category_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = t.category_id);
    
    IF invalid_cat_count > 0 THEN
        RAISE NOTICE 'Found % transactions with invalid category_id. Fixing...', invalid_cat_count;
        
        -- Fix expense transactions with invalid category_id
        UPDATE public.transactions t
        SET category_id = other_expense_id
        WHERE t.type = 'expense'
        AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = t.category_id);
        
        -- Fix income transactions with invalid category_id
        UPDATE public.transactions t
        SET category_id = other_income_id
        WHERE t.type = 'income'
        AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = t.category_id);
        
        -- Fix transfer transactions with invalid category_id
        UPDATE public.transactions t
        SET category_id = transfer_id
        WHERE t.type = 'transfer'
        AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = t.category_id);
    END IF;
    
    -- Also fix any NULL category_id values
    UPDATE public.transactions
    SET category_id = other_expense_id
    WHERE category_id IS NULL AND type = 'expense';
    
    UPDATE public.transactions
    SET category_id = other_income_id
    WHERE category_id IS NULL AND type = 'income';
    
    UPDATE public.transactions
    SET category_id = transfer_id
    WHERE category_id IS NULL AND type = 'transfer';
END $$;

-- Do the same for budgets
DO $$
DECLARE
    invalid_cat_count INTEGER;
    other_expense_id UUID;
BEGIN
    -- Get the 'other' expense category ID for fallback
    SELECT id INTO other_expense_id FROM categories WHERE category_key = 'other' LIMIT 1;
    
    -- Check for budgets with invalid category_id
    SELECT COUNT(*) INTO invalid_cat_count
    FROM public.budgets b
    WHERE b.category_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = b.category_id);
    
    IF invalid_cat_count > 0 THEN
        RAISE NOTICE 'Found % budgets with invalid category_id. Fixing...', invalid_cat_count;
        
        -- Fix budgets with invalid category_id
        UPDATE public.budgets b
        SET category_id = other_expense_id
        WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = b.category_id);
    END IF;
    
    -- Also fix any NULL category_id values
    UPDATE public.budgets
    SET category_id = other_expense_id
    WHERE category_id IS NULL;
END $$;

-- Now verify all transactions have valid category_id
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    -- Check for transactions without category_id
    SELECT COUNT(*) INTO missing_count
    FROM public.transactions
    WHERE category_id IS NULL;

    IF missing_count > 0 THEN
        RAISE NOTICE 'There are % transactions without category_id. Please fix these before proceeding.', missing_count;
    ELSE
        -- Make category_id NOT NULL in transactions table
        ALTER TABLE public.transactions 
        ALTER COLUMN category_id SET NOT NULL;
        
        -- Add foreign key constraint
        ALTER TABLE public.transactions
        ADD CONSTRAINT fk_transaction_category
        FOREIGN KEY (category_id) REFERENCES public.categories(id);
        
        -- Drop the old category column from transactions
        ALTER TABLE public.transactions DROP COLUMN IF EXISTS category;
        
        RAISE NOTICE 'Successfully finalized transactions table migration.';
    END IF;
END $$;

-- Verify all budgets have valid category_id
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    -- Check for budgets without category_id
    SELECT COUNT(*) INTO missing_count
    FROM public.budgets
    WHERE category_id IS NULL;

    IF missing_count > 0 THEN
        RAISE NOTICE 'There are % budgets without category_id. Please fix these before proceeding.', missing_count;
    ELSE
        -- Make category_id NOT NULL in budgets table
        ALTER TABLE public.budgets 
        ALTER COLUMN category_id SET NOT NULL;
        
        -- Add foreign key constraint
        ALTER TABLE public.budgets
        ADD CONSTRAINT fk_budget_category
        FOREIGN KEY (category_id) REFERENCES public.categories(id);
        
        -- Drop the old category column from budgets
        ALTER TABLE public.budgets DROP COLUMN IF EXISTS category;
        
        RAISE NOTICE 'Successfully finalized budgets table migration.';
    END IF;
END $$;

-- Sort transactions by date
CREATE OR REPLACE VIEW transactions_view AS
SELECT *
FROM public.transactions
ORDER BY date DESC;

-- Create a trigger to ensure transactions are properly linked to categories on insert/update
CREATE OR REPLACE FUNCTION verify_category_id()
RETURNS TRIGGER AS $$
DECLARE
    other_expense_id UUID;
    other_income_id UUID;
    transfer_id UUID;
BEGIN
    -- Get default category IDs for fallback
    SELECT id INTO other_expense_id FROM categories WHERE category_key = 'other' LIMIT 1;
    SELECT id INTO other_income_id FROM categories WHERE category_key = 'other_income' LIMIT 1;
    SELECT id INTO transfer_id FROM categories WHERE category_key = 'transfer' LIMIT 1;
    
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
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = NEW.category_id) THEN
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
       NOT EXISTS (SELECT 1 FROM public.categories WHERE id = NEW.category_id AND type = 'system') THEN
        NEW.category_id := transfer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to transactions table
DROP TRIGGER IF EXISTS verify_transaction_category ON public.transactions;
CREATE TRIGGER verify_transaction_category
BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION verify_category_id();

-- Apply trigger to budgets table
DROP TRIGGER IF EXISTS verify_budget_category ON public.budgets;
CREATE TRIGGER verify_budget_category
BEFORE INSERT OR UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION verify_category_id(); 