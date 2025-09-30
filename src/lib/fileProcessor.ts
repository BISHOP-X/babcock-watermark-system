import { pdfProcessor } from './pdfProcessor'
import { apiService, WatermarkSettings, FileData } from './api'
import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'
import { docxProcessor as enterpriseDocxProcessor } from './docxProcessor'

export class FileProcessorService {
  async processFile(file: FileData, watermarkSettings: WatermarkSettings): Promise<void> {
    try {
      // Update status to processing
      await apiService.updateFileStatus(file.id, 'processing', 0)

      // Validate file path
      if (!file.originalFilePath) {
        throw new Error(`No original file path found for file ${file.id}`)
      }

      // Download original file
      const originalBlob = await apiService.downloadFile(file.originalFilePath, 'original-files')
      const buffer = await originalBlob.arrayBuffer()

      // Update progress
      await apiService.updateFileStatus(file.id, 'processing', 25)

      // Process based on file type
      let processedBuffer: Uint8Array
      
      if (file.mimeType === 'application/pdf') {
        processedBuffer = await pdfProcessor.addWatermark(buffer, watermarkSettings)
      } else if (
        file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimeType === 'application/msword'
      ) {
        console.log('🔄 Processing DOCX file with enterprise processor:', file.originalName)
        
        // Use enterprise DocxProcessor with progress callback
        processedBuffer = await enterpriseDocxProcessor.addWatermark(
          buffer, 
          watermarkSettings,
          (progress) => {
            // Update file progress (25% base + 50% processing range)
            const adjustedProgress = Math.round(25 + (progress.progress * 0.5))
            apiService.updateFileStatus(file.id, 'processing', adjustedProgress)
              .catch(err => console.warn('Progress update failed:', err))
          }
        )
      } else {
        throw new Error(`Unsupported file type: ${file.mimeType}`)
      }

      // Update progress
      await apiService.updateFileStatus(file.id, 'processing', 75)

      // Upload processed file
      let processedFileName = `watermarked_${file.originalName}`
      
      // For DOCX files converted to PDF, change the extension
      if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimeType === 'application/msword') {
        // Replace .docx or .doc extension with .pdf
        processedFileName = `watermarked_${file.originalName.replace(/\.(docx?|doc)$/i, '.pdf')}`
      }
      
      const processedPath = `${file.batchId}/${uuidv4()}_${processedFileName}`
      
      // For DOCX files converted to PDF, change the content type
      let contentType = file.mimeType
      if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimeType === 'application/msword') {
        contentType = 'application/pdf'
      }
      
      const { data, error } = await supabase.storage
        .from('watermarked-files')
        .upload(processedPath, processedBuffer, {
          contentType: contentType,
          upsert: false
        })

      if (error) throw error

      // Update file record with processed file path
      await supabase
        .from('files')
        .update({
          watermarked_file_path: data.path,
          status: 'completed',
          progress: 100,
          processed_at: new Date().toISOString()
        })
        .eq('id', file.id)

    } catch (error) {
      console.error(`Error processing file ${file.id}:`, error)
      
      // Provide more specific error message
      let errorMessage = 'Unknown processing error'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      await apiService.updateFileStatus(
        file.id, 
        'failed', 
        0, 
        errorMessage
      )
      throw error
    }
  }

  async processBatch(batchId: string): Promise<void> {
    try {
      // Update batch status
      await apiService.updateBatchStatus(batchId, 'processing')

      // Get batch and files
      const batch = await apiService.getBatch(batchId)
      const files = await apiService.getBatchFiles(batchId)

      // Validate batch has watermark settings
      if (!batch.watermarkSettings) {
        throw new Error('Batch has no watermark settings configured')
      }

      // Filter files that have original file paths
      const validFiles = files.filter(file => file.originalFilePath)
      const invalidFiles = files.filter(file => !file.originalFilePath)

      // Mark files without paths as failed
      for (const file of invalidFiles) {
        await apiService.updateFileStatus(
          file.id,
          'failed',
          0,
          'No original file path found - file was not properly uploaded'
        )
      }

      let processedCount = 0
      let failedCount = invalidFiles.length

      // Process each valid file
      for (const file of validFiles) {
        try {
          await this.processFile(file, batch.watermarkSettings)
          processedCount++
        } catch (error) {
          failedCount++
          console.error(`Failed to process file ${file.id}:`, error)
        }

        // Update batch progress
        await apiService.updateBatchStatus(
          batchId,
          'processing',
          processedCount,
          failedCount
        )
      }

      // Update final batch status
      const finalStatus = failedCount === 0 ? 'completed' : 
                         processedCount === 0 ? 'failed' : 'completed'
      
      await apiService.updateBatchStatus(
        batchId,
        finalStatus,
        processedCount,
        failedCount
      )

    } catch (error) {
      console.error(`Error processing batch ${batchId}:`, error)
      await apiService.updateBatchStatus(batchId, 'failed')
      throw error
    }
  }
}

export const fileProcessor = new FileProcessorService()

// Note: DocxProcessor is now imported from './docxProcessor' as enterpriseDocxProcessor
// The enterprise implementation provides full Stage 6 performance optimization