export type CampaignStatus = 'draft' | 'planning' | 'creative_ready' | 'publishing' | 'running' | 'optimizing' | 'completed' | 'archived';

export type CampaignObjective = 'awareness' | 'traffic' | 'leads' | 'sales' | 'engagement';

export interface CampaignSnapshot {
  id: string;
  user_id: string;
  name: string;
  status: CampaignStatus;
  objective: CampaignObjective;
  platform: string | null;
  platforms: string[];
  budget: number;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  roas: number;
  campaign_category: string | null;
  health_score: number;
  confidence: number;
  target_audience: Record<string, unknown>;
  goals: unknown[];
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CampaignAsset {
  id: string;
  campaign_id: string;
  user_id: string;
  asset_type: 'template' | 'image' | 'video' | 'document' | 'brand_kit' | 'landing_page' | 'post' | 'ad' | 'report';
  asset_id: string | null;
  asset_url: string | null;
  asset_name: string | null;
  asset_metadata: Record<string, unknown>;
  added_at: string;
}

export interface CampaignVersion {
  id: string;
  campaign_id: string;
  user_id: string;
  version_number: number;
  label: string | null;
  description: string | null;
  snapshot: CampaignSnapshot;
  created_at: string;
}

export interface CampaignEvent {
  id: string;
  campaign_id: string;
  user_id: string;
  event_type: CampaignEventType;
  event_label: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  actor: string;
  created_at: string;
}

export type CampaignEventType =
  | 'campaign_created'
  | 'campaign_status_changed'
  | 'template_selected'
  | 'creative_edited'
  | 'headline_changed'
  | 'budget_updated'
  | 'audience_updated'
  | 'platform_updated'
  | 'published'
  | 'paused'
  | 'resumed'
  | 'budget_increased'
  | 'budget_decreased'
  | 'restarted'
  | 'finished'
  | 'archived'
  | 'unarchived'
  | 'version_created'
  | 'version_restored'
  | 'asset_added'
  | 'asset_removed'
  | 'recommendation_applied'
  | 'rule_triggered'
  | 'optimized'
  | string;

export interface CampaignMetric {
  id: string;
  campaign_id: string;
  user_id: string;
  recorded_at: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  roas: number;
  frequency: number;
  cpc: number;
  cpm: number;
  cpa: number;
  reach: number;
  metrics_source: string;
}

export interface CampaignRecommendation {
  id: string;
  campaign_id: string;
  user_id: string;
  recommendation_type: string;
  title: string;
  description: string | null;
  confidence: number;
  estimated_impact: string | null;
  estimated_improvement: number;
  action_label: string | null;
  action_data: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'dismissed' | 'applied';
  dismissed_at: string | null;
  applied_at: string | null;
  created_at: string;
}

export interface CampaignMemoryEntry {
  id: string;
  campaign_id: string;
  user_id: string;
  memory_type: 'win' | 'fail' | 'insight' | 'trend';
  category: string | null;
  key_insight: string | null;
  metric_name: string | null;
  metric_value: number | null;
  metric_change: number | null;
  winning_elements: Record<string, unknown>;
  failed_elements: Record<string, unknown>;
  recommendation: string | null;
  created_at: string;
}

export interface CampaignAutomationQueueItem {
  id: string;
  campaign_id: string;
  user_id: string;
  rule_id: string | null;
  action_type: string;
  action_params: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  reason: string | null;
  executed_at: string | null;
  result: Record<string, unknown>;
  created_at: string;
}

export interface CampaignHealth {
  overall: number;
  creative_quality: number;
  audience_match: number;
  budget_efficiency: number;
  optimization_level: number;
}

export interface AutomationRuleConfig {
  id: string;
  name: string;
  trigger: {
    type: 'cpa_exceeded' | 'roas_above' | 'ctr_dropped' | 'creative_fatigue' | 'budget_depleted' | 'schedule';
    threshold?: number;
    field?: string;
    operator?: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  };
  condition: Record<string, unknown>;
  action: {
    type: 'pause_campaign' | 'increase_budget' | 'decrease_budget' | 'notify' | 'generate_creatives' | 'schedule_ads' | 'adjust_targeting';
    value?: number;
    message?: string;
  };
  enabled: boolean;
  created_at: string;
}

export interface SmartCampaignBuilderState {
  step: number;
  name: string;
  brand_id: string | null;
  objective: CampaignObjective | null;
  audience: {
    description: string;
    demographics: string;
    interests: string[];
    locations: string[];
  };
  budget: number;
  platforms: string[];
  start_date: string;
  end_date: string;
  ai_suggestions: string[];
}
