-- Step 3: Map budgets table categories to the correct category_id values

-- First, ensure category_id column exists
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS category_id UUID;

-- Map expense budget categories
UPDATE public.budgets b
SET category_id = c.id
FROM public.categories c
WHERE 
  (b.category_id IS NULL OR b.category_id::text = '') AND
  (
    (LOWER(b.category) LIKE '%makan%' OR LOWER(b.category) LIKE '%dining%') AND c.id = '177baeb6-f15c-4265-978d-c0c50d93a3b9' OR
    (LOWER(b.category) LIKE '%transport%') AND c.id = '6f51d1f5-93ce-4be4-803e-3496f27ecd28' OR
    (LOWER(b.category) LIKE '%kebutuhan rumah%' OR LOWER(b.category) LIKE '%grocery%') AND c.id = '11c2cd7e-3a6c-4c5a-b31a-4352302e9434' OR
    (LOWER(b.category) LIKE '%berlangganan%' OR LOWER(b.category) LIKE '%utilities%' OR LOWER(b.category) LIKE '%subscription%') AND c.id = '74a49fa4-c6ad-469f-b8e9-1ca2c39af8ef' OR
    (LOWER(b.category) LIKE '%perumahan%' OR LOWER(b.category) LIKE '%hous%' OR LOWER(b.category) LIKE '%rent%') AND c.id = '02bfa317-f472-489b-a1fa-30f47fff90d7' OR
    (LOWER(b.category) LIKE '%hiburan%' OR LOWER(b.category) LIKE '%entertain%') AND c.id = '9af5d601-9bdb-4494-a84a-f9c2fc1aaa3a' OR
    (LOWER(b.category) LIKE '%belanja%' OR LOWER(b.category) LIKE '%shop%') AND c.id = '67b118ab-84c3-46ad-9df5-f5e51c22aef9' OR
    (LOWER(b.category) LIKE '%kesehatan%' OR LOWER(b.category) LIKE '%health%') AND c.id = '6c4b43a0-5bb6-4447-8d0a-2e2e86b1627c' OR
    (LOWER(b.category) LIKE '%pendidikan%' OR LOWER(b.category) LIKE '%edu%') AND c.id = '8ca4837b-e7f6-4a61-ae0d-b11fb3f05a29' OR
    (LOWER(b.category) LIKE '%perjalanan%' OR LOWER(b.category) LIKE '%travel%') AND c.id = '3e68c11f-1b19-41ce-b59e-7d4332635c37' OR
    (LOWER(b.category) LIKE '%hadiah%' OR LOWER(b.category) LIKE '%gift%') AND c.id = '87ca482e-ce58-4657-9195-f503a31e4c67' OR
    (LOWER(b.category) LIKE '%pribadi%' OR LOWER(b.category) LIKE '%personal%') AND c.id = 'a7dee6c2-3fef-4ee3-9ec9-ebf83a279c66' OR
    (LOWER(b.category) LIKE '%food%' OR LOWER(b.category) LIKE '%makanan%') AND c.id = '5191a2c6-c728-4d17-ab81-f34166fb0c65'
  );

-- Update remaining budget entries with 'Other' category
UPDATE public.budgets b
SET category_id = c.id
FROM public.categories c
WHERE
  (b.category_id IS NULL OR b.category_id::text = '') AND
  c.id = 'ba397fa0-9049-421b-af88-b8e069be26f3'; -- Other expense category

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS budgets_category_id_idx ON public.budgets (category_id); 