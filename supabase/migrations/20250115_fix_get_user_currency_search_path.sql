-- Fix get_user_currency function search_path security vulnerability
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Recreate the get_user_currency function with secure search_path
CREATE OR REPLACE FUNCTION get_user_currency(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT raw_user_meta_data->>'preferred_currency' 
         FROM auth.users 
         WHERE id = user_uuid),
        'IDR'
    );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = '';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_currency(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_currency(UUID) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_currency IS 'Function updated with secure search path to prevent search path vulnerabilities';
