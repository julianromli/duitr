export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          amount: number
          category_id: number | null
          created_at: string | null
          id: string
          period: string | null
          spent: number
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: number | null
          created_at?: string | null
          id?: string
          period?: string | null
          spent?: number
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: number | null
          created_at?: string | null
          id?: string
          period?: string | null
          spent?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_new_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      categories: {
        Row: {
          category_id: number
          category_key: string
          color: string | null
          created_at: string | null
          en_name: string
          icon: string | null
          id_name: string
          type: string
          user_id: string | null
        }
        Insert: {
          category_id?: number
          category_key: string
          color?: string | null
          created_at?: string | null
          en_name: string
          icon?: string | null
          id_name: string
          type: string
          user_id?: string | null
        }
        Update: {
          category_id?: number
          category_key?: string
          color?: string | null
          created_at?: string | null
          en_name?: string
          icon?: string | null
          id_name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories_backup: {
        Row: {
          category_key: string | null
          created_at: string | null
          en_name: string | null
          icon: string | null
          id: string | null
          id_name: string | null
          type: string | null
        }
        Insert: {
          category_key?: string | null
          created_at?: string | null
          en_name?: string | null
          icon?: string | null
          id?: string | null
          id_name?: string | null
          type?: string | null
        }
        Update: {
          category_key?: string | null
          created_at?: string | null
          en_name?: string | null
          icon?: string | null
          id?: string | null
          id_name?: string | null
          type?: string | null
        }
        Relationships: []
      }
      categories_duplicate: {
        Row: {
          category_id: number
          category_key: string
          created_at: string | null
          en_name: string
          id_name: string
          type: string
        }
        Insert: {
          category_id?: number
          category_key: string
          created_at?: string | null
          en_name: string
          id_name: string
          type: string
        }
        Update: {
          category_id?: number
          category_key?: string
          created_at?: string | null
          en_name?: string
          id_name?: string
          type?: string
        }
        Relationships: []
      }
      category_id_mapping: {
        Row: {
          category_key: string | null
          new_id: number | null
          old_id: string
        }
        Insert: {
          category_key?: string | null
          new_id?: number | null
          old_id: string
        }
        Update: {
          category_key?: string | null
          new_id?: number | null
          old_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_id_mapping_new_id_fkey"
            columns: ["new_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
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
          category_id: number | null
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
          category_id?: number | null
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
          category_id?: number | null
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
            foreignKeyName: "fk_transaction_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
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
      delete_transfer_transaction: {
        Args: {
          transaction_id: string
          source_wallet_id: string
          destination_wallet_id: string
          transfer_amount: number
        }
        Returns: undefined
      }
      log_migration_error: {
        Args: { step_name: string; err_message: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
