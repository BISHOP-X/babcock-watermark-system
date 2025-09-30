import JSZip from 'jszip';
import { apiService, FileData } from './api';

export class ZipService {
  /**
   * Create a ZIP file containing all successfully processed files from a batch
   */
  async createBatchZip(files: FileData[], batchName?: string): Promise<Blob> {
    const zip = new JSZip();
    const zipFileName = batchName || `CPGS_Watermarked_Documents_${new Date().toISOString().split('T')[0]}`;
    
    try {
      // Filter only completed files with watermarked file paths
      const completedFiles = files.filter(f => 
        f.status === 'completed' && f.watermarkedFilePath
      );
      
      if (completedFiles.length === 0) {
        throw new Error('No completed files found to zip');
      }
      
      // Download and add each file to the ZIP
      const downloadPromises = completedFiles.map(async (file, index) => {
        try {
          console.log(`📦 Adding file ${index + 1}/${completedFiles.length}: ${file.originalName}`);
          
          // Download the watermarked file from storage
          const blob = await apiService.downloadFile(file.watermarkedFilePath!);
          
          // Generate safe filename for ZIP with proper extension
          let safeFileName = `Watermarked_${file.originalName}`;
          
          // For DOCX files that were converted to PDF, update the filename
          if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
              file.mimeType === 'application/msword') {
            safeFileName = safeFileName.replace(/\.(docx?|doc)$/i, '.pdf');
          }
          
          safeFileName = this.sanitizeFileName(safeFileName);
          
          // Add to ZIP with folder structure if needed
          zip.file(safeFileName, blob);
          
          console.log(`✅ Added ${safeFileName} to ZIP`);
          
        } catch (error) {
          console.error(`❌ Failed to add ${file.originalName} to ZIP:`, error);
          // Continue with other files even if one fails
        }
      });
      
      // Wait for all downloads to complete
      await Promise.all(downloadPromises);
      
      console.log(`🎁 Generating ZIP file with ${completedFiles.length} files...`);
      
      // Generate the ZIP blob
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6 // Good balance between compression and speed
        }
      });
      
      console.log(`✅ ZIP file generated successfully (${this.formatFileSize(zipBlob.size)})`);
      
      return zipBlob;
      
    } catch (error) {
      console.error('❌ Failed to create ZIP file:', error);
      throw new Error(`Failed to create ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Download a ZIP file to the user's device
   */
  downloadZip(zipBlob: Blob, fileName: string): void {
    try {
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      URL.revokeObjectURL(url);
      
      console.log(`✅ ZIP download initiated: ${link.download}`);
      
    } catch (error) {
      console.error('❌ Failed to download ZIP:', error);
      throw new Error('Failed to initiate ZIP download');
    }
  }
  
  /**
   * Download individual file from storage
   */
  async downloadIndividualFile(file: FileData): Promise<void> {
    if (!file.watermarkedFilePath) {
      throw new Error('No watermarked file available for download');
    }
    
    try {
      console.log(`📥 Downloading ${file.originalName}...`);
      
      const blob = await apiService.downloadFile(file.watermarkedFilePath);
      
      // Determine the correct filename and content type
      let downloadFileName = `Watermarked_${file.originalName}`;
      let contentType = file.mimeType;
      
      // For DOCX files that were converted to PDF, update the filename and content type
      if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimeType === 'application/msword') {
        downloadFileName = downloadFileName.replace(/\.(docx?|doc)$/i, '.pdf');
        contentType = 'application/pdf';
      }
      
      // Create a new blob with the correct content type
      const typedBlob = new Blob([blob], { type: contentType });
      
      const url = URL.createObjectURL(typedBlob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = downloadFileName;
      link.style.display = 'none';
      
      // Force download by setting content-disposition
      link.setAttribute('download', downloadFileName);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`✅ Downloaded ${downloadFileName}`);
      
    } catch (error) {
      console.error(`❌ Failed to download ${file.originalName}:`, error);
      throw new Error(`Failed to download ${file.originalName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Create a public download URL for a file (for preview purposes)
   */
  async getFilePreviewUrl(file: FileData): Promise<string> {
    if (!file.watermarkedFilePath) {
      throw new Error('No watermarked file available for preview');
    }
    
    try {
      const blob = await apiService.downloadFile(file.watermarkedFilePath);
      
      // Determine the correct content type for preview
      let contentType = file.mimeType;
      
      // For DOCX files that were converted to PDF, update the content type
      if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimeType === 'application/msword') {
        contentType = 'application/pdf';
      }
      
      // Create a typed blob for proper preview handling
      const typedBlob = new Blob([blob], { type: contentType });
      
      return URL.createObjectURL(typedBlob);
    } catch (error) {
      console.error(`Failed to create preview URL for ${file.originalName}:`, error);
      throw new Error(`Failed to create preview URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Sanitize filename for ZIP archive
   */
  private sanitizeFileName(fileName: string): string {
    // Remove or replace invalid characters for ZIP files
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid chars with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .substring(0, 255); // Limit length
  }
  
  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

export const zipService = new ZipService();