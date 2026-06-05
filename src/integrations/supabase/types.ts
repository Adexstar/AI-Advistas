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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      ad_simulations: {
        Row: {
          ad_id: string | null
          created_at: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          ad_id?: string | null
          created_at?: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          ad_id?: string | null
          created_at?: string
          id?: string
          score?: number
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
          is_popular: boolean
          name: string
          performance_score: number | null
          platforms: string[] | null
          preview_url: string | null
          tags: string[] | null
          template_json: Json
          template_source: string
          thumbnail_url: string | null
          updated_at: string
          usage_count: number
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
          is_popular?: boolean
          name: string
          performance_score?: number | null
          platforms?: string[] | null
          preview_url?: string | null
          tags?: string[] | null
          template_json?: Json
          template_source?: string
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number
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
          is_popular?: boolean
          name?: string
          performance_score?: number | null
          platforms?: string[] | null
          preview_url?: string | null
          tags?: string[] | null
          template_json?: Json
          template_source?: string
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      ads: {
        Row: {
          content: Json
          created_at: string
          id: string
          preview_url: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          preview_url?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          preview_url?: string | null
          template_id?: string | null
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
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion_type: string
          suggestions?: Json
          template_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion_type?: string
          suggestions?: Json
          template_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics: {
        Row: {
          campaign_id: string | null
          clicks: number
          conversions: number
          created_at: string
          id: string
          impressions: number
          recorded_at: string
          revenue: number
          roas: number
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number
          conversions?: number
          created_at?: string
          id?: string
          impressions?: number
          recorded_at?: string
          revenue?: number
          roas?: number
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          clicks?: number
          conversions?: number
          created_at?: string
          id?: string
          impressions?: number
          recorded_at?: string
          revenue?: number
          roas?: number
          user_id?: string
        }
        Relationships: []
      }
      brand_kits: {
        Row: {
          colors: Json
          created_at: string
          fonts: Json
          id: string
          logos: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          fonts?: Json
          id?: string
          logos?: Json
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          colors?: Json
          created_at?: string
          fonts?: Json
          id?: string
          logos?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          archived: boolean
          budget: number
          clicks: number
          conversions: number
          created_at: string
          ctr: number
          end_date: string | null
          id: string
          impressions: number
          name: string
          objective: string
          platform: string | null
          reach: number
          revenue: number
          roas: number
          spend: number
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          budget?: number
          clicks?: number
          conversions?: number
          created_at?: string
          ctr?: number
          end_date?: string | null
          id?: string
          impressions?: number
          name: string
          objective?: string
          platform?: string | null
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          budget?: number
          clicks?: number
          conversions?: number
          created_at?: string
          ctr?: number
          end_date?: string | null
          id?: string
          impressions?: number
          name?: string
          objective?: string
          platform?: string | null
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          user_id: string
        }
        Insert: {
          ad_type: string
          content?: Json
          created_at?: string
          generation_prompt?: string | null
          id?: string
          platform: string
          product_name: string
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
          user_id?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          created_at: string
          favorite: boolean
          file_path: string | null
          file_size: number
          file_url: string | null
          folder: string | null
          id: string
          mime_type: string | null
          name: string
          source: string
          tags: string[]
          thumbnail_url: string | null
          type: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite?: boolean
          file_path?: string | null
          file_size?: number
          file_url?: string | null
          folder?: string | null
          id?: string
          mime_type?: string | null
          name: string
          source?: string
          tags?: string[]
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          favorite?: boolean
          file_path?: string | null
          file_size?: number
          file_url?: string | null
          folder?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          source?: string
          tags?: string[]
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      media_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
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
          canvas_data: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          dimensions: Json | null
          external_id: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_file_based: boolean
          name: string
          placeholders: Json | null
          preview_url: string | null
          template_source: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          canvas_data?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json | null
          external_id?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_file_based?: boolean
          name: string
          placeholders?: Json | null
          preview_url?: string | null
          template_source?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          canvas_data?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json | null
          external_id?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_file_based?: boolean
          name?: string
          placeholders?: Json | null
          preview_url?: string | null
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
          status: string
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
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: Json
          created_at?: string
          export_format?: string | null
          file_path?: string | null
          id?: string
          name?: string
          status?: string
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
      user_canvas_drafts: {
        Row: {
          canvas_data: Json | null
          created_at: string
          id: string
          last_saved_at: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          canvas_data?: Json | null
          created_at?: string
          id?: string
          last_saved_at?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          canvas_data?: Json | null
          created_at?: string
          id?: string
          last_saved_at?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_dashboards: {
        Row: {
          created_at: string
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          feature: string
          id: string
          last_reset: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          feature: string
          id?: string
          last_reset?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
