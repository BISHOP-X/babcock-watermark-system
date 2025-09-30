import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      batches: {
        Row: {
          id: string
          created_at: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          total_files: number
          processed_files: number
          failed_files: number
          watermark_settings: any
          batch_name: string | null
          completed_at: string | null
        }
        Insert: {
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          total_files: number
          processed_files?: number
          failed_files?: number
          watermark_settings: any
          batch_name?: string | null
        }
        Update: {
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          total_files?: number
          processed_files?: number
          failed_files?: number
          watermark_settings?: any
          batch_name?: string | null
          completed_at?: string | null
        }
      }
      files: {
        Row: {
          id: string
          batch_id: string
          original_name: string
          file_size: number
          mime_type: string
          status: 'queued' | 'processing' | 'completed' | 'failed'
          progress: number
          error_message: string | null
          original_file_path: string | null
          watermarked_file_path: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          batch_id: string
          original_name: string
          file_size: number
          mime_type: string
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          progress?: number
          error_message?: string | null
          original_file_path?: string | null
          watermarked_file_path?: string | null
        }
        Update: {
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          progress?: number
          error_message?: string | null
          original_file_path?: string | null
          watermarked_file_path?: string | null
          processed_at?: string | null
        }
      }
    }
  }
}