
-- ============================================================================
-- AdVista Layer 4 — Campaign Intelligence Engine
-- ============================================================================
-- Extends the campaigns table with new lifecycle fields
-- Creates supporting tables for campaign intelligence features

-- 1. Extend campaigns table with intelligence fields
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS optimization_level integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS creative_quality_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS audience_match_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_efficiency_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_category text,
  ADD COLUMN IF NOT EXISTS goals jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_audience jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_source_campaign_id uuid,
  ADD COLUMN IF NOT EXISTS last_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_optimized_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2. campaign_assets — connect any asset (template, image, video, doc) to a campaign
CREATE TABLE IF NOT EXISTS public.campaign_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type text NOT NULL DEFAULT 'template',
  asset_id uuid,
  asset_url text,
  asset_name text,
  asset_metadata jsonb DEFAULT '{}'::jsonb,
  added_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_assets TO authenticated;
GRANT ALL ON public.campaign_assets TO service_role;
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaign_assets" ON public.campaign_assets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaign_assets_campaign ON public.campaign_assets(campaign_id);
CREATE INDEX idx_campaign_assets_type ON public.campaign_assets(asset_type);

-- 3. campaign_versions — Git-like version snapshots
CREATE TABLE IF NOT EXISTS public.campaign_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  label text,
  description text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, version_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_versions TO authenticated;
GRANT ALL ON public.campaign_versions TO service_role;
ALTER TABLE public.campaign_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaign_versions" ON public.campaign_versions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaign_versions_campaign ON public.campaign_versions(campaign_id, version_number DESC);

-- 4. campaign_events — immutable timeline of every event
CREATE TABLE IF NOT EXISTS public.campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_label text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  actor text DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_events TO authenticated;
GRANT ALL ON public.campaign_events TO service_role;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaign_events" ON public.campaign_events
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaign_events_campaign ON public.campaign_events(campaign_id, created_at DESC);
CREATE INDEX idx_campaign_events_type ON public.campaign_events(event_type);

-- 5. campaign_metrics — time-series performance data
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  frequency numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  cpm numeric DEFAULT 0,
  cpa numeric DEFAULT 0,
  reach integer DEFAULT 0,
  metrics_source text DEFAULT 'manual'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_metrics TO authenticated;
GRANT ALL ON public.campaign_metrics TO service_role;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaign_metrics" ON public.campaign_metrics
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaign_metrics_campaign_time ON public.campaign_metrics(campaign_id, recorded_at DESC);

-- 6. campaign_recommendations — AI-generated recommendations
CREATE TABLE IF NOT EXISTS public.campaign_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text,
  confidence numeric NOT NULL DEFAULT 0,
  estimated_impact text,
  estimated_improvement numeric DEFAULT 0,
  action_label text,
  action_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  dismissed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_recommendations TO authenticated;
GRANT ALL ON public.campaign_recommendations TO service_role;
ALTER TABLE public.campaign_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaign_recommendations" ON public.campaign_recommendations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaign_recommendations_campaign ON public.campaign_recommendations(campaign_id, created_at DESC);
CREATE INDEX idx_campaign_recommendations_status ON public.campaign_recommendations(status);

-- 7. campaign_memory_entries — per-campaign learning records
CREATE TABLE IF NOT EXISTS public.campaign_memory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type text NOT NULL,
  category text,
  key_insight text,
  metric_name text,
  metric_value numeric,
  metric_change numeric,
  winning_elements jsonb DEFAULT '{}'::jsonb,
  failed_elements jsonb DEFAULT '{}'::jsonb,
  recommendation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_memory_entries TO authenticated;
GRANT ALL ON public.campaign_memory_entries TO service_role;
ALTER TABLE public.campaign_memory_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaign_memory_entries" ON public.campaign_memory_entries
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaign_memory_entries_campaign ON public.campaign_memory_entries(campaign_id);
CREATE INDEX idx_campaign_memory_entries_type ON public.campaign_memory_entries(memory_type);

-- 8. campaign_automation_queue — execution queue for automation rules
CREATE TABLE IF NOT EXISTS public.campaign_automation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  action_params jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  executed_at timestamptz,
  result jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_automation_queue TO authenticated;
GRANT ALL ON public.campaign_automation_queue TO service_role;
ALTER TABLE public.campaign_automation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaign_automation_queue" ON public.campaign_automation_queue
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaign_automation_queue_status ON public.campaign_automation_queue(status);
CREATE INDEX idx_campaign_automation_queue_campaign ON public.campaign_automation_queue(campaign_id);

-- Realtime subscriptions
ALTER TABLE public.campaign_assets REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_versions REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_events REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_recommendations REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_memory_entries REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_automation_queue REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_memory_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_automation_queue;

-- Helper function: log campaign event
CREATE OR REPLACE FUNCTION public.log_campaign_event(
  p_campaign_id uuid,
  p_user_id uuid,
  p_event_type text,
  p_event_label text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_actor text DEFAULT 'user'
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.campaign_events (campaign_id, user_id, event_type, event_label, description, metadata, actor)
  VALUES (p_campaign_id, p_user_id, p_event_type, p_event_label, p_description, p_metadata, p_actor)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: create campaign version snapshot
CREATE OR REPLACE FUNCTION public.create_campaign_version(
  p_campaign_id uuid,
  p_user_id uuid,
  p_label text DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS integer AS $$
DECLARE
  v_next_version integer;
  v_snapshot jsonb;
  v_campaign_record public.campaigns;
BEGIN
  SELECT * INTO v_campaign_record FROM public.campaigns WHERE id = p_campaign_id;
  
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM public.campaign_versions WHERE campaign_id = p_campaign_id;
  
  v_snapshot := row_to_json(v_campaign_record)::jsonb;
  
  INSERT INTO public.campaign_versions (campaign_id, user_id, version_number, label, description, snapshot)
  VALUES (p_campaign_id, p_user_id, v_next_version, p_label, p_description, v_snapshot);
  
  RETURN v_next_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
