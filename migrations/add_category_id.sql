-- Add categoryId column to transactions table
-- If column already exists as UUID, keep it, otherwise add as TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'category_id'
        AND data_type = 'uuid'
    ) THEN
        -- Column exists as UUID, we'll cast values to UUID
        -- First handle expense categories
        UPDATE public.transactions 
        SET category_id = 
          CASE 
            WHEN LOWER(category) LIKE '%grocery%' OR LOWER(category) LIKE '%kebutuhan rumah%' THEN md5('expense_groceries')::uuid
            WHEN LOWER(category) LIKE '%dining%' OR LOWER(category) LIKE '%makan%' THEN md5('expense_dining')::uuid
            WHEN LOWER(category) LIKE '%transport%' THEN md5('expense_transportation')::uuid
            WHEN LOWER(category) LIKE '%utilities%' OR LOWER(category) LIKE '%berlangganan%' OR LOWER(category) LIKE '%subscription%' THEN md5('expense_utilities')::uuid
            WHEN LOWER(category) LIKE '%hous%' OR LOWER(category) LIKE '%perumahan%' OR LOWER(category) LIKE '%rent%' THEN md5('expense_housing')::uuid
            WHEN LOWER(category) LIKE '%entertain%' OR LOWER(category) LIKE '%hiburan%' THEN md5('expense_entertainment')::uuid
            WHEN LOWER(category) LIKE '%shop%' OR LOWER(category) LIKE '%belanja%' THEN md5('expense_shopping')::uuid
            WHEN LOWER(category) LIKE '%health%' OR LOWER(category) LIKE '%kesehatan%' THEN md5('expense_healthcare')::uuid
            WHEN LOWER(category) LIKE '%edu%' OR LOWER(category) LIKE '%pendidikan%' THEN md5('expense_education')::uuid
            WHEN LOWER(category) LIKE '%personal%' THEN md5('expense_personal_care')::uuid
            WHEN LOWER(category) LIKE '%travel%' OR LOWER(category) LIKE '%perjalanan%' THEN md5('expense_travel')::uuid
            WHEN LOWER(category) LIKE '%gift%' OR LOWER(category) LIKE '%hadiah%' THEN md5('expense_gifts')::uuid
            WHEN LOWER(category) LIKE '%transfer%' THEN md5('system_transfer')::uuid
            ELSE md5('expense_other')::uuid
          END
        WHERE type = 'expense';

        -- Handle income categories
        UPDATE public.transactions 
        SET category_id = 
          CASE 
            WHEN LOWER(category) LIKE '%salary%' OR LOWER(category) LIKE '%gaji%' THEN md5('income_salary')::uuid
            WHEN LOWER(category) LIKE '%business%' OR LOWER(category) LIKE '%bisnis%' THEN md5('income_business')::uuid
            WHEN LOWER(category) LIKE '%invest%' THEN md5('income_investment')::uuid
            WHEN LOWER(category) LIKE '%gift%' OR LOWER(category) LIKE '%hadiah%' THEN md5('income_gift')::uuid
            WHEN LOWER(category) LIKE '%freelance%' OR LOWER(category) LIKE '%pekerja lepas%' THEN md5('income_freelance')::uuid
            WHEN LOWER(category) LIKE '%refund%' OR LOWER(category) LIKE '%pengembalian%' THEN md5('income_refund')::uuid
            WHEN LOWER(category) LIKE '%bonus%' THEN md5('income_bonus')::uuid
            ELSE md5('income_other')::uuid
          END
        WHERE type = 'income';

        -- Handle transfers
        UPDATE public.transactions 
        SET category_id = md5('system_transfer')::uuid
        WHERE LOWER(category) LIKE '%transfer%' OR type = 'transfer';

        -- Ensure that all transactions have a category_id
        UPDATE public.transactions 
        SET category_id = CASE 
            WHEN type = 'income' THEN md5('income_other')::uuid
            ELSE md5('expense_other')::uuid
          END
        WHERE category_id IS NULL;

    ELSE
        -- Drop the column if it exists with wrong type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'category_id'
        ) THEN
            ALTER TABLE public.transactions DROP COLUMN category_id;
        END IF;

        -- Add column as TEXT
        ALTER TABLE public.transactions ADD COLUMN category_id TEXT;

        -- First handle expense categories
        UPDATE public.transactions 
        SET category_id = 
          CASE 
            WHEN LOWER(category) LIKE '%grocery%' OR LOWER(category) LIKE '%kebutuhan rumah%' THEN 'expense_groceries'
            WHEN LOWER(category) LIKE '%dining%' OR LOWER(category) LIKE '%makan%' THEN 'expense_dining'
            WHEN LOWER(category) LIKE '%transport%' THEN 'expense_transportation'
            WHEN LOWER(category) LIKE '%utilities%' OR LOWER(category) LIKE '%berlangganan%' OR LOWER(category) LIKE '%subscription%' THEN 'expense_utilities'
            WHEN LOWER(category) LIKE '%hous%' OR LOWER(category) LIKE '%perumahan%' OR LOWER(category) LIKE '%rent%' THEN 'expense_housing'
            WHEN LOWER(category) LIKE '%entertain%' OR LOWER(category) LIKE '%hiburan%' THEN 'expense_entertainment'
            WHEN LOWER(category) LIKE '%shop%' OR LOWER(category) LIKE '%belanja%' THEN 'expense_shopping'
            WHEN LOWER(category) LIKE '%health%' OR LOWER(category) LIKE '%kesehatan%' THEN 'expense_healthcare'
            WHEN LOWER(category) LIKE '%edu%' OR LOWER(category) LIKE '%pendidikan%' THEN 'expense_education'
            WHEN LOWER(category) LIKE '%personal%' THEN 'expense_personal_care'
            WHEN LOWER(category) LIKE '%travel%' OR LOWER(category) LIKE '%perjalanan%' THEN 'expense_travel'
            WHEN LOWER(category) LIKE '%gift%' OR LOWER(category) LIKE '%hadiah%' THEN 'expense_gifts'
            WHEN LOWER(category) LIKE '%transfer%' THEN 'system_transfer'
            ELSE 'expense_other'
          END
        WHERE type = 'expense';

        -- Handle income categories
        UPDATE public.transactions 
        SET category_id = 
          CASE 
            WHEN LOWER(category) LIKE '%salary%' OR LOWER(category) LIKE '%gaji%' THEN 'income_salary'
            WHEN LOWER(category) LIKE '%business%' OR LOWER(category) LIKE '%bisnis%' THEN 'income_business'
            WHEN LOWER(category) LIKE '%invest%' THEN 'income_investment'
            WHEN LOWER(category) LIKE '%gift%' OR LOWER(category) LIKE '%hadiah%' THEN 'income_gift'
            WHEN LOWER(category) LIKE '%freelance%' OR LOWER(category) LIKE '%pekerja lepas%' THEN 'income_freelance'
            WHEN LOWER(category) LIKE '%refund%' OR LOWER(category) LIKE '%pengembalian%' THEN 'income_refund'
            WHEN LOWER(category) LIKE '%bonus%' THEN 'income_bonus'
            ELSE 'income_other'
          END
        WHERE type = 'income';

        -- Handle transfers
        UPDATE public.transactions 
        SET category_id = 'system_transfer'
        WHERE LOWER(category) LIKE '%transfer%' OR type = 'transfer';

        -- Ensure that all transactions have a category_id
        UPDATE public.transactions 
        SET category_id = CASE 
            WHEN type = 'income' THEN 'income_other'
            ELSE 'expense_other'
          END
        WHERE category_id IS NULL;
    END IF;
END
$$;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON public.transactions (category_id); 