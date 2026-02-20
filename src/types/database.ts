/**
 * Supabase database types.
 * These are manually written for now — after Step 2 (Database setup),
 * run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID`
 * to generate these automatically from your actual schema.
 *
 * The generated file will replace this one.
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          partner_id: string | null
          preferred_language: 'no' | 'en'
          notification_preferences: {
            daily_checkin: boolean
            bill_reminders: boolean
            anomaly_alerts: boolean
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          partner_id?: string | null
          preferred_language?: 'no' | 'en'
          notification_preferences?: {
            daily_checkin: boolean
            bill_reminders: boolean
            anomaly_alerts: boolean
          }
        }
        Update: {
          display_name?: string | null
          partner_id?: string | null
          preferred_language?: 'no' | 'en'
          notification_preferences?: {
            daily_checkin: boolean
            bill_reminders: boolean
            anomaly_alerts: boolean
          }
        }
      }
      bank_connections: {
        Row: {
          id: string
          user_id: string
          neonomics_session_id: string | null
          bank_name: string
          bank_id: string
          consent_expires_at: string | null
          last_synced_at: string | null
          status: 'pending' | 'active' | 'expired' | 'revoked' | 'error'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bank_connections']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bank_connections']['Insert']>
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          bank_connection_id: string
          account_name: string | null
          iban: string | null
          balance: number
          currency: string
          account_type: string | null
          is_shared_with_partner: boolean
          last_updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          account_id: string
          user_id: string
          transaction_date: string
          booking_date: string | null
          amount: number
          currency: string
          description: string | null
          category: string | null
          category_confidence: number | null
          is_recurring: boolean
          counterpart_name: string | null
          internal_reference: string | null
          raw_data: Record<string, unknown> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      bills_upcoming: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          currency: string
          due_date: string
          is_auto_detected: boolean
          is_paid: boolean
          category: string | null
          recurrence: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bills_upcoming']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bills_upcoming']['Insert']>
      }
      documents: {
        Row: {
          id: string
          user_id: string
          file_path: string
          original_filename: string
          file_size_bytes: number | null
          mime_type: string | null
          document_type: 'contract' | 'letter' | 'invoice' | 'tax' | 'bank_statement' | 'inkasso' | 'other' | null
          ai_summary: string | null
          ai_flags: Record<string, unknown> | null
          ai_analyzed_at: string | null
          status: 'uploaded' | 'analyzing' | 'analyzed' | 'error'
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          context_snapshot: Record<string, unknown> | null
          tokens_used: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
