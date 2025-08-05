-- Migration: Add user currency preferences
-- Description: Add currency preference support to user metadata
-- Date: 2024-01-15

-- Update existing users with default currency preference
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"preferred_currency": "IDR"}'::jsonb
WHERE raw_user_meta_data->>'preferred_currency' IS NULL;

-- Create function to get user currency preference
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_currency(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_currency(UUID) TO anon;