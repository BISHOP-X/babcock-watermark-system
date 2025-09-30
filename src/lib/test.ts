import { supabase } from './supabase'

export const testSupabaseConnection = async () => {
  try {
    console.log('🔄 Starting Supabase connection tests...')

    // Test 1: Batches table access
    console.log('1️⃣ Testing batches table...')
    const { data: batchData, error: batchError } = await supabase
      .from('batches')
      .select('id')
      .limit(1)

    if (batchError) {
      console.error('❌ Batches table test FAILED:', batchError)
      return { 
        success: false, 
        error: `Batches table connection failed: ${batchError.message}`,
        details: batchError
      }
    }
    console.log('✅ Batches table test PASSED')

    // Test 2: Files table access
    console.log('2️⃣ Testing files table...')
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('id')
      .limit(1)

    if (filesError) {
      console.error('❌ Files table test FAILED:', filesError)
      return { 
        success: false, 
        error: `Files table connection failed: ${filesError.message}`,
        details: filesError
      }
    }
    console.log('✅ Files table test PASSED')

    // Test 3: Storage access
    console.log('3️⃣ Testing storage access...')
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    
    if (storageError) {
      console.error('❌ Storage test FAILED:', storageError)
      return { 
        success: false, 
        error: `Storage connection failed: ${storageError.message}`,
        details: storageError
      }
    }
    console.log('✅ Storage test PASSED')

    // Show ALL available buckets for debugging
    console.log('📂 FOUND BUCKETS:', buckets)
    console.log('📂 Bucket names only:', buckets.map(b => b.name))
    console.log('� Total buckets found:', buckets.length)
    console.log('�🔍 Looking for buckets: "original-files" and "watermarked-files"')
    
    // Debug each bucket
    buckets.forEach((bucket, index) => {
      console.log(`🗂️ Bucket ${index + 1}:`, {
        name: bucket.name,
        id: bucket.id,
        public: bucket.public,
        created_at: bucket.created_at
      })
    })

    // Test 4: Required buckets exist
    console.log('4️⃣ Checking required buckets...')
    const hasOriginalBucket = buckets.some(b => b.name === 'original-files')
    const hasWatermarkedBucket = buckets.some(b => b.name === 'watermarked-files')
    const hasRequiredBuckets = hasOriginalBucket && hasWatermarkedBucket

    if (!hasRequiredBuckets) {
      console.error('❌ Required buckets test FAILED')
      console.error('Missing buckets:', {
        'original-files': hasOriginalBucket ? '✅' : '❌',
        'watermarked-files': hasWatermarkedBucket ? '✅' : '❌'
      })
      return {
        success: false,
        error: 'Required storage buckets are missing',
        details: {
          availableBuckets: buckets.map(b => b.name),
          missingBuckets: [
            ...(hasOriginalBucket ? [] : ['original-files']),
            ...(hasWatermarkedBucket ? [] : ['watermarked-files'])
          ]
        }
      }
    }
    console.log('✅ Required buckets test PASSED')

    // All tests passed!
    console.log('🎉 ALL TESTS PASSED - Supabase is fully connected!')
    console.log('📊 Batches table: ACCESSIBLE')
    console.log('📄 Files table: ACCESSIBLE') 
    console.log('💾 Storage: ACCESSIBLE')
    console.log('📁 Required buckets: FOUND')
    console.log('🗂️ Available buckets:', buckets.map(b => b.name).join(', '))

    return { 
      success: true,
      message: 'All Supabase connections and requirements verified!',
      tests: {
        batchesTable: true,
        filesTable: true,
        storage: true,
        requiredBuckets: true
      },
      details: {
        availableBuckets: buckets.map(b => b.name),
        bucketsCount: buckets.length
      }
    }
  } catch (error) {
    console.error('💥 Connection test CRASHED:', error)
    return { 
      success: false, 
      error: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}