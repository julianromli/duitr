-- Script to create the avatars bucket if it doesn't exist
-- and set the correct permissions

-- 1. Check if the bucket exists, create it if it doesn't
DO $$
BEGIN
    -- Check if the bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'avatars'
    ) THEN
        -- Create the bucket with public access
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatars', 
            'avatars', 
            TRUE, 
            5242880, -- 5MB limit
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
        );
        
        RAISE NOTICE 'Created avatars bucket with public access';
    ELSE
        -- Update the bucket to ensure it has the right settings
        UPDATE storage.buckets
        SET 
            public = TRUE,
            file_size_limit = 5242880, -- 5MB limit
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
        WHERE name = 'avatars';
        
        RAISE NOTICE 'Updated avatars bucket settings';
    END IF;
END
$$; 