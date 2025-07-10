-- Migration: Add user-specific custom categories support
-- Description: Adds user_id column to categories table and updates RLS policies
-- This allows users to create their own custom categories while maintaining access to default categories

-- Step 1: Add user_id column to categories table
ALTER TABLE categories 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Update existing categories to have NULL user_id (making them default/system categories)
UPDATE categories 
SET user_id = NULL 
WHERE user_id IS NULL;

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type_user ON categories(type, user_id);

-- Step 4: Enable Row Level Security on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Users can read categories" ON categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;

-- Step 6: Create new RLS policies

-- Policy 1: Users can read default categories (user_id IS NULL) and their own categories
CREATE POLICY "Users can read accessible categories" ON categories
  FOR SELECT
  USING (
    user_id IS NULL OR 
    user_id = auth.uid()
  );

-- Policy 2: Users can insert their own categories
CREATE POLICY "Users can create own categories" ON categories
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own categories (not default ones)
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can delete their own categories (not default ones)
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE
  USING (user_id = auth.uid());

-- Step 7: Add constraint to ensure category_id uniqueness per user
-- Note: We'll use a unique index instead of constraint to allow NULL user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_per_user 
ON categories(category_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Step 8: Update the category_id sequence to start from a higher number for user categories
-- This prevents conflicts with default categories
SELECT setval('categories_category_id_seq', 1000, false);

-- Step 9: Add helpful comments
COMMENT ON COLUMN categories.user_id IS 'NULL for default/system categories, user UUID for custom categories';
COMMENT ON TABLE categories IS 'Categories table with support for user-specific custom categories and default system categories';

-- Step 10: Verify the migration
DO $$
BEGIN
  -- Check if user_id column was added successfully
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: user_id column was not added to categories table';
  END IF;
  
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'categories' AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'Migration failed: RLS was not enabled on categories table';
  END IF;
  
  RAISE NOTICE 'Migration completed successfully: User-specific categories support added';
END $$;