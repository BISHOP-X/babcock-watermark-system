-- Fix Supabase Storage RLS Policies for CPGS Watermarking System
-- Run this in your Supabase SQL Editor

-- First, ensure storage buckets exist with proper settings
UPDATE storage.buckets 
SET public = false, 
    file_size_limit = 52428800, -- 50MB limit
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
WHERE id IN ('original-files', 'watermarked-files');

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow public uploads to original-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to watermarked-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads from original-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads from watermarked-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from original-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from watermarked-files" ON storage.objects;

-- Create permissive policies for file operations
-- Allow anyone to upload files to original-files bucket
CREATE POLICY "Enable upload for original-files" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'original-files');

-- Allow anyone to upload files to watermarked-files bucket  
CREATE POLICY "Enable upload for watermarked-files" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'watermarked-files');

-- Allow anyone to download files from original-files bucket
CREATE POLICY "Enable download for original-files" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'original-files');

-- Allow anyone to download files from watermarked-files bucket
CREATE POLICY "Enable download for watermarked-files" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'watermarked-files');

-- Allow anyone to delete files from original-files bucket (for cleanup)
CREATE POLICY "Enable delete for original-files" ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'original-files');

-- Allow anyone to delete files from watermarked-files bucket (for cleanup)
CREATE POLICY "Enable delete for watermarked-files" ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'watermarked-files');

-- Allow anyone to update files (for overwriting)
CREATE POLICY "Enable update for original-files" ON storage.objects
  FOR UPDATE 
  USING (bucket_id = 'original-files');

CREATE POLICY "Enable update for watermarked-files" ON storage.objects
  FOR UPDATE 
  USING (bucket_id = 'watermarked-files');

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Also ensure the buckets table is accessible
CREATE POLICY IF NOT EXISTS "Enable bucket listing" ON storage.buckets
  FOR SELECT 
  USING (true);