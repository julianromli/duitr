-- Add missing indexes for foreign keys to improve query performance
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

-- ============================================================================
-- CATEGORY_ID_MAPPING TABLE
-- ============================================================================
-- Add index for category_id_mapping_new_id_fkey
CREATE INDEX IF NOT EXISTS idx_category_id_mapping_new_id 
ON public.category_id_mapping(new_id);

-- ============================================================================
-- PINJAMAN_ITEMS TABLE
-- ============================================================================
-- Add index for pinjaman_items_user_id_fkey
CREATE INDEX IF NOT EXISTS idx_pinjaman_items_user_id 
ON public.pinjaman_items(user_id);

-- ============================================================================
-- WANT_TO_BUY_ITEMS TABLE
-- ============================================================================
-- Add index for want_to_buy_items_user_id_fkey
CREATE INDEX IF NOT EXISTS idx_want_to_buy_items_user_id 
ON public.want_to_buy_items(user_id);

-- Add comments for documentation
COMMENT ON INDEX idx_category_id_mapping_new_id IS 'Index to support foreign key constraint category_id_mapping_new_id_fkey';
COMMENT ON INDEX idx_pinjaman_items_user_id IS 'Index to support foreign key constraint pinjaman_items_user_id_fkey';
COMMENT ON INDEX idx_want_to_buy_items_user_id IS 'Index to support foreign key constraint want_to_buy_items_user_id_fkey';
