export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          wallet_address: string
          chain_id: number | null
          username: string | null
          email: string | null
          avatar_url: string | null
          onboarding_complete: boolean | null
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          wallet_address: string
          chain_id?: number | null
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          onboarding_complete?: boolean | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          wallet_address?: string
          chain_id?: number | null
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          onboarding_complete?: boolean | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
