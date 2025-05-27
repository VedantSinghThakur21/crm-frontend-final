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
      leads: {
        Row: {
          id: string
          customer_name: string
          service_needed: string
          site_location: string
          status: string
          assigned_to: string | null
          priority: string | null
          source: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          customer_name: string
          service_needed: string
          site_location: string
          status: string
          assigned_to?: string | null
          priority?: string | null
          source?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          customer_name?: string
          service_needed?: string
          site_location?: string
          status?: string
          assigned_to?: string | null
          priority?: string | null
          source?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      equipment: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          base_rate: number
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          base_rate: number
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string | null
          base_rate?: number
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      operators: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          phone: string | null
          specialization: string
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          phone?: string | null
          specialization: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          phone?: string | null
          specialization?: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      jobs: {
        Row: {
          id: string
          lead_id: string | null
          customer_name: string
          equipment_id: string | null
          operator_id: string | null
          start_date: string
          end_date: string
          location: string
          status: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          customer_name: string
          equipment_id?: string | null
          operator_id?: string | null
          start_date: string
          end_date: string
          location: string
          status: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          customer_name?: string
          equipment_id?: string | null
          operator_id?: string | null
          start_date?: string
          end_date?: string
          location?: string
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      users_view: {
        Row: {
          id: string | null
          email: string | null
          name: string | null
          role: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          email?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          email?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}