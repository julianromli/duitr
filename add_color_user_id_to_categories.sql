-- Add missing columns to categories table
-- This migration adds color and user_id columns to support custom user categories

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6B7280',
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Update existing categories to have default color
UPDATE categories SET color = '#6B7280' WHERE color IS NULL;

-- Add RLS policies for user categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view accessible categories" ON categories;
DROP POLICY IF EXISTS "Users can create custom categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

-- Policy: Users can view all default categories (user_id is null) and their own custom categories
CREATE POLICY "Users can view accessible categories" ON categories
  FOR SELECT USING (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Policy: Users can insert their own custom categories
CREATE POLICY "Users can create custom categories" ON categories
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Policy: Users can update their own custom categories
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Policy: Users can delete their own custom categories
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (
    user_id = auth.uid()
  );