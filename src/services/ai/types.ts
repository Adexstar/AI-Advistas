export type AIMode = "manual" | "assisted" | "smart" | "growth";

export interface AIContextRow {
  id: string;
  user_id: string;
  brand_id: string | null;
  active_brandkit_id: string | null;
  active_category: string | null;
  active_platform: string | null;
  active_objective: string | null;
  current_campaign_id: string | null;
  current_goal: string | null;
  session_id: string | null;
  updated_at: string;
}

export interface Decision {
  id: string;
  user_id: string;
  page: string | null;
  trigger_source: string | null;
  category: string | null;
  campaign_id: string | null;
  signal: string | null;
  action: string | null;
  reasoning: string | null;
  confidence: number | null;
  status: "pending" | "accepted" | "dismissed" | "applied" | string;
  created_at: string;
  resolved_at: string | null;
}

export interface CategoryPlaybook {
  id: string;
  category: string;
  focus_areas: string[];
  tone_guidance: string | null;
  winning_hooks: string[];
  headline_patterns: string[];
  cta_patterns: string[];
  audience_patterns: string[];
  visual_rules: Record<string, unknown>;
  offer_rules: Record<string, unknown>;
  updated_at: string;
}

export interface CampaignMemory {
  id: string;
  user_id: string;
  brand_id: string | null;
  category_id: string | null;
  winning_templates: unknown[];
  best_copy: unknown[];
  best_brand_elements: Record<string, unknown>;
  failed_templates: unknown[];
  failed_copy: unknown[];
  results_summary: Record<string, unknown>;
  last_learning: string | null;
  updated_at: string;
}

export type AIJobType =
  | "generate_headline"
  | "rewrite_copy"
  | "improve_layout"
  | "audience_recommendation"
  | "budget_recommendation"
  | "creative_variation"
  | string;

export interface AIJob {
  id: string;
  user_id: string;
  job_type: AIJobType;
  status: "queued" | "running" | "completed" | "failed" | string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  trigger: Record<string, unknown>;
  condition: Record<string, unknown>;
  action: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
