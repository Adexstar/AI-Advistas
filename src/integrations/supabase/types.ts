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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ad_simulations: {
        Row: {
          ad_id: string | null
          created_at: string | null
          id: string
          score: Json
          user_id: string
        }
        Insert: {
          ad_id?: string | null
          created_at?: string | null
          id?: string
          score: Json
          user_id: string
        }
        Update: {
          ad_id?: string | null
          created_at?: string | null
          id?: string
          score?: Json
          user_id?: string
        }
        Relationships: []
      }
      ad_templates: {
        Row: {
          canvas_data: Json | null
          category: string | null
          created_at: string
          customizable_fields: Json | null
          description: string | null
          difficulty_level: string | null
          estimated_setup_time_minutes: number | null
          external_id: string | null
          goal: string | null
          id: string
          industry: string | null
          is_popular: boolean | null
          name: string
          performance_score: number | null
          platforms: string[]
          preview_variants: Json | null
          tags: string[] | null
          template_json: Json
          template_source: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          canvas_data?: Json | null
          category?: string | null
          created_at?: string
          customizable_fields?: Json | null
          description?: string | null
          difficulty_level?: string | null
          estimated_setup_time_minutes?: number | null
          external_id?: string | null
          goal?: string | null
          id?: string
          industry?: string | null
          is_popular?: boolean | null
          name: string
          performance_score?: number | null
          platforms?: string[]
          preview_variants?: Json | null
          tags?: string[] | null
          template_json?: Json
          template_source?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          canvas_data?: Json | null
          category?: string | null
          created_at?: string
          customizable_fields?: Json | null
          description?: string | null
          difficulty_level?: string | null
          estimated_setup_time_minutes?: number | null
          external_id?: string | null
          goal?: string | null
          id?: string
          industry?: string | null
          is_popular?: boolean | null
          name?: string
          performance_score?: number | null
          platforms?: string[]
          preview_variants?: Json | null
          tags?: string[] | null
          template_json?: Json
          template_source?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          content: Json
          created_at: string
          id: string
          preview_url: string | null
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          preview_url?: string | null
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          preview_url?: string | null
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          created_at: string
          id: string
          suggestion_type: string
          suggestions: Json
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion_type?: string
          suggestions?: Json
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion_type?: string
          suggestions?: Json
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_ads: {
        Row: {
          ad_type: string
          content: Json
          created_at: string
          generation_prompt: string | null
          id: string
          platform: string
          product_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_type: string
          content: Json
          created_at?: string
          generation_prompt?: string | null
          id?: string
          platform: string
          product_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_type?: string
          content?: Json
          created_at?: string
          generation_prompt?: string | null
          id?: string
          platform?: string
          product_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          provider: string
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          cached_data: Json | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dimensions: Json | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          freepik_download_url: string | null
          freepik_id: string | null
          id: string
          is_file_based: boolean | null
          name: string
          preview_url: string | null
          schema: Json | null
          template_source: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          cached_data?: Json | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          freepik_download_url?: string | null
          freepik_id?: string | null
          id?: string
          is_file_based?: boolean | null
          name: string
          preview_url?: string | null
          schema?: Json | null
          template_source?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          cached_data?: Json | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          freepik_download_url?: string | null
          freepik_id?: string | null
          id?: string
          is_file_based?: boolean | null
          name?: string
          preview_url?: string | null
          schema?: Json | null
          template_source?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_ads: {
        Row: {
          content: Json
          created_at: string
          export_format: string | null
          file_path: string | null
          id: string
          name: string
          status: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          export_format?: string | null
          file_path?: string | null
          id?: string
          name: string
          status?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          export_format?: string | null
          file_path?: string | null
          id?: string
          name?: string
          status?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dashboards: {
        Row: {
          created_at: string | null
          id: string
          layout: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          layout?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          layout?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          created_at: string
          feature: string
          id: string
          last_reset: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          last_reset?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          last_reset?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_template_usage: {
        Args: { template_id: string }
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
