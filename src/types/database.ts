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
      product_categories: {
        Row: {
          id: string
          org_id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          slug?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_types: {
        Row: {
          id: string
          org_id: string
          name: string
          symbol: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          symbol: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          symbol?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          org_id: string
          category_id: string | null
          unit_type_id: string | null
          name: string
          description: string | null
          base_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          category_id?: string | null
          unit_type_id?: string | null
          name: string
          description?: string | null
          base_price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          category_id?: string | null
          unit_type_id?: string | null
          name?: string
          description?: string | null
          base_price?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_type_id_fkey"
            columns: ["unit_type_id"]
            isOneToOne: false
            referencedRelation: "unit_types"
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
          valid_until: string | null
          internal_notes: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
        }
        Insert: {
          created_at?: string | null
          customer_info: Json
          event_details: Json
          id?: string
          org_id?: string | null
          status?: string | null
          total_amount?: number | null
          valid_until?: string | null
          internal_notes?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
        }
        Update: {
          created_at?: string | null
          customer_info?: Json
          event_details?: Json
          id?: string
          org_id?: string | null
          status?: string | null
          total_amount?: number | null
          valid_until?: string | null
          internal_notes?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
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
      budget_items: {
        Row: {
          budget_id: string | null
          description: string
          id: string
          quantity: number
          total_price: number | null
          unit_price: number
          product_id: string | null
        }
        Insert: {
          budget_id?: string | null
          description: string
          id?: string
          quantity: number
          total_price?: number | null
          unit_price: number
          product_id?: string | null
        }
        Update: {
          budget_id?: string | null
          description?: string
          id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budget_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      },
      attendees: {
        Row: {
          id: string
          org_id: string
          full_name: string
          email: string | null
          phone: string | null
          company: string | null
          attendee_type: "guest" | "vip" | "speaker" | "staff" | "vendor"
          status: "pending" | "confirmed" | "cancelled" | "checked_in"
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          full_name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          attendee_type?: "guest" | "vip" | "speaker" | "staff" | "vendor"
          status?: "pending" | "confirmed" | "cancelled" | "checked_in"
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          attendee_type?: "guest" | "vip" | "speaker" | "staff" | "vendor"
          status?: "pending" | "confirmed" | "cancelled" | "checked_in"
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      },
      notifications: {
        Row: {
          id: string
          created_at: string
          org_id: string
          title: string
          message: string
          type: string
          data: Json | null
          read: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          org_id: string
          title: string
          message: string
          type: string
          data?: Json | null
          read?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          org_id?: string
          title?: string
          message?: string
          type?: string
          data?: Json | null
          read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
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
