import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}
if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      ministries: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          minister_name: string | null
          minister_email: string | null
          budget_code: string | null
          blockchain_address: string | null
          public_key: string | null
          logo_url: string | null
          contact_info: any | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          minister_name?: string | null
          minister_email?: string | null
          budget_code?: string | null
          blockchain_address?: string | null
          public_key?: string | null
          logo_url?: string | null
          contact_info?: any | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          minister_name?: string | null
          minister_email?: string | null
          budget_code?: string | null
          blockchain_address?: string | null
          public_key?: string | null
          logo_url?: string | null
          contact_info?: any | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      budget_allocations: {
        Row: {
          id: string
          fiscal_year_id: string
          ministry_id: string
          category_id: string
          project_name: string
          project_description: string | null
          allocated_amount: number
          project_code: string | null
          priority_level: number
          expected_start_date: string | null
          expected_end_date: string | null
          status: string
          blockchain_tx_hash: string | null
          created_by: string
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fiscal_year_id: string
          ministry_id: string
          category_id: string
          project_name: string
          project_description?: string | null
          allocated_amount: number
          project_code?: string | null
          priority_level?: number
          expected_start_date?: string | null
          expected_end_date?: string | null
          status?: string
          blockchain_tx_hash?: string | null
          created_by: string
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fiscal_year_id?: string
          ministry_id?: string
          category_id?: string
          project_name?: string
          project_description?: string | null
          allocated_amount?: number
          project_code?: string | null
          priority_level?: number
          expected_start_date?: string | null
          expected_end_date?: string | null
          status?: string
          blockchain_tx_hash?: string | null
          created_by?: string
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      government_officials: {
        Row: {
          id: string
          ministry_id: string | null
          employee_id: string
          first_name: string
          last_name: string
          email: string
          password_hash: string
          role: string
          position: string | null
          permissions: any | null
          blockchain_address: string | null
          digital_signature_public_key: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ministry_id?: string | null
          employee_id: string
          first_name: string
          last_name: string
          email: string
          password_hash: string
          role: string
          position?: string | null
          permissions?: any | null
          blockchain_address?: string | null
          digital_signature_public_key?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ministry_id?: string | null
          employee_id?: string
          first_name?: string
          last_name?: string
          email?: string
          password_hash?: string
          role?: string
          position?: string | null
          permissions?: any | null
          blockchain_address?: string | null
          digital_signature_public_key?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

