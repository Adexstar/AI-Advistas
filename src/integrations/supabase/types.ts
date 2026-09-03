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
      ai_context: {
        Row: {
          active_brandkit_id: string | null
          active_category: string | null
          active_objective: string | null
          active_platform: string | null
          brand_id: string | null
          current_campaign_id: string | null
          current_goal: string | null
          id: string
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_brandkit_id?: string | null
          active_category?: string | null
          active_objective?: string | null
          active_platform?: string | null
          brand_id?: string | null
          current_campaign_id?: string | null
          current_goal?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_brandkit_id?: string | null
          active_category?: string | null
          active_objective?: string | null
          active_platform?: string | null
          brand_id?: string | null
          current_campaign_id?: string | null
          current_goal?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          input: Json | null
          job_type: string
          output: Json | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          input?: Json | null
          job_type: string
          output?: Json | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          input?: Json | null
          job_type?: string
          output?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          accepted_at: string | null
          campaign_id: string | null
          category: string
          confidence: number
          created_at: string
          description: string
          id: string
          outcome: Json | null
          priority: string
          reasoning: string | null
          rejected_at: string | null
          status: string
          suggested_action: Json | null
          supporting_data: Json | null
          title: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          campaign_id?: string | null
          category: string
          confidence?: number
          created_at?: string
          description: string
          id?: string
          outcome?: Json | null
          priority?: string
          reasoning?: string | null
          rejected_at?: string | null
          status?: string
          suggested_action?: Json | null
          supporting_data?: Json | null
          title: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          campaign_id?: string | null
          category?: string
          confidence?: number
          created_at?: string
          description?: string
          id?: string
          outcome?: Json | null
          priority?: string
          reasoning?: string | null
          rejected_at?: string | null
          status?: string
          suggested_action?: Json | null
          supporting_data?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
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
      audience_metrics: {
        Row: {
          campaign_id: string
          clicks: number
          conversions: number
          ctr: number
          id: string
          impressions: number
          metadata: Json | null
          recorded_at: string
          revenue: number
          segment_type: string
          segment_value: string
          spend: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicks?: number
          conversions?: number
          ctr?: number
          id?: string
          impressions?: number
          metadata?: Json | null
          recorded_at?: string
          revenue?: number
          segment_type: string
          segment_value: string
          spend?: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicks?: number
          conversions?: number
          ctr?: number
          id?: string
          impressions?: number
          metadata?: Json | null
          recorded_at?: string
          revenue?: number
          segment_type?: string
          segment_value?: string
          spend?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action: Json | null
          condition: Json | null
          created_at: string
          enabled: boolean
          id: string
          name: string
          trigger: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action?: Json | null
          condition?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          trigger?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: Json | null
          condition?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          trigger?: Json | null
          updated_at?: string
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
      campaign_memory: {
        Row: {
          best_brand_elements: Json | null
          best_copy: Json | null
          brand_id: string | null
          category_id: string | null
          failed_copy: Json | null
          failed_templates: Json | null
          id: string
          last_learning: string | null
          results_summary: Json | null
          updated_at: string
          user_id: string
          winning_templates: Json | null
        }
        Insert: {
          best_brand_elements?: Json | null
          best_copy?: Json | null
          brand_id?: string | null
          category_id?: string | null
          failed_copy?: Json | null
          failed_templates?: Json | null
          id?: string
          last_learning?: string | null
          results_summary?: Json | null
          updated_at?: string
          user_id: string
          winning_templates?: Json | null
        }
        Update: {
          best_brand_elements?: Json | null
          best_copy?: Json | null
          brand_id?: string | null
          category_id?: string | null
          failed_copy?: Json | null
          failed_templates?: Json | null
          id?: string
          last_learning?: string | null
          results_summary?: Json | null
          updated_at?: string
          user_id?: string
          winning_templates?: Json | null
        }
        Relationships: []
      }
      campaign_metrics: {
        Row: {
          campaign_id: string
          clicks: number
          conversion_rate: number
          conversions: number
          cpa: number
          cpc: number
          cpm: number
          created_at: string
          ctr: number
          id: string
          impressions: number
          platform: string | null
          raw_data: Json | null
          reach: number
          recorded_at: string
          revenue: number
          roas: number
          spend: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicks?: number
          conversion_rate?: number
          conversions?: number
          cpa?: number
          cpc?: number
          cpm?: number
          created_at?: string
          ctr?: number
          id?: string
          impressions?: number
          platform?: string | null
          raw_data?: Json | null
          reach?: number
          recorded_at?: string
          revenue?: number
          roas?: number
          spend?: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicks?: number
          conversion_rate?: number
          conversions?: number
          cpa?: number
          cpc?: number
          cpm?: number
          created_at?: string
          ctr?: number
          id?: string
          impressions?: number
          platform?: string | null
          raw_data?: Json | null
          reach?: number
          recorded_at?: string
          revenue?: number
          roas?: number
          spend?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
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
      category_playbooks: {
        Row: {
          audience_patterns: Json | null
          category: string
          cta_patterns: Json | null
          focus_areas: Json | null
          headline_patterns: Json | null
          id: string
          offer_rules: Json | null
          tone_guidance: string | null
          updated_at: string
          visual_rules: Json | null
          winning_hooks: Json | null
        }
        Insert: {
          audience_patterns?: Json | null
          category: string
          cta_patterns?: Json | null
          focus_areas?: Json | null
          headline_patterns?: Json | null
          id?: string
          offer_rules?: Json | null
          tone_guidance?: string | null
          updated_at?: string
          visual_rules?: Json | null
          winning_hooks?: Json | null
        }
        Update: {
          audience_patterns?: Json | null
          category?: string
          cta_patterns?: Json | null
          focus_areas?: Json | null
          headline_patterns?: Json | null
          id?: string
          offer_rules?: Json | null
          tone_guidance?: string | null
          updated_at?: string
          visual_rules?: Json | null
          winning_hooks?: Json | null
        }
        Relationships: []
      }
      creative_metrics: {
        Row: {
          campaign_id: string
          clicks: number
          conversions: number
          creative_id: string | null
          creative_name: string | null
          creative_type: string | null
          ctr: number
          id: string
          impressions: number
          metadata: Json | null
          recorded_at: string
          score: number
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicks?: number
          conversions?: number
          creative_id?: string | null
          creative_name?: string | null
          creative_type?: string | null
          ctr?: number
          id?: string
          impressions?: number
          metadata?: Json | null
          recorded_at?: string
          score?: number
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicks?: number
          conversions?: number
          creative_id?: string | null
          creative_name?: string | null
          creative_type?: string | null
          ctr?: number
          id?: string
          impressions?: number
          metadata?: Json | null
          recorded_at?: string
          score?: number
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          action: string | null
          campaign_id: string | null
          category: string | null
          confidence: number | null
          created_at: string
          id: string
          page: string | null
          reasoning: string | null
          resolved_at: string | null
          signal: string | null
          status: string
          trigger_source: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          campaign_id?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          page?: string | null
          reasoning?: string | null
          resolved_at?: string | null
          signal?: string | null
          status?: string
          trigger_source?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
          campaign_id?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          page?: string | null
          reasoning?: string | null
          resolved_at?: string | null
          signal?: string | null
          status?: string
          trigger_source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      design_comments: {
        Row: {
          author: string
          comment: string
          created_at: string
          design_id: string
          id: string
          position: Json | null
          resolved: boolean
          user_id: string
        }
        Insert: {
          author: string
          comment: string
          created_at?: string
          design_id: string
          id?: string
          position?: Json | null
          resolved?: boolean
          user_id: string
        }
        Update: {
          author?: string
          comment?: string
          created_at?: string
          design_id?: string
          id?: string
          position?: Json | null
          resolved?: boolean
          user_id?: string
        }
        Relationships: []
      }
      design_scores: {
        Row: {
          accessibility_score: number
          branding_score: number
          design_id: string
          hierarchy_score: number
          id: string
          overall_score: number
          readability_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility_score?: number
          branding_score?: number
          design_id: string
          hierarchy_score?: number
          id?: string
          overall_score?: number
          readability_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility_score?: number
          branding_score?: number
          design_id?: string
          hierarchy_score?: number
          id?: string
          overall_score?: number
          readability_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      design_suggestions: {
        Row: {
          accepted: boolean | null
          category: string | null
          confidence: number
          created_at: string
          design_id: string
          id: string
          reasoning: string | null
          suggestion: string
          user_id: string
        }
        Insert: {
          accepted?: boolean | null
          category?: string | null
          confidence?: number
          created_at?: string
          design_id: string
          id?: string
          reasoning?: string | null
          suggestion: string
          user_id: string
        }
        Update: {
          accepted?: boolean | null
          category?: string | null
          confidence?: number
          created_at?: string
          design_id?: string
          id?: string
          reasoning?: string | null
          suggestion?: string
          user_id?: string
        }
        Relationships: []
      }
      design_versions: {
        Row: {
          ai_assisted: boolean
          created_at: string
          created_by: string | null
          design_id: string
          id: string
          snapshot: Json
          user_id: string
          version: number
        }
        Insert: {
          ai_assisted?: boolean
          created_at?: string
          created_by?: string | null
          design_id: string
          id?: string
          snapshot: Json
          user_id: string
          version?: number
        }
        Update: {
          ai_assisted?: boolean
          created_at?: string
          created_by?: string | null
          design_id?: string
          id?: string
          snapshot?: Json
          user_id?: string
          version?: number
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
      platform_connections: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          metadata: Json
          platform: string
          provider: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          platform: string
          provider: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          platform?: string
          provider?: string
          refresh_token?: string | null
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
      provider_search_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          provider: string
          results: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at?: string
          id?: string
          provider: string
          results?: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          results?: Json
        }
        Relationships: []
      }
      publishing_history: {
        Row: {
          action: string
          campaign_id: string
          created_at: string
          details: Json
          id: string
          job_id: string | null
          platform: string
          result: string
          user_id: string
        }
        Insert: {
          action: string
          campaign_id: string
          created_at?: string
          details?: Json
          id?: string
          job_id?: string | null
          platform: string
          result: string
          user_id: string
        }
        Update: {
          action?: string
          campaign_id?: string
          created_at?: string
          details?: Json
          id?: string
          job_id?: string | null
          platform?: string
          result?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publishing_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publishing_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "publishing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      publishing_jobs: {
        Row: {
          campaign_id: string
          created_at: string
          error_message: string | null
          external_ids: Json
          id: string
          max_retries: number
          mode: string
          payload: Json
          platform: string
          provider: string
          published_at: string | null
          retry_count: number
          scheduled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error_message?: string | null
          external_ids?: Json
          id?: string
          max_retries?: number
          mode?: string
          payload?: Json
          platform: string
          provider: string
          published_at?: string | null
          retry_count?: number
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          external_ids?: Json
          id?: string
          max_retries?: number
          mode?: string
          payload?: Json
          platform?: string
          provider?: string
          published_at?: string | null
          retry_count?: number
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publishing_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
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
      system_settings: {
        Row: {
          ai_model: string
          created_at: string
          decision_log_retention_days: number
          default_autonomy: string
          default_plan: string
          free_ai_credits: number
          id: string
          image_model: string
          maintenance_mode: boolean
          platform_name: string
          signups_open: boolean
          singleton: boolean
          updated_at: string
        }
        Insert: {
          ai_model?: string
          created_at?: string
          decision_log_retention_days?: number
          default_autonomy?: string
          default_plan?: string
          free_ai_credits?: number
          id?: string
          image_model?: string
          maintenance_mode?: boolean
          platform_name?: string
          signups_open?: boolean
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          ai_model?: string
          created_at?: string
          decision_log_retention_days?: number
          default_autonomy?: string
          default_plan?: string
          free_ai_credits?: number
          id?: string
          image_model?: string
          maintenance_mode?: boolean
          platform_name?: string
          signups_open?: boolean
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      template_collection_items: {
        Row: {
          collection_id: string
          created_at: string
          sort_order: number
          template_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          sort_order?: number
          template_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "template_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_collection_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_collections: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_featured: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      template_layers: {
        Row: {
          ai_replaceable: boolean
          animation: Json
          brand_replaceable: boolean
          created_at: string
          editable: boolean
          effects: Json
          height: number | null
          id: string
          layer_type: string
          props: Json
          rotation: number | null
          template_id: string
          updated_at: string
          variable_key: string | null
          width: number | null
          x: number | null
          y: number | null
          z_index: number
        }
        Insert: {
          ai_replaceable?: boolean
          animation?: Json
          brand_replaceable?: boolean
          created_at?: string
          editable?: boolean
          effects?: Json
          height?: number | null
          id?: string
          layer_type: string
          props?: Json
          rotation?: number | null
          template_id: string
          updated_at?: string
          variable_key?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
          z_index?: number
        }
        Update: {
          ai_replaceable?: boolean
          animation?: Json
          brand_replaceable?: boolean
          created_at?: string
          editable?: boolean
          effects?: Json
          height?: number | null
          id?: string
          layer_type?: string
          props?: Json
          rotation?: number | null
          template_id?: string
          updated_at?: string
          variable_key?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_layers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_usage_events: {
        Row: {
          context: Json
          created_at: string
          event: string
          id: string
          template_id: string
          user_id: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          event: string
          id?: string
          template_id: string
          user_id?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          event?: string
          id?: string
          template_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          layers: Json
          note: string | null
          template_id: string
          template_json: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          layers?: Json
          note?: string | null
          template_id: string
          template_json: Json
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          layers?: Json
          note?: string | null
          template_id?: string
          template_json?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          ai_tags: string[] | null
          brand_compatible: boolean
          canvas_data: Json | null
          category: string | null
          collection_slug: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dimensions: Json | null
          external_id: string | null
          featured: boolean
          file_path: string | null
          file_size: number | null
          file_type: string | null
          format: string | null
          height: number | null
          id: string
          imported_at: string | null
          industry_tags: string[] | null
          is_active: boolean
          is_file_based: boolean
          layout_dna: Json
          license_expires_at: string | null
          metadata: Json
          name: string
          objective: string | null
          placeholders: Json | null
          platform: string | null
          popularity_score: number
          premium: boolean
          preview_url: string | null
          review_note: string | null
          review_status: string
          reviewed_at: string | null
          source: string
          source_id: string | null
          source_license: string | null
          submitted_by: string | null
          template_json: Json | null
          template_source: string
          thumbnail_url: string | null
          updated_at: string
          usage_count: number
          width: number | null
        }
        Insert: {
          ai_tags?: string[] | null
          brand_compatible?: boolean
          canvas_data?: Json | null
          category?: string | null
          collection_slug?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json | null
          external_id?: string | null
          featured?: boolean
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          format?: string | null
          height?: number | null
          id?: string
          imported_at?: string | null
          industry_tags?: string[] | null
          is_active?: boolean
          is_file_based?: boolean
          layout_dna?: Json
          license_expires_at?: string | null
          metadata?: Json
          name: string
          objective?: string | null
          placeholders?: Json | null
          platform?: string | null
          popularity_score?: number
          premium?: boolean
          preview_url?: string | null
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          source?: string
          source_id?: string | null
          source_license?: string | null
          submitted_by?: string | null
          template_json?: Json | null
          template_source?: string
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number
          width?: number | null
        }
        Update: {
          ai_tags?: string[] | null
          brand_compatible?: boolean
          canvas_data?: Json | null
          category?: string | null
          collection_slug?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json | null
          external_id?: string | null
          featured?: boolean
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          format?: string | null
          height?: number | null
          id?: string
          imported_at?: string | null
          industry_tags?: string[] | null
          is_active?: boolean
          is_file_based?: boolean
          layout_dna?: Json
          license_expires_at?: string | null
          metadata?: Json
          name?: string
          objective?: string | null
          placeholders?: Json | null
          platform?: string | null
          popularity_score?: number
          premium?: boolean
          preview_url?: string | null
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          source?: string
          source_id?: string | null
          source_license?: string | null
          submitted_by?: string | null
          template_json?: Json | null
          template_source?: string
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number
          width?: number | null
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
      admin_action_trends: { Args: never; Returns: Json }
      admin_decision_stats: { Args: never; Returns: Json }
      admin_list_decisions: {
        Args: {
          p_action?: string
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_since?: string
          p_status?: string
        }
        Returns: {
          action: string
          campaign_id: string
          campaign_name: string
          category: string
          confidence: number
          created_at: string
          id: string
          page: string
          reasoning: string
          signal: string
          status: string
          total_count: number
          trigger_source: string
          user_id: string
          user_name: string
        }[]
      }
      admin_list_users: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_plan?: string
          p_search?: string
          p_status?: string
        }
        Returns: {
          ai_credits: number
          avatar_url: string
          campaigns: number
          display_name: string
          email: string
          joined_at: string
          last_active: string
          plan: string
          status: string
          storage_bytes: number
          total_count: number
          user_id: string
        }[]
      }
      admin_overview_stats: { Args: never; Returns: Json }
      admin_plan_distribution: {
        Args: never
        Returns: {
          plan: string
          users: number
        }[]
      }
      admin_user_detail: { Args: { p_user_id: string }; Returns: Json }
      admin_user_growth: {
        Args: { p_days?: number }
        Returns: {
          day: string
          users: number
        }[]
      }
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
      search_templates: {
        Args: {
          p_brand_compat?: string
          p_brand_compatible?: boolean
          p_category?: string
          p_emotion?: string
          p_goal?: string
          p_industry?: string
          p_layout_style?: string
          p_limit?: number
          p_platform?: string
          p_query?: string
        }
        Returns: {
          ai_tags: string[] | null
          brand_compatible: boolean
          canvas_data: Json | null
          category: string | null
          collection_slug: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dimensions: Json | null
          external_id: string | null
          featured: boolean
          file_path: string | null
          file_size: number | null
          file_type: string | null
          format: string | null
          height: number | null
          id: string
          imported_at: string | null
          industry_tags: string[] | null
          is_active: boolean
          is_file_based: boolean
          layout_dna: Json
          license_expires_at: string | null
          metadata: Json
          name: string
          objective: string | null
          placeholders: Json | null
          platform: string | null
          popularity_score: number
          premium: boolean
          preview_url: string | null
          review_note: string | null
          review_status: string
          reviewed_at: string | null
          source: string
          source_id: string | null
          source_license: string | null
          submitted_by: string | null
          template_json: Json | null
          template_source: string
          thumbnail_url: string | null
          updated_at: string
          usage_count: number
          width: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "templates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      template_category_counts: {
        Args: { p_source?: string }
        Returns: {
          category: string
          count: number
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
