import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

// STAGE 5: Advanced Professional Watermarking System
export interface WatermarkPosition {
  type: 'center' | 'corner' | 'custom' | 'multiple'
  coordinates?: { x: number; y: number }[]
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  offset?: { x: number; y: number }
}

export interface WatermarkStyle {
  fontFamily: 'times' | 'helvetica' | 'courier'
  rotation: number // Any angle in degrees
  effects?: {
    shadow?: { offsetX: number; offsetY: number; blur: number; color: string }
    gradient?: { from: string; to: string; direction: 'horizontal' | 'vertical' }
    outline?: { width: number; color: string }
  }
}

export interface WatermarkTransparency {
  type: 'uniform' | 'gradient' | 'fade'
  value: number | { start: number; end: number }
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'screen'
}

export interface PageSpecificWatermark {
  pageRange: 'all' | 'first' | 'last' | 'odd' | 'even' | number[]
  conditional?: {
    hasImages?: boolean
    hasTables?: boolean
    contentLength?: 'short' | 'medium' | 'long'
  }
  customText?: string
}

export interface WatermarkSettings {
  // Basic settings (Stage 1-4 compatibility)
  text: string
  opacity: number
  fontSize: 'small' | 'medium' | 'large'
  color: string
  
  // STAGE 5: Advanced Professional Features
  position?: WatermarkPosition
  style?: WatermarkStyle
  transparency?: WatermarkTransparency
  pageSpecific?: PageSpecificWatermark
  
  // Professional Templates
  template?: 'corporate' | 'confidential' | 'draft' | 'custom'
  layering?: {
    zIndex: number
    multiple: boolean
  }
}

export interface BatchData {
  id: string
  status: string
  totalFiles: number
  processedFiles: number
  failedFiles: number
  watermarkSettings: WatermarkSettings
  batchName?: string
  createdAt: string
  completedAt?: string
}

export interface FileData {
  id: string
  batchId: string
  originalName: string
  fileSize: number
  mimeType: string
  status: string
  progress: number
  errorMessage?: string
  originalFilePath?: string
  watermarkedFilePath?: string
  createdAt: string
  processedAt?: string
}

class ApiService {
  // Create a new batch
  async createBatch(files: File[], watermarkSettings: WatermarkSettings): Promise<string> {
    const batchName = `Batch_${new Date().toISOString().split('T')[0]}_${Date.now()}`
    
    const { data, error } = await supabase
      .from('batches')
      .insert({
        total_files: files.length,
        watermark_settings: watermarkSettings,
        batch_name: batchName,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  // Add files to batch
  async addFilesToBatch(batchId: string, files: File[]): Promise<FileData[]> {
    const fileInserts = files.map(file => ({
      batch_id: batchId,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: 'queued' as const
    }))

    const { data, error } = await supabase
      .from('files')
      .insert(fileInserts)
      .select()

    if (error) throw error
    return data.map(this.transformFileData)
  }

  // Upload file to storage
  async uploadFile(file: File, path: string): Promise<string> {
    console.log(`📤 Uploading ${file.name} to ${path}`);
    
    // Add retry logic for RLS issues
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await supabase.storage
          .from('original-files')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: true // Allow overwriting
          });

        if (error) {
          console.error(`❌ Upload attempt ${attempt} failed:`, error);
          
          // If RLS error and we have retries left, wait and retry
          if (error.message?.includes('row-level security') && attempt < 3) {
            console.log(`⏳ Waiting before retry...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          throw error;
        }
        
        console.log(`✅ Upload successful on attempt ${attempt}:`, data.path);
        return data.path;
        
      } catch (retryError) {
        if (attempt === 3) {
          console.error(`💥 Final upload attempt failed:`, retryError);
          throw retryError;
        }
      }
    }
    
    throw new Error('Upload failed after all retries');
  }

  // Get batch details
  async getBatch(batchId: string): Promise<BatchData> {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (error) throw error
    return this.transformBatchData(data)
  }

  // Get files in batch
  async getBatchFiles(batchId: string): Promise<FileData[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data.map(this.transformFileData)
  }

  // Update file status
  async updateFileStatus(fileId: string, status: string, progress?: number, errorMessage?: string): Promise<void> {
    const updates: any = { status }
    if (progress !== undefined) updates.progress = progress
    if (errorMessage !== undefined) updates.error_message = errorMessage
    if (status === 'completed' || status === 'failed') {
      updates.processed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', fileId)

    if (error) throw error
  }

  // Update batch status
  async updateBatchStatus(batchId: string, status: string, processedFiles?: number, failedFiles?: number): Promise<void> {
    const updates: any = { status }
    if (processedFiles !== undefined) updates.processed_files = processedFiles
    if (failedFiles !== undefined) updates.failed_files = failedFiles
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('batches')
      .update(updates)
      .eq('id', batchId)

    if (error) throw error
  }

  // Update batch watermark settings
  async updateBatchWatermarkSettings(batchId: string, watermarkSettings: WatermarkSettings): Promise<void> {
    const { error } = await supabase
      .from('batches')
      .update({ watermark_settings: watermarkSettings })
      .eq('id', batchId)

    if (error) throw error
  }

  // Update file with storage path
  async updateFileStoragePath(fileId: string, storagePath: string): Promise<void> {
    const { error } = await supabase
      .from('files')
      .update({ original_file_path: storagePath })
      .eq('id', fileId)

    if (error) throw error
  }

  // Download file from storage
  async downloadFile(path: string, bucket: string = 'watermarked-files'): Promise<Blob> {
    console.log(`📥 Downloading file from ${bucket}/${path}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) {
      console.error(`❌ Download failed:`, error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No file data received');
    }
    
    console.log(`✅ Downloaded file: ${data.size} bytes, type: ${data.type}`);
    return data
  }

  // Helper methods
  private transformBatchData(data: any): BatchData {
    return {
      id: data.id,
      status: data.status,
      totalFiles: data.total_files,
      processedFiles: data.processed_files,
      failedFiles: data.failed_files,
      watermarkSettings: data.watermark_settings,
      batchName: data.batch_name,
      createdAt: data.created_at,
      completedAt: data.completed_at
    }
  }

  private transformFileData(data: any): FileData {
    return {
      id: data.id,
      batchId: data.batch_id,
      originalName: data.original_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      status: data.status,
      progress: data.progress,
      errorMessage: data.error_message,
      originalFilePath: data.original_file_path,
      watermarkedFilePath: data.watermarked_file_path,
      createdAt: data.created_at,
      processedAt: data.processed_at
    }
  }
}

export const apiService = new ApiService()