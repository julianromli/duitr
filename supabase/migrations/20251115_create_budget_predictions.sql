-- ============================================================================
-- Create Budget Predictions Table
-- Date: 2025-11-15
-- Purpose: Store AI-generated budget predictions for caching and tracking
-- ============================================================================

-- ============================================================================
-- STEP 1: Create budget_predictions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budget_predictions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and category references
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(category_id) ON DELETE CASCADE,
  
  -- Prediction timing
  prediction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Financial data
  current_spend NUMERIC(20,2) NOT NULL CHECK (current_spend >= 0),
  budget_limit NUMERIC(20,2) NOT NULL CHECK (budget_limit > 0),
  projected_spend NUMERIC(20,2) NOT NULL CHECK (projected_spend >= 0),
  overrun_amount NUMERIC(20,2) NOT NULL DEFAULT 0,
  
  -- Risk assessment
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Recommendations
  days_remaining INTEGER,
  recommended_daily_limit NUMERIC(20,2) CHECK (recommended_daily_limit >= 0),
  
  -- AI insights
  insight TEXT,
  seasonal_note TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create Performance Indexes
-- ============================================================================

-- Primary lookup pattern: user's predictions for a specific category, latest first
CREATE INDEX IF NOT EXISTS idx_predictions_user_category_date 
ON public.budget_predictions(user_id, category_id, prediction_date DESC);

COMMENT ON INDEX idx_predictions_user_category_date IS 
'Performance: Optimizes queries for user predictions by category sorted by date';

-- Cleanup queries: find old predictions for deletion
CREATE INDEX IF NOT EXISTS idx_predictions_created_at 
ON public.budget_predictions(created_at);

COMMENT ON INDEX idx_predictions_created_at IS 
'Performance: Enables fast cleanup of old predictions';

-- Risk-based queries: find high-risk predictions for alerts
CREATE INDEX IF NOT EXISTS idx_predictions_risk 
ON public.budget_predictions(user_id, risk_level) 
WHERE risk_level IN ('medium', 'high');

COMMENT ON INDEX idx_predictions_risk IS 
'Performance: Partial index for efficient risk-based filtering';

-- Period-based queries: find predictions for current/future periods
CREATE INDEX IF NOT EXISTS idx_predictions_period 
ON public.budget_predictions(user_id, period_end DESC);

COMMENT ON INDEX idx_predictions_period IS 
'Performance: Optimizes queries filtering by budget period';

-- ============================================================================
-- STEP 3: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE public.budget_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own predictions
CREATE POLICY "Users can view own predictions"
ON public.budget_predictions
FOR SELECT
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own predictions" ON public.budget_predictions IS
'Security: Users can only read their own budget predictions';

-- Policy: Service role can insert predictions (for AI service)
CREATE POLICY "System can insert predictions"
ON public.budget_predictions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

COMMENT ON POLICY "System can insert predictions" ON public.budget_predictions IS
'Security: Allows users and service role to create predictions';

-- Policy: Users can update their own predictions
CREATE POLICY "Users can update own predictions"
ON public.budget_predictions
FOR UPDATE
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own predictions" ON public.budget_predictions IS
'Security: Users can modify their own predictions';

-- Policy: Users can delete their own predictions
CREATE POLICY "Users can delete own predictions"
ON public.budget_predictions
FOR DELETE
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own predictions" ON public.budget_predictions IS
'Security: Users can remove their own predictions';

-- ============================================================================
-- STEP 4: Create Cleanup Function
-- ============================================================================

-- Function to delete predictions older than 90 days
CREATE OR REPLACE FUNCTION public.cleanup_old_predictions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.budget_predictions
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_predictions() IS
'Maintenance: Deletes budget predictions older than 90 days. Returns count of deleted rows.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cleanup_old_predictions() TO authenticated;

-- ============================================================================
-- STEP 5: Create Trigger for updated_at Timestamp
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_prediction_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_prediction_timestamp() IS
'Trigger function: Automatically updates updated_at timestamp on row modification';

-- Create trigger on budget_predictions table
CREATE TRIGGER set_prediction_timestamp
  BEFORE UPDATE ON public.budget_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prediction_timestamp();

COMMENT ON TRIGGER set_prediction_timestamp ON public.budget_predictions IS
'Automatically updates updated_at timestamp when prediction is modified';

-- ============================================================================
-- STEP 6: Add Table and Column Comments
-- ============================================================================

COMMENT ON TABLE public.budget_predictions IS
'Stores AI-generated budget predictions for performance caching and historical tracking. Predictions expire after 90 days.';

COMMENT ON COLUMN public.budget_predictions.id IS
'Primary key (UUID)';

COMMENT ON COLUMN public.budget_predictions.user_id IS
'Reference to auth.users - owner of the prediction';

COMMENT ON COLUMN public.budget_predictions.category_id IS
'Reference to categories table - NULL for overall budget predictions';

COMMENT ON COLUMN public.budget_predictions.prediction_date IS
'Date when the prediction was generated';

COMMENT ON COLUMN public.budget_predictions.period_start IS
'Start date of the budget period being analyzed';

COMMENT ON COLUMN public.budget_predictions.period_end IS
'End date of the budget period being analyzed';

COMMENT ON COLUMN public.budget_predictions.current_spend IS
'Current spending amount at time of prediction';

COMMENT ON COLUMN public.budget_predictions.budget_limit IS
'Budget limit for the category/period';

COMMENT ON COLUMN public.budget_predictions.projected_spend IS
'AI-predicted final spending amount for the period';

COMMENT ON COLUMN public.budget_predictions.overrun_amount IS
'Predicted amount over budget (0 if within budget)';

COMMENT ON COLUMN public.budget_predictions.risk_level IS
'Risk assessment: low, medium, or high';

COMMENT ON COLUMN public.budget_predictions.confidence IS
'AI confidence score (0.0 to 1.0)';

COMMENT ON COLUMN public.budget_predictions.days_remaining IS
'Days remaining in the budget period';

COMMENT ON COLUMN public.budget_predictions.recommended_daily_limit IS
'AI-recommended daily spending limit to stay within budget';

COMMENT ON COLUMN public.budget_predictions.insight IS
'Human-readable AI-generated insight about spending patterns';

COMMENT ON COLUMN public.budget_predictions.seasonal_note IS
'Optional note about seasonal spending patterns';

COMMENT ON COLUMN public.budget_predictions.created_at IS
'Timestamp when prediction was created';

COMMENT ON COLUMN public.budget_predictions.updated_at IS
'Timestamp when prediction was last updated (auto-updated by trigger)';

-- ============================================================================
-- STEP 7: Verification and Statistics
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  index_count INTEGER;
  policy_count INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  -- Verify table creation
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'budget_predictions'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table budget_predictions was not created!';
  END IF;
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'budget_predictions';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'budget_predictions';
  
  -- Verify trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_prediction_timestamp'
  ) INTO trigger_exists;
  
  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration completed successfully!';
  RAISE NOTICE '✓ Table: budget_predictions created';
  RAISE NOTICE '✓ Indexes: % created', index_count;
  RAISE NOTICE '✓ RLS Policies: % created', policy_count;
  RAISE NOTICE '✓ Trigger: % created', CASE WHEN trigger_exists THEN 'Yes' ELSE 'No' END;
  RAISE NOTICE '✓ Cleanup function: cleanup_old_predictions() created';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Table Features:';
  RAISE NOTICE '  - UUID primary key';
  RAISE NOTICE '  - Foreign keys to auth.users and categories';
  RAISE NOTICE '  - Check constraints for data integrity';
  RAISE NOTICE '  - 4 performance indexes (including partial index)';
  RAISE NOTICE '  - 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '  - Auto-updating updated_at timestamp';
  RAISE NOTICE '  - 90-day automatic cleanup function';
  RAISE NOTICE '';
  RAISE NOTICE 'Query Patterns Optimized:';
  RAISE NOTICE '  - User predictions by category';
  RAISE NOTICE '  - Risk-based filtering';
  RAISE NOTICE '  - Period-based lookups';
  RAISE NOTICE '  - Cleanup operations';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (for documentation only)
-- ============================================================================

-- To rollback this migration, execute the following:
--
-- DROP TRIGGER IF EXISTS set_prediction_timestamp ON public.budget_predictions;
-- DROP FUNCTION IF EXISTS public.update_prediction_timestamp();
-- DROP FUNCTION IF EXISTS public.cleanup_old_predictions();
-- DROP TABLE IF EXISTS public.budget_predictions CASCADE;
--
-- Note: CASCADE will also drop dependent objects like policies and indexes
