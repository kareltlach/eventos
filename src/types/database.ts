export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budget_items: {
        Row: {
          budget_id: string | null
          description: string
          id: string
          quantity: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          budget_id?: string | null
          description: string
          id?: string
          quantity: number
          total_price?: number | null
          unit_price: number
        }
        Update: {
          budget_id?: string | null
          description?: string
          id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budget_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_requests: {
        Row: {
          created_at: string | null
          customer_info: Json
          event_details: Json
          id: string
          org_id: string | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          customer_info: Json
          event_details: Json
          id?: string
          org_id?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          customer_info?: Json
          event_details?: Json
          id?: string
          org_id?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string
          id: string
          org_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          full_name: string
          id: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          full_name?: string
          id?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "owner" | "manager" | "operator" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
