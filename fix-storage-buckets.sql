-- Fix for listBuckets() returning empty array
-- This policy allows the anon and authenticated roles to SELECT from storage.buckets table
-- Required for supabase.storage.listBuckets() to work

CREATE POLICY "Allow bucket listing for all users" ON storage.buckets
    FOR SELECT TO anon, authenticated
    USING (true);

-- Optional: If you want to allow bucket creation/deletion via API (not usually needed)
-- CREATE POLICY "Allow bucket management" ON storage.buckets
--     FOR ALL TO authenticated
--     USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'buckets' AND schemaname = 'storage';