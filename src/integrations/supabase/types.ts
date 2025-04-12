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
      budgets: {
        Row: {
          amount: number
          category: string
          category_id: string
          created_at: string | null
          id: string
          period: string
          spent: number
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          category_id: string
          created_at?: string | null
          id?: string
          period: string
          spent?: number
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          category_id?: string
          created_at?: string | null
          id?: string
          period?: string
          spent?: number
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_key: string
          created_at: string | null
          en_name: string
          icon: string | null
          id: string
          id_name: string
          type: string
        }
        Insert: {
          category_key: string
          created_at?: string | null
          en_name: string
          icon?: string | null
          id?: string
          id_name: string
          type?: string
        }
        Update: {
          category_key?: string
          created_at?: string | null
          en_name?: string
          icon?: string | null
          id?: string
          id_name?: string
          type?: string
        }
        Relationships: []
      }
      pinjaman_items: {
        Row: {
          amount: number
          category: string
          created_at: string
          due_date: string
          icon: string | null
          id: string
          is_settled: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          due_date: string
          icon?: string | null
          id?: string
          is_settled?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          due_date?: string
          icon?: string | null
          id?: string
          is_settled?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          category_id: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          category: string
          category_id: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          category?: string
          category_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          color: string
          created_at: string | null
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          balance?: number
          color: string
          created_at?: string | null
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          balance?: number
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      want_to_buy_items: {
        Row: {
          category: string
          created_at: string
          estimated_date: string
          icon: string | null
          id: string
          is_purchased: boolean | null
          name: string
          price: number
          priority: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          estimated_date: string
          icon?: string | null
          id?: string
          is_purchased?: boolean | null
          name: string
          price: number
          priority: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          estimated_date?: string
          icon?: string | null
          id?: string
          is_purchased?: boolean | null
          name?: string
          price?: number
          priority?: string
          user_id?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
