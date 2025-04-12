-- Step 2: Map transactions table categories to the correct category_id values

-- First, ensure category_id column exists
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id UUID;

-- Map expense categories
UPDATE public.transactions t
SET category_id = c.id
FROM public.categories c
WHERE 
  (t.category_id IS NULL OR t.category_id::text = '') AND
  t.type = 'expense' AND
  (
    (LOWER(t.category) LIKE '%makan%' OR LOWER(t.category) LIKE '%dining%') AND c.id = '177baeb6-f15c-4265-978d-c0c50d93a3b9' OR
    (LOWER(t.category) LIKE '%transport%') AND c.id = '6f51d1f5-93ce-4be4-803e-3496f27ecd28' OR
    (LOWER(t.category) LIKE '%kebutuhan rumah%' OR LOWER(t.category) LIKE '%grocery%') AND c.id = '11c2cd7e-3a6c-4c5a-b31a-4352302e9434' OR
    (LOWER(t.category) LIKE '%berlangganan%' OR LOWER(t.category) LIKE '%utilities%' OR LOWER(t.category) LIKE '%subscription%') AND c.id = '74a49fa4-c6ad-469f-b8e9-1ca2c39af8ef' OR
    (LOWER(t.category) LIKE '%perumahan%' OR LOWER(t.category) LIKE '%hous%' OR LOWER(t.category) LIKE '%rent%') AND c.id = '02bfa317-f472-489b-a1fa-30f47fff90d7' OR
    (LOWER(t.category) LIKE '%hiburan%' OR LOWER(t.category) LIKE '%entertain%') AND c.id = '9af5d601-9bdb-4494-a84a-f9c2fc1aaa3a' OR
    (LOWER(t.category) LIKE '%belanja%' OR LOWER(t.category) LIKE '%shop%') AND c.id = '67b118ab-84c3-46ad-9df5-f5e51c22aef9' OR
    (LOWER(t.category) LIKE '%kesehatan%' OR LOWER(t.category) LIKE '%health%') AND c.id = '6c4b43a0-5bb6-4447-8d0a-2e2e86b1627c' OR
    (LOWER(t.category) LIKE '%pendidikan%' OR LOWER(t.category) LIKE '%edu%') AND c.id = '8ca4837b-e7f6-4a61-ae0d-b11fb3f05a29' OR
    (LOWER(t.category) LIKE '%perjalanan%' OR LOWER(t.category) LIKE '%travel%') AND c.id = '3e68c11f-1b19-41ce-b59e-7d4332635c37' OR
    (LOWER(t.category) LIKE '%hadiah%' OR LOWER(t.category) LIKE '%gift%') AND c.id = '87ca482e-ce58-4657-9195-f503a31e4c67' OR
    (LOWER(t.category) LIKE '%pribadi%' OR LOWER(t.category) LIKE '%personal%') AND c.id = 'a7dee6c2-3fef-4ee3-9ec9-ebf83a279c66' OR
    (LOWER(t.category) LIKE '%food%' OR LOWER(t.category) LIKE '%makanan%') AND c.id = '5191a2c6-c728-4d17-ab81-f34166fb0c65'
  );

-- Update remaining expense transactions with 'Other' category
UPDATE public.transactions t
SET category_id = c.id
FROM public.categories c
WHERE
  (t.category_id IS NULL OR t.category_id::text = '') AND
  t.type = 'expense' AND
  c.id = 'ba397fa0-9049-421b-af88-b8e069be26f3'; -- Other expense category

-- Map income categories
UPDATE public.transactions t
SET category_id = c.id
FROM public.categories c
WHERE 
  (t.category_id IS NULL OR t.category_id::text = '') AND
  t.type = 'income' AND
  (
    (LOWER(t.category) LIKE '%gaji%' OR LOWER(t.category) LIKE '%salary%') AND c.id = 'cbd7ddc5-8406-4ed7-8f6a-cf6a7fc9a53c' OR
    (LOWER(t.category) LIKE '%bisnis%' OR LOWER(t.category) LIKE '%business%') AND c.id = 'd3a5a5a7-7d4c-4d1d-9d5a-1d3e5a4d3e2a' OR
    (LOWER(t.category) LIKE '%investasi%' OR LOWER(t.category) LIKE '%invest%') AND c.id = 'e9b3c1d2-5f6a-7b8c-9d0e-1f2a3b4c5d6e' OR
    (LOWER(t.category) LIKE '%hadiah%' OR LOWER(t.category) LIKE '%gift%') AND c.id = 'abcdef12-3456-7890-abcd-ef1234567890' OR
    (LOWER(t.category) LIKE '%bonus%') AND c.id = 'f1e2d3c4-b5a6-7890-1234-56789abcdef0' OR
    (LOWER(t.category) LIKE '%pengembalian%' OR LOWER(t.category) LIKE '%refund%') AND c.id = '0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d' OR
    (LOWER(t.category) LIKE '%freelance%' OR LOWER(t.category) LIKE '%pekerja lepas%') AND c.id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
  );

-- Update remaining income transactions with 'Other Income' category
UPDATE public.transactions t
SET category_id = c.id
FROM public.categories c
WHERE
  (t.category_id IS NULL OR t.category_id::text = '') AND
  t.type = 'income' AND
  c.id = '12345678-90ab-cdef-1234-567890abcdef'; -- Other income category

-- Map transfer transactions
UPDATE public.transactions t
SET category_id = c.id
FROM public.categories c
WHERE 
  (t.category_id IS NULL OR t.category_id::text = '') AND
  (t.type = 'transfer' OR LOWER(t.category) LIKE '%transfer%') AND
  c.id = '0c30fc56-0f29-4267-bc32-31a05310a97e'; -- Transfer category

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON public.transactions (category_id); 