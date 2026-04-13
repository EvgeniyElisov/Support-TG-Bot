export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      client_assignments: {
        Row: {
          assigned_by_manager_id: string | null
          client_id: string
          current_manager_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_by_manager_id?: string | null
          client_id: string
          current_manager_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by_manager_id?: string | null
          client_id?: string
          current_manager_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_assigned_by_manager_id_fkey"
            columns: ["assigned_by_manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "message_dialogs"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_assignments_current_manager_id_fkey"
            columns: ["current_manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clients: {
        Row: {
          chat_id: number
          created_at: string
          dialog_status: string
          first_name: string | null
          id: string
          last_name: string | null
          telegram_user_id: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          dialog_status?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          telegram_user_id?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          dialog_status?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          telegram_user_id?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      managers: {
        Row: {
          company_role: string
          created_at: string
          first_name: string
          last_name: string
          user_id: string
        }
        Insert: {
          company_role: string
          created_at?: string
          first_name: string
          last_name: string
          user_id: string
        }
        Update: {
          company_role?: string
          created_at?: string
          first_name?: string
          last_name?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          client_id: string
          created_at: string
          direction: string
          id: string
          sent_by_manager_id: string | null
          text_content: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          direction?: string
          id?: string
          sent_by_manager_id?: string | null
          text_content?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          direction?: string
          id?: string
          sent_by_manager_id?: string | null
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "message_dialogs"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "messages_sent_by_manager_id_fkey"
            columns: ["sent_by_manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      message_dialogs: {
        Row: {
          assigned_by_manager_first_name: string | null
          assigned_by_manager_id: string | null
          assigned_by_manager_last_name: string | null
          chat_id: number | null
          client_id: string | null
          current_manager_first_name: string | null
          current_manager_id: string | null
          current_manager_last_name: string | null
          dialog_status: string | null
          first_name: string | null
          last_message_at: string | null
          last_name: string | null
          messages_count: number | null
          username: string | null
        }
        Relationships: []
      }
      message_stats: {
        Row: {
          total_messages: number | null
          total_unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      insert_manager_reply: {
        Args: { p_client_id: string; p_text: string }
        Returns: string
      }
      set_client_assignment: {
        Args: { p_client_id: string; p_current_manager_id: string | null }
        Returns: undefined
      }
      set_client_dialog_status: {
        Args: { p_client_id: string; p_status: string }
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
