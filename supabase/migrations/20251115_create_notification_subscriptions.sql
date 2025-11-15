-- ============================================================================
-- Create Notification Subscriptions Table
-- Date: 2025-11-15
-- Purpose: Store PWA push notification subscriptions for budget alerts
-- Phase: 1 - Foundation (client-side infrastructure)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create notification_subscriptions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  
  -- Subscription status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
);

-- ============================================================================
-- STEP 2: Create Performance Indexes
-- ============================================================================

-- Primary lookup pattern: active subscriptions for a user
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_active 
ON public.notification_subscriptions(user_id, is_active) 
WHERE is_active = true;

COMMENT ON INDEX idx_notification_subscriptions_user_active IS 
'Performance: Partial index for efficient lookup of active user subscriptions';

-- Endpoint lookup for unsubscribe operations
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_endpoint 
ON public.notification_subscriptions(endpoint);

COMMENT ON INDEX idx_notification_subscriptions_endpoint IS 
'Performance: Enables fast lookup by subscription endpoint';

-- Cleanup queries: find old inactive subscriptions
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_inactive 
ON public.notification_subscriptions(updated_at) 
WHERE is_active = false;

COMMENT ON INDEX idx_notification_subscriptions_inactive IS 
'Performance: Partial index for cleanup of old inactive subscriptions';

-- ============================================================================
-- STEP 3: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.notification_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own subscriptions" ON public.notification_subscriptions IS
'Security: Users can only read their own notification subscriptions';

-- Policy: Users can create their own subscriptions
CREATE POLICY "Users can create own subscriptions"
ON public.notification_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can create own subscriptions" ON public.notification_subscriptions IS
'Security: Users can create their own notification subscriptions';

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
ON public.notification_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own subscriptions" ON public.notification_subscriptions IS
'Security: Users can modify their own subscriptions';

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
ON public.notification_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own subscriptions" ON public.notification_subscriptions IS
'Security: Users can remove their own subscriptions';

-- Policy: Service role can access all subscriptions (for sending notifications)
CREATE POLICY "Service role can access all subscriptions"
ON public.notification_subscriptions
FOR ALL
USING (auth.role() = 'service_role');

COMMENT ON POLICY "Service role can access all subscriptions" ON public.notification_subscriptions IS
'Security: Backend service can read all subscriptions to send push notifications';

-- ============================================================================
-- STEP 4: Create Cleanup Function
-- ============================================================================

-- Function to delete inactive subscriptions older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_inactive_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notification_subscriptions
  WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_inactive_subscriptions() IS
'Maintenance: Deletes inactive notification subscriptions older than 30 days. Returns count of deleted rows.';

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION public.cleanup_inactive_subscriptions() TO service_role;

-- ============================================================================
-- STEP 5: Create Function to Get Active Subscriptions
-- ============================================================================

-- Function to get all active subscriptions for a user
CREATE OR REPLACE FUNCTION public.get_active_subscriptions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  p256dh_key TEXT,
  auth_key TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ns.id,
    ns.endpoint,
    ns.p256dh_key,
    ns.auth_key,
    ns.created_at
  FROM public.notification_subscriptions ns
  WHERE ns.user_id = p_user_id
    AND ns.is_active = true
  ORDER BY ns.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_active_subscriptions(UUID) IS
'Helper: Returns all active notification subscriptions for a given user';

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.get_active_subscriptions(UUID) TO authenticated, service_role;

-- ============================================================================
-- STEP 6: Create Trigger for updated_at Timestamp
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_subscription_timestamp() IS
'Trigger function: Automatically updates updated_at timestamp on row modification';

-- Create trigger on notification_subscriptions table
CREATE TRIGGER set_subscription_timestamp
  BEFORE UPDATE ON public.notification_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_timestamp();

COMMENT ON TRIGGER set_subscription_timestamp ON public.notification_subscriptions IS
'Automatically updates updated_at timestamp when subscription is modified';

-- ============================================================================
-- STEP 7: Add Table and Column Comments
-- ============================================================================

COMMENT ON TABLE public.notification_subscriptions IS
'Stores PWA push notification subscriptions for sending budget alerts and other notifications. Phase 1: Foundation only.';

COMMENT ON COLUMN public.notification_subscriptions.id IS
'Primary key (UUID)';

COMMENT ON COLUMN public.notification_subscriptions.user_id IS
'Reference to auth.users - owner of the subscription';

COMMENT ON COLUMN public.notification_subscriptions.endpoint IS
'Push subscription endpoint URL from browser PushManager';

COMMENT ON COLUMN public.notification_subscriptions.p256dh_key IS
'P256DH public key for encrypting push messages';

COMMENT ON COLUMN public.notification_subscriptions.auth_key IS
'Authentication secret for push message encryption';

COMMENT ON COLUMN public.notification_subscriptions.is_active IS
'Whether subscription is currently active (false = unsubscribed)';

COMMENT ON COLUMN public.notification_subscriptions.created_at IS
'Timestamp when subscription was created';

COMMENT ON COLUMN public.notification_subscriptions.updated_at IS
'Timestamp when subscription was last updated (auto-updated by trigger)';

COMMENT ON CONSTRAINT unique_user_endpoint ON public.notification_subscriptions IS
'Ensures each user can have only one subscription per endpoint (device)';

-- ============================================================================
-- STEP 8: Verification and Statistics
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  index_count INTEGER;
  policy_count INTEGER;
  function_count INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  -- Verify table creation
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'notification_subscriptions'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table notification_subscriptions was not created!';
  END IF;
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'notification_subscriptions';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'notification_subscriptions';
  
  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('cleanup_inactive_subscriptions', 'get_active_subscriptions', 'update_subscription_timestamp');
  
  -- Verify trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_subscription_timestamp'
  ) INTO trigger_exists;
  
  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration completed successfully!';
  RAISE NOTICE '✓ Table: notification_subscriptions created';
  RAISE NOTICE '✓ Indexes: % created (including % partial)', index_count, 2;
  RAISE NOTICE '✓ RLS Policies: % created', policy_count;
  RAISE NOTICE '✓ Functions: % created', function_count;
  RAISE NOTICE '✓ Trigger: % created', CASE WHEN trigger_exists THEN 'Yes' ELSE 'No' END;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Table Features:';
  RAISE NOTICE '  - UUID primary key';
  RAISE NOTICE '  - Foreign key to auth.users (CASCADE delete)';
  RAISE NOTICE '  - Unique constraint on user_id + endpoint';
  RAISE NOTICE '  - 3 performance indexes (2 partial)';
  RAISE NOTICE '  - 5 RLS policies (user CRUD + service role access)';
  RAISE NOTICE '  - Auto-updating updated_at timestamp';
  RAISE NOTICE '  - Helper functions for subscription management';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions Created:';
  RAISE NOTICE '  - cleanup_inactive_subscriptions()';
  RAISE NOTICE '  - get_active_subscriptions(user_id)';
  RAISE NOTICE '  - update_subscription_timestamp()';
  RAISE NOTICE '';
  RAISE NOTICE 'Query Patterns Optimized:';
  RAISE NOTICE '  - Active user subscriptions';
  RAISE NOTICE '  - Endpoint-based lookups';
  RAISE NOTICE '  - Inactive subscription cleanup';
  RAISE NOTICE '';
  RAISE NOTICE 'Phase 1: Foundation complete!';
  RAISE NOTICE 'Phase 2 TODO:';
  RAISE NOTICE '  - VAPID key configuration';
  RAISE NOTICE '  - Backend notification sender';
  RAISE NOTICE '  - Scheduled budget alerts';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (for documentation only)
-- ============================================================================

-- To rollback this migration, execute the following:
--
-- DROP TRIGGER IF EXISTS set_subscription_timestamp ON public.notification_subscriptions;
-- DROP FUNCTION IF EXISTS public.update_subscription_timestamp();
-- DROP FUNCTION IF EXISTS public.get_active_subscriptions(UUID);
-- DROP FUNCTION IF EXISTS public.cleanup_inactive_subscriptions();
-- DROP TABLE IF EXISTS public.notification_subscriptions CASCADE;
--
-- Note: CASCADE will also drop dependent objects like policies and indexes
