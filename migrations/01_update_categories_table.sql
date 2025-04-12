-- Step 1: Update the categories table structure and data
-- Add a 'type' column to categories table if it doesn't exist
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS type TEXT;

-- Update existing categories with 'expense' type
UPDATE public.categories
SET type = 'expense'
WHERE id_name IN (
  'Makan di Luar', 'Transportasi', 'Kebutuhan Rumah', 'Berlangganan', 
  'Perumahan', 'Hiburan', 'Belanja', 'Kesehatan', 'Pendidikan', 
  'Perjalanan', 'Personal Care', 'Hadiah', 'Lainnya'
);

-- Update existing categories with 'income' type
UPDATE public.categories
SET type = 'income'
WHERE id_name IN (
  'Gaji', 'Bisnis', 'Investasi', 'Hadiah', 'Bonus', 'Pengembalian', 
  'Pekerja Lepas', 'Lainnya'
);

-- Remove 'OVO' category if it exists (it's a payment method, not a category)
DELETE FROM public.categories WHERE en_name = 'OVO' OR id_name = 'OVO';

-- Create a function to safely insert categories if they don't exist or update them if they do
CREATE OR REPLACE FUNCTION ensure_category(p_id UUID, p_category_key TEXT, p_en_name TEXT, p_id_name TEXT, p_type TEXT)
RETURNS VOID AS $$
BEGIN
    -- Check if the ID exists
    IF EXISTS (SELECT 1 FROM public.categories WHERE id = p_id) THEN
        -- Update existing category
        UPDATE public.categories
        SET 
            en_name = p_en_name, 
            id_name = p_id_name, 
            type = p_type
        WHERE id = p_id;
    -- Check if the category_key exists but with a different ID
    ELSIF EXISTS (SELECT 1 FROM public.categories WHERE category_key = p_category_key) THEN
        -- Only update the entry if it belongs to the same category concept
        UPDATE public.categories
        SET 
            id = p_id,
            en_name = p_en_name, 
            id_name = p_id_name, 
            type = p_type
        WHERE category_key = p_category_key;
    ELSE
        -- Insert new category
        INSERT INTO public.categories (id, category_key, en_name, id_name, type)
        VALUES (p_id, p_category_key, p_en_name, p_id_name, p_type);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Ensure all expense categories exist with correct IDs and names
SELECT ensure_category('02bfa317-f472-489b-a1fa-30f47fff90d7', 'housing', 'Housing', 'Perumahan', 'expense');
SELECT ensure_category('11c2cd7e-3a6c-4c5a-b31a-4352302e9434', 'housing_needs', 'Housing Needs', 'Kebutuhan Rumah', 'expense');
SELECT ensure_category('177baeb6-f15c-4265-978d-c0c50d93a3b9', 'dining', 'Dining', 'Makan di Luar', 'expense');
SELECT ensure_category('3e68c11f-1b19-41ce-b59e-7d4332635c37', 'travel', 'Travel', 'Perjalanan', 'expense');
SELECT ensure_category('5191a2c6-c728-4d17-ab81-f34166fb0c65', 'food', 'Food', 'Makanan', 'expense');
SELECT ensure_category('67b118ab-84c3-46ad-9df5-f5e51c22aef9', 'shopping', 'Shopping', 'Belanja', 'expense');
SELECT ensure_category('6c4b43a0-5bb6-4447-8d0a-2e2e86b1627c', 'health', 'Health', 'Kesehatan', 'expense');
SELECT ensure_category('6f51d1f5-93ce-4be4-803e-3496f27ecd28', 'transportation', 'Transportation', 'Transportasi', 'expense');
SELECT ensure_category('74a49fa4-c6ad-469f-b8e9-1ca2c39af8ef', 'utilities', 'Utilities', 'Utilitas', 'expense');
SELECT ensure_category('87ca482e-ce58-4657-9195-f503a31e4c67', 'gifts', 'Gifts', 'Hadiah', 'expense');
SELECT ensure_category('8ca4837b-e7f6-4a61-ae0d-b11fb3f05a29', 'education', 'Education', 'Pendidikan', 'expense');
SELECT ensure_category('9af5d601-9bdb-4494-a84a-f9c2fc1aaa3a', 'entertainment', 'Entertainment', 'Hiburan', 'expense');
SELECT ensure_category('a7dee6c2-3fef-4ee3-9ec9-ebf83a279c66', 'personal', 'Personal', 'Pribadi', 'expense');
SELECT ensure_category('ba397fa0-9049-421b-af88-b8e069be26f3', 'other', 'Other', 'Lainnya', 'expense');

-- Ensure all income categories exist with correct IDs and names
SELECT ensure_category('ade297be-f8dd-4cf8-b2a7-8b5a0ad5cb6d', 'income', 'Income', 'Pendapatan', 'income');
SELECT ensure_category('cbd7ddc5-8406-4ed7-8f6a-cf6a7fc9a53c', 'salary', 'Salary', 'Gaji', 'income');
SELECT ensure_category('d3a5a5a7-7d4c-4d1d-9d5a-1d3e5a4d3e2a', 'business', 'Business', 'Bisnis', 'income');
SELECT ensure_category('e9b3c1d2-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'investment', 'Investment', 'Investasi', 'income');
SELECT ensure_category('f1e2d3c4-b5a6-7890-1234-56789abcdef0', 'bonus', 'Bonus', 'Bonus', 'income');
SELECT ensure_category('0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'refund', 'Refund', 'Pengembalian', 'income');
SELECT ensure_category('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'freelance', 'Freelance', 'Pekerja Lepas', 'income');
SELECT ensure_category('abcdef12-3456-7890-abcd-ef1234567890', 'gift', 'Gift', 'Hadiah', 'income');
SELECT ensure_category('12345678-90ab-cdef-1234-567890abcdef', 'other_income', 'Other Income', 'Pendapatan Lainnya', 'income');

-- Add system category for transfers
SELECT ensure_category('0c30fc56-0f29-4267-bc32-31a05310a97e', 'transfer', 'Transfer', 'Transfer', 'system');

-- Drop the function when done
DROP FUNCTION ensure_category;

-- Add validation constraint to ensure type is always set
ALTER TABLE public.categories 
ALTER COLUMN type SET NOT NULL,
ADD CONSTRAINT valid_category_type CHECK (type IN ('expense', 'income', 'system'));

-- Create index for faster lookup if it doesn't exist
CREATE INDEX IF NOT EXISTS categories_type_idx ON public.categories (type); 