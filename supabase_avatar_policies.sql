-- Create policies for the 'avatars' storage bucket

-- 1. Policy for PUBLIC READ access - allow anyone to view profile pictures
-- This policy allows anonymous users to read any file in the avatars bucket
CREATE POLICY "Public Access for Avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
);

-- 2. Policy for AUTHENTICATED INSERT - users can only upload their own profile picture
-- This policy ensures users can only upload files named after their user ID
CREATE POLICY "Users Can Upload Their Own Avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = name
);

-- 3. Policy for AUTHENTICATED UPDATE - users can only update their own profile picture
-- This policy ensures users can only update files named after their user ID
CREATE POLICY "Users Can Update Their Own Avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = name
);

-- 4. Policy for AUTHENTICATED DELETE - users can only delete their own profile picture
-- This policy ensures users can only delete files named after their user ID
CREATE POLICY "Users Can Delete Their Own Avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = name
);

-- Note: In our implementation, the avatar filename is directly the user's UUID
-- without any folder structure, so we compare directly with the name 