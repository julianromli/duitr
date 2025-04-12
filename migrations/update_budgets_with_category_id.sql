-- Add categoryId column to budgets table
-- If column already exists as UUID, keep it, otherwise add as TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'budgets' 
        AND column_name = 'category_id'
        AND data_type = 'uuid'
    ) THEN
        -- Column exists as UUID, we'll cast values to UUID
        UPDATE public.budgets 
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
            ELSE md5('expense_other')::uuid
          END;

        -- Ensure that all budgets have a category_id
        UPDATE public.budgets 
        SET category_id = md5('expense_other')::uuid
        WHERE category_id IS NULL;

    ELSE
        -- Drop the column if it exists with wrong type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'budgets' 
            AND column_name = 'category_id'
        ) THEN
            ALTER TABLE public.budgets DROP COLUMN category_id;
        END IF;

        -- Add column as TEXT
        ALTER TABLE public.budgets ADD COLUMN category_id TEXT;

        -- Initially populate with a default mapping based on existing category names
        UPDATE public.budgets 
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
            ELSE 'expense_other'
          END;

        -- Ensure that all budgets have a category_id
        UPDATE public.budgets 
        SET category_id = 'expense_other'
        WHERE category_id IS NULL;
    END IF;
END
$$;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS budgets_category_id_idx ON public.budgets (category_id); 