import { PDFDocument, rgb, degrees } from 'pdf-lib'
import { WatermarkSettings } from './api'

export class PDFProcessor {
  async addWatermark(fileBuffer: ArrayBuffer, settings: WatermarkSettings): Promise<Uint8Array> {
    try {
      // Load the PDF
      const pdfDoc = await PDFDocument.load(fileBuffer)
      const pages = pdfDoc.getPages()

      // Convert color from hex to RGB
      const color = this.hexToRgb(settings.color)
      
      // Get font size
      const fontSize = this.getFontSize(settings.fontSize)
      
      // Add watermark to each page
      for (const page of pages) {
        const { width, height } = page.getSize()
        
        // Calculate position for diagonal watermark
        const x = width / 2
        const y = height / 2
        
        // Add watermark text
        page.drawText(settings.text, {
          x: x,
          y: y,
          size: fontSize,
          color: rgb(color.r, color.g, color.b),
          opacity: settings.opacity / 100,
          rotate: degrees(-45),
          // Center the text
          maxWidth: width * 0.8,
        })
      }

      // Return the watermarked PDF
      return await pdfDoc.save()
    } catch (error) {
      console.error('PDF watermarking error:', error)
      throw new Error(`Failed to watermark PDF: ${error.message}`)
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 1 } // Default to blue
  }

  private getFontSize(size: string): number {
    switch (size) {
      case 'small': return 24
      case 'large': return 48
      default: return 36 // medium
    }
  }
}

export const pdfProcessor = new PDFProcessor()