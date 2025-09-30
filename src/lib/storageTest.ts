import { supabase } from './supabase';

export const testStorageAccess = async () => {
  console.log('🔍 Testing Supabase Storage Access...');
  
  try {
    // Test 1: List buckets
    console.log('1. Testing bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Bucket listing failed:', bucketsError);
      return { success: false, error: 'Cannot list buckets: ' + bucketsError.message };
    }
    
    console.log('✅ Buckets accessible:', buckets?.map(b => b.name));
    
    // Test 2: Check if our buckets exist
    const originalBucket = buckets?.find(b => b.name === 'original-files');
    const watermarkedBucket = buckets?.find(b => b.name === 'watermarked-files');
    
    if (!originalBucket || !watermarkedBucket) {
      console.error('❌ Required buckets missing');
      return { 
        success: false, 
        error: `Missing buckets. Found: ${buckets?.map(b => b.name).join(', ')}` 
      };
    }
    
    // Test 3: Try to upload a small test file
    console.log('2. Testing file upload...');
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const testPath = `test/${Date.now()}_test.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('original-files')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      return { 
        success: false, 
        error: 'Upload failed: ' + uploadError.message,
        details: uploadError
      };
    }
    
    console.log('✅ Upload successful:', uploadData.path);
    
    // Test 4: Try to delete the test file
    console.log('3. Testing file deletion...');
    const { error: deleteError } = await supabase.storage
      .from('original-files')
      .remove([testPath]);
    
    if (deleteError) {
      console.warn('⚠️ Delete test failed (file uploaded but not cleaned up):', deleteError);
    } else {
      console.log('✅ Delete successful');
    }
    
    return { 
      success: true, 
      message: 'All storage tests passed! Upload should work now.' 
    };
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return { 
      success: false, 
      error: 'Unexpected error: ' + (error as Error).message 
    };
  }
};

// Alternative upload method with better error handling
export const uploadFileWithRetry = async (
  bucket: string,
  path: string, 
  file: File,
  maxRetries: number = 3
): Promise<{ data?: any; error?: any }> => {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📤 Upload attempt ${attempt}/${maxRetries} for ${file.name}`);
    
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        });
      
      if (!error) {
        console.log(`✅ Upload successful on attempt ${attempt}`);
        return { data };
      }
      
      console.error(`❌ Upload attempt ${attempt} failed:`, error);
      
      // If it's an RLS error and we have retries left, wait and try again
      if (error.message?.includes('row-level security') && attempt < maxRetries) {
        console.log(`⏳ Waiting 1 second before retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      return { error };
      
    } catch (unexpectedError) {
      console.error(`💥 Unexpected error on attempt ${attempt}:`, unexpectedError);
      if (attempt === maxRetries) {
        return { error: unexpectedError };
      }
    }
  }
  
  return { error: new Error('Max retries exceeded') };
};