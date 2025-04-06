-- SCRIPT PERBAIKAN UPLOAD FOTO PROFIL UNTUK URFINANCE
-- Jalankan script ini di SQL Editor Supabase untuk memperbaiki masalah upload foto profil

-- 1. CREATE BUCKET IF NOT EXISTS
-- Membuat atau memperbarui bucket avatars dengan akses publik
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
            10485760, -- 10MB limit
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
        );
        
        RAISE NOTICE 'Created avatars bucket with public access';
    ELSE
        -- Update the bucket to ensure it has the right settings
        UPDATE storage.buckets
        SET 
            public = TRUE,
            file_size_limit = 10485760, -- 10MB limit
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
        WHERE name = 'avatars';
        
        RAISE NOTICE 'Updated avatars bucket settings';
    END IF;
END
$$;

-- 2. DELETE EXISTING POLICIES IF ANY
-- Hapus kebijakan yang mungkin ada untuk mencegah konflik
DO $$
BEGIN
    -- Drop existing policies on the avatars bucket if they exist
    DROP POLICY IF EXISTS "Public Access for Avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users Can Upload Their Own Avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users Can Update Their Own Avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users Can Delete Their Own Avatar" ON storage.objects;
    
    RAISE NOTICE 'Removed any existing policies for avatars bucket';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error removing existing policies: %', SQLERRM;
END
$$;

-- 3. CREATE NEW POLICIES
-- Policy for PUBLIC READ access - allow anyone to view profile pictures
CREATE POLICY "Public Access for Avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
);

-- Policy for AUTHENTICATED INSERT - users can only upload their own profile picture
CREATE POLICY "Users Can Upload Their Own Avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = name
);

-- Policy for AUTHENTICATED UPDATE - users can only update their own profile picture
CREATE POLICY "Users Can Update Their Own Avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = name
);

-- Policy for AUTHENTICATED DELETE - users can only delete their own profile picture
CREATE POLICY "Users Can Delete Their Own Avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = name
);

-- 4. VERIFY SETUP
-- Cek apakah bucket telah dibuat dengan benar
SELECT 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types
FROM 
    storage.buckets 
WHERE 
    name = 'avatars';

-- Cek apakah policies telah dibuat dengan benar
SELECT 
    policyname, 
    operation, 
    permissive, 
    roles, 
    definition 
FROM 
    pg_policies 
WHERE 
    tablename = 'objects' AND
    schemaname = 'storage' AND
    policyname LIKE '%Avatar%';

-- SELESAI: Script ini akan membuat bucket 'avatars' dan mengatur kebijakan akses yang diperlukan
-- Setelah menjalankan script ini, restart aplikasi dan coba upload foto profil kembali 