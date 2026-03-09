/**
 * Supabase database types.
 *
 * Manually maintained to match migrations 001–010.
 * If schema drifts, regenerate with:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID
 */

export type NotificationPreferences = {
  daily_summary?: boolean
  bill_reminders?: boolean
  bill_reminder_days?: number
  anomaly_alerts?: boolean
  email_critical?: boolean
  email_informational?: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          partner_id: string | null
          preferred_language: 'no' | 'en'
          notification_preferences: NotificationPreferences
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          partner_id?: string | null
          preferred_language?: 'no' | 'en'
          notification_preferences?: NotificationPreferences
        }
        Update: {
          display_name?: string | null
          partner_id?: string | null
          preferred_language?: 'no' | 'en'
          notification_preferences?: NotificationPreferences
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
          neonomics_account_id: string | null
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
          priority: 'critical' | 'high' | 'normal' | 'low'
          source_document_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bills_upcoming']['Row'], 'id' | 'created_at'> & {
          priority?: 'critical' | 'high' | 'normal' | 'low'
        }
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
          // Privacy Shield fields (migration 005)
          extracted_text: string | null
          redacted_text: string | null
          redaction_map: Record<string, string> | null
          redaction_status: 'pending' | 'auto_detected' | 'user_confirmed' | 'skipped' | null
          pii_detections: Array<Record<string, unknown>> | null
          ai_summary: string | null
          ai_summary_redacted: string | null
          ai_flags: Record<string, unknown> | null
          ai_analyzed_at: string | null
          status: 'uploaded' | 'pii_detected' | 'redaction_confirmed' | 'analyzing' | 'analyzed' | 'error'
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
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'bill_due' | 'low_balance' | 'document_deadline' | 'consent_expiry' | 'daily_summary' | 'analysis_complete' | 'spending_anomaly' | 'savings_milestone'
          urgency: 'critical' | 'info' | 'background'
          title: string
          message: string
          channel: 'in_app' | 'email' | 'both'
          notification_key: string
          is_read: boolean
          is_emailed: boolean
          bypass_quiet_hours: boolean
          related_entity_type: string | null
          related_entity_id: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'is_read' | 'is_emailed' | 'bypass_quiet_hours'> & {
          bypass_quiet_hours?: boolean
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']> & {
          is_read?: boolean
          is_emailed?: boolean
        }
      }
      email_log: {
        Row: {
          id: string
          user_id: string
          notification_id: string | null
          email_type: string
          resend_id: string | null
          sent_at: string
          status: 'sent' | 'failed' | 'bounced'
        }
        Insert: Omit<Database['public']['Tables']['email_log']['Row'], 'id' | 'sent_at'>
        Update: Partial<Database['public']['Tables']['email_log']['Insert']>
      }
      partner_sharing: {
        Row: {
          id: string
          user_id: string
          partner_id: string
          shared_account_ids: string[]
          permission_level: 'view_only' | 'full'
          accepted: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['partner_sharing']['Row'], 'id' | 'created_at' | 'shared_account_ids' | 'permission_level' | 'accepted'> & {
          shared_account_ids?: string[]
          permission_level?: 'view_only' | 'full'
          accepted?: boolean
        }
        Update: Partial<Database['public']['Tables']['partner_sharing']['Insert']> & {
          accepted?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
