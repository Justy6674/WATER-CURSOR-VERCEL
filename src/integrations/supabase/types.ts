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
      achievements: {
        Row: {
          achievement_date: string | null
          created_at: string | null
          id: number
          streak_days: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_date?: string | null
          created_at?: string | null
          id?: never
          streak_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_date?: string | null
          created_at?: string | null
          id?: never
          streak_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      device_connections: {
        Row: {
          connected_at: string | null
          device_info: Json | null
          id: number
          user_id: string | null
        }
        Insert: {
          connected_at?: string | null
          device_info?: Json | null
          id?: never
          user_id?: string | null
        }
        Update: {
          connected_at?: string | null
          device_info?: Json | null
          id?: never
          user_id?: string | null
        }
        Relationships: []
      }
      gamification: {
        Row: {
          badges: Json | null
          created_at: string | null
          id: number
          points: number | null
          rewards: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          badges?: Json | null
          created_at?: string | null
          id?: never
          points?: number | null
          rewards?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          badges?: Json | null
          created_at?: string | null
          id?: never
          points?: number | null
          rewards?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: number
          message: string | null
          notification_type: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: never
          message?: string | null
          notification_type?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: never
          message?: string | null
          notification_type?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: number
          phone_number: string | null
          preferences: Json | null
          reminder_method: string | null
          reminders_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
          water_goal: number | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: never
          phone_number?: string | null
          preferences?: Json | null
          reminder_method?: string | null
          reminders_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          water_goal?: number | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: never
          phone_number?: string | null
          preferences?: Json | null
          reminder_method?: string | null
          reminders_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          water_goal?: number | null
        }
        Relationships: []
      }
      water_intake: {
        Row: {
          created_at: string | null
          id: number
          intake_amount: number | null
          intake_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          intake_amount?: number | null
          intake_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          intake_amount?: number | null
          intake_date?: string | null
          updated_at?: string | null
          user_id?: string | null
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
