-- ============================================
-- Category System Refactoring Migration
-- Purpose: Establish database as single source of truth
-- Author: Droid AI
-- Date: 2025-01-17
-- ============================================

-- ============================================
-- STEP 1: Ensure All Default Categories Exist
-- ============================================

-- Insert all default categories with COMPLETE English and Indonesian translations
INSERT INTO categories (category_id, category_key, en_name, id_name, type, icon, color)
VALUES 
  -- EXPENSE CATEGORIES (1-12, 19-21)
  (1, 'expense_groceries', 'Groceries', 'Kebutuhan Rumah', 'expense', 'shopping-basket', '#EF4444'),
  (2, 'expense_food', 'Dining', 'Makan di Luar', 'expense', 'utensils', '#F97316'),
  (3, 'expense_transportation', 'Transportation', 'Transportasi', 'expense', 'car', '#F59E0B'),
  (4, 'expense_subscription', 'Subscription', 'Berlangganan', 'expense', 'repeat', '#3B82F6'),
  (5, 'expense_housing', 'Housing', 'Perumahan', 'expense', 'home', '#8B5CF6'),
  (6, 'expense_entertainment', 'Entertainment', 'Hiburan', 'expense', 'film', '#EC4899'),
  (7, 'expense_shopping', 'Shopping', 'Belanja', 'expense', 'shopping-cart', '#F43F5E'),
  (8, 'expense_health', 'Health', 'Kesehatan', 'expense', 'heart-pulse', '#10B981'),
  (9, 'expense_education', 'Education', 'Pendidikan', 'expense', 'graduation-cap', '#06B6D4'),
  (10, 'expense_travel', 'Travel', 'Perjalanan', 'expense', 'plane', '#6366F1'),
  (11, 'expense_personal', 'Personal Care', 'Perawatan Diri', 'expense', 'user', '#A855F7'),
  (12, 'expense_other', 'Other', 'Lainnya', 'expense', 'more-horizontal', '#6B7280'),
  (19, 'expense_donation', 'Donation', 'Donasi', 'expense', 'heart', '#F87171'),
  (20, 'expense_investment', 'Investment', 'Investasi', 'expense', 'trending-up', '#34D399'),
  (21, 'expense_baby', 'Baby Needs', 'Kebutuhan Bayi', 'expense', 'baby', '#FBB6CE'),
  
  -- INCOME CATEGORIES (13-17)
  (13, 'income_salary', 'Salary', 'Gaji', 'income', 'wallet', '#10B981'),
  (14, 'income_business', 'Business', 'Bisnis', 'income', 'briefcase', '#3B82F6'),
  (15, 'income_investment', 'Investment', 'Investasi', 'income', 'trending-up', '#8B5CF6'),
  (16, 'income_gift', 'Gift', 'Hadiah', 'income', 'gift', '#EC4899'),
  (17, 'income_other', 'Other', 'Lainnya', 'income', 'more-horizontal', '#6B7280'),
  
  -- SYSTEM CATEGORY (18)
  (18, 'system_transfer', 'Transfer', 'Transfer', 'system', 'arrow-right-left', '#0EA5E9')
ON CONFLICT (category_key) DO UPDATE SET
  en_name = EXCLUDED.en_name,
  id_name = EXCLUDED.id_name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- ============================================
-- STEP 2: Verify Translations Complete
-- ============================================

DO $$
DECLARE
  missing_translations INTEGER;
  total_default_categories INTEGER;
BEGIN
  -- Check for empty en_name or id_name in default categories
  SELECT COUNT(*) INTO missing_translations
  FROM categories
  WHERE user_id IS NULL 
    AND (en_name IS NULL OR en_name = '' OR id_name IS NULL OR id_name = '');
  
  IF missing_translations > 0 THEN
    RAISE EXCEPTION 'Found % default categories with missing translations', missing_translations;
  END IF;
  
  -- Verify we have all 21 default categories
  SELECT COUNT(*) INTO total_default_categories
  FROM categories
  WHERE user_id IS NULL;
  
  IF total_default_categories < 21 THEN
    RAISE WARNING 'Expected 21 default categories, found %', total_default_categories;
  END IF;
  
  RAISE NOTICE '✓ All % default categories have complete translations', total_default_categories;
END $$;

-- ============================================
-- STEP 3: Data Validation (Fix Orphaned Categories)
-- ============================================

DO $$
DECLARE
  orphaned_transactions INTEGER;
  orphaned_budgets INTEGER;
BEGIN
  -- Check for transactions with invalid category_id
  SELECT COUNT(*) INTO orphaned_transactions
  FROM transactions t
  LEFT JOIN categories c ON t.category_id = c.category_id
  WHERE t.category_id IS NOT NULL AND c.category_id IS NULL;
  
  IF orphaned_transactions > 0 THEN
    RAISE WARNING 'Found % transactions with orphaned category_id. Fixing...', orphaned_transactions;
    
    -- Fix orphaned transactions by setting to appropriate "Other" category
    UPDATE transactions
    SET category_id = CASE
      WHEN type = 'expense' THEN 12  -- expense_other
      WHEN type = 'income' THEN 17   -- income_other
      WHEN type = 'transfer' THEN 18 -- system_transfer
      ELSE 12
    END
    WHERE category_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM categories WHERE category_id = transactions.category_id);
    
    RAISE NOTICE '✓ Fixed % orphaned transactions', orphaned_transactions;
  ELSE
    RAISE NOTICE '✓ No orphaned transactions found';
  END IF;
  
  -- Check for budgets with invalid category_id
  SELECT COUNT(*) INTO orphaned_budgets
  FROM budgets b
  LEFT JOIN categories c ON b.category_id = c.category_id
  WHERE b.category_id IS NOT NULL AND c.category_id IS NULL;
  
  IF orphaned_budgets > 0 THEN
    RAISE WARNING 'Found % budgets with orphaned category_id. Fixing...', orphaned_budgets;
    
    -- Fix orphaned budgets by setting to expense_other (budgets are typically for expenses)
    UPDATE budgets
    SET category_id = 12  -- expense_other
    WHERE category_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM categories WHERE category_id = budgets.category_id);
    
    RAISE NOTICE '✓ Fixed % orphaned budgets', orphaned_budgets;
  ELSE
    RAISE NOTICE '✓ No orphaned budgets found';
  END IF;
END $$;

-- ============================================
-- STEP 4: Add Foreign Key Constraints
-- ============================================

-- Drop existing FK constraints if they exist
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transaction_category;
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS fk_budget_category;

-- Add FK constraint for transactions
ALTER TABLE transactions
ADD CONSTRAINT fk_transaction_category 
FOREIGN KEY (category_id) 
REFERENCES categories(category_id) 
ON DELETE RESTRICT;

-- Add FK constraint for budgets
ALTER TABLE budgets
ADD CONSTRAINT fk_budget_category 
FOREIGN KEY (category_id) 
REFERENCES categories(category_id) 
ON DELETE RESTRICT;

RAISE NOTICE '✓ Foreign key constraints added successfully';

-- ============================================
-- STEP 5: Create Performance Indexes
-- ============================================

-- Index on categories type for filtering
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Index on categories user_id and type for user-specific queries
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);

-- Index on transactions category_id for FK performance
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- Index on budgets category_id for FK performance
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

RAISE NOTICE '✓ Performance indexes created successfully';

-- ============================================
-- STEP 6: Add Documentation Comments
-- ============================================

COMMENT ON TABLE categories IS 'Category master table - single source of truth for all categories (default + user custom)';
COMMENT ON COLUMN categories.category_id IS 'Primary key - integer ID used throughout the application';
COMMENT ON COLUMN categories.category_key IS 'Unique string key for reference (not used in application logic)';
COMMENT ON COLUMN categories.en_name IS 'English category name - REQUIRED for all categories';
COMMENT ON COLUMN categories.id_name IS 'Indonesian category name - REQUIRED for all categories';
COMMENT ON COLUMN categories.type IS 'Category type: expense, income, or system';
COMMENT ON COLUMN categories.icon IS 'Lucide icon name for display';
COMMENT ON COLUMN categories.color IS 'Hex color code for visual identification';
COMMENT ON COLUMN categories.user_id IS 'NULL for default categories, user_id for custom user categories';

COMMENT ON CONSTRAINT fk_transaction_category ON transactions IS 'Enforces referential integrity - prevents orphaned category IDs';
COMMENT ON CONSTRAINT fk_budget_category ON budgets IS 'Enforces referential integrity - prevents orphaned category IDs';

-- ============================================
-- STEP 7: Final Verification
-- ============================================

DO $$
DECLARE
  default_count INTEGER;
  fk_transactions_exists BOOLEAN;
  fk_budgets_exists BOOLEAN;
BEGIN
  -- Verify default categories count
  SELECT COUNT(*) INTO default_count FROM categories WHERE user_id IS NULL;
  
  IF default_count < 21 THEN
    RAISE WARNING 'Warning: Expected 21 default categories, found %', default_count;
  END IF;
  
  -- Verify FK constraints exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_transaction_category'
      AND table_name = 'transactions'
  ) INTO fk_transactions_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_budget_category'
      AND table_name = 'budgets'
  ) INTO fk_budgets_exists;
  
  IF NOT fk_transactions_exists THEN
    RAISE EXCEPTION 'FK constraint fk_transaction_category not found!';
  END IF;
  
  IF NOT fk_budgets_exists THEN
    RAISE EXCEPTION 'FK constraint fk_budget_category not found!';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration completed successfully!';
  RAISE NOTICE '✓ % default categories with translations', default_count;
  RAISE NOTICE '✓ Foreign key constraints enforced';
  RAISE NOTICE '✓ Performance indexes created';
  RAISE NOTICE '========================================';
END $$;
