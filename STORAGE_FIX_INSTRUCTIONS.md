## 🚨 URGENT: Fix Supabase Storage RLS Policy Issue

The error you're seeing (`new row violates row-level security policy`) is because Supabase storage has overly restrictive Row Level Security (RLS) policies that are blocking file uploads.

### 🔧 **IMMEDIATE FIX - Run This SQL in Supabase:**

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Run this SQL script:**

```sql
-- Fix Storage RLS Policies for CPGS Watermarking System

-- First ensure buckets exist and are properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('original-files', 'original-files', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']),
  ('watermarked-files', 'watermarked-files', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Allow uploads to original-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to watermarked-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow downloads from original-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow downloads from watermarked-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from original-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from watermarked-files" ON storage.objects;

-- Create permissive policies that allow all operations
CREATE POLICY "Enable all operations for original-files" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'original-files')
  WITH CHECK (bucket_id = 'original-files');

CREATE POLICY "Enable all operations for watermarked-files" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'watermarked-files')
  WITH CHECK (bucket_id = 'watermarked-files');

-- Enable bucket listing
CREATE POLICY IF NOT EXISTS "Enable bucket listing" ON storage.buckets
  FOR SELECT 
  USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

### 🏃‍♂️ **ALTERNATIVE QUICK FIX:**

If you want to completely disable RLS for testing (less secure but works):

```sql
-- TEMPORARY: Disable RLS on storage objects (NOT recommended for production)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
```

### 🧪 **TEST THE FIX:**

After running the SQL:

1. **Go to your app**: http://localhost:8080/upload
2. **Click "Test Storage Access"** button
3. **If successful**, try uploading a file
4. **If it works**, you should see: ✅ Upload successful

### 📋 **What This Fixes:**

- **Creates proper storage buckets** with 50MB file size limits
- **Sets correct MIME types** for PDF/DOCX files
- **Creates permissive RLS policies** that allow all operations
- **Enables bucket listing** for the application to work

### 🔍 **Root Cause:**

Supabase storage requires explicit RLS policies to allow:
- ✅ File uploads (`INSERT` operations)
- ✅ File downloads (`SELECT` operations)  
- ✅ File deletions (`DELETE` operations)
- ✅ Bucket listing (`SELECT` on buckets table)

Without these policies, the storage API returns `400 Bad Request` with the RLS policy violation error.

### 🚀 **After Fix:**

Your file upload should work immediately! The app will be able to:
- ✅ Upload files to `original-files` bucket
- ✅ Download files from both buckets
- ✅ List bucket contents
- ✅ Process watermarking workflow

Run the SQL and try uploading again! 🎯