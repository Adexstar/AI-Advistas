-- Layer 8: Analytics & Marketing Intelligence Engine
-- Adds analytics_events (rich metric tracking), campaign_reports (exported files), and ai_insights (NL insights)

-- ============================================================
-- 1. analytics_events — every granular metric datapoint
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  campaign_id   UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_id   UUID,
  platform      TEXT NOT NULL DEFAULT 'manual',
  event_type    TEXT NOT NULL DEFAULT 'impression',
  metric_name   TEXT NOT NULL,
  metric_value  NUMERIC NOT NULL DEFAULT 0,
  currency      TEXT DEFAULT 'USD',
  metadata      JSONB DEFAULT '{}'::jsonb,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_workspace ON public.analytics_events(workspace_id);
CREATE INDEX idx_analytics_events_campaign ON public.analytics_events(campaign_id);
CREATE INDEX idx_analytics_events_platform ON public.analytics_events(platform);
CREATE INDEX idx_analytics_events_recorded ON public.analytics_events(recorded_at DESC);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace analytics events"
  ON public.analytics_events FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- 2. campaign_reports — stored generated reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaign_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL,
  report_type   TEXT NOT NULL DEFAULT 'campaign',
  title         TEXT NOT NULL,
  description   TEXT,
  file_url      TEXT,
  file_format   TEXT DEFAULT 'pdf',
  generated_by  UUID NOT NULL,
  parameters    JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_reports_workspace ON public.campaign_reports(workspace_id);
CREATE INDEX idx_campaign_reports_campaign ON public.campaign_reports(campaign_id);

ALTER TABLE public.campaign_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace reports"
  ON public.campaign_reports FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert reports"
  ON public.campaign_reports FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- 3. ai_insights — natural-language insights from analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  campaign_id   UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  insight_type  TEXT NOT NULL DEFAULT 'trend',
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  priority      TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('critical','high','medium','low','info')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','dismissed','applied')),
  category      TEXT DEFAULT 'general',
  supporting_data JSONB DEFAULT '{}'::jsonb,
  confidence    NUMERIC DEFAULT 80,
  source        TEXT DEFAULT 'analytics',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_workspace ON public.ai_insights(workspace_id);
CREATE INDEX idx_ai_insights_campaign ON public.ai_insights(campaign_id);
CREATE INDEX idx_ai_insights_priority ON public.ai_insights(priority);
CREATE INDEX idx_ai_insights_status ON public.ai_insights(status);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace insights"
  ON public.ai_insights FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert insights"
  ON public.ai_insights FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their workspace insights"
  ON public.ai_insights FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- RPC: Get analytics overview for a workspace
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_analytics_overview(
  p_workspace_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'total_campaigns', (SELECT COUNT(*) FROM public.campaigns WHERE workspace_id = p_workspace_id),
    'active_campaigns', (SELECT COUNT(*) FROM public.campaigns WHERE workspace_id = p_workspace_id AND status = 'active'),
    'total_spend', COALESCE((SELECT SUM(metric_value) FROM public.analytics_events WHERE workspace_id = p_workspace_id AND metric_name = 'spend' AND recorded_at >= NOW() - (p_days || ' days')::INTERVAL), 0),
    'total_revenue', COALESCE((SELECT SUM(metric_value) FROM public.analytics_events WHERE workspace_id = p_workspace_id AND metric_name = 'revenue' AND recorded_at >= NOW() - (p_days || ' days')::INTERVAL), 0),
    'total_impressions', COALESCE((SELECT SUM(metric_value) FROM public.analytics_events WHERE workspace_id = p_workspace_id AND metric_name = 'impressions' AND recorded_at >= NOW() - (p_days || ' days')::INTERVAL), 0),
    'total_clicks', COALESCE((SELECT SUM(metric_value) FROM public.analytics_events WHERE workspace_id = p_workspace_id AND metric_name = 'clicks' AND recorded_at >= NOW() - (p_days || ' days')::INTERVAL), 0),
    'total_conversions', COALESCE((SELECT SUM(metric_value) FROM public.analytics_events WHERE workspace_id = p_workspace_id AND metric_name = 'conversions' AND recorded_at >= NOW() - (p_days || ' days')::INTERVAL), 0)
  ) INTO result;
  RETURN result;
END;
$$;

-- ============================================================
-- RPC: Get timeline for a campaign
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_campaign_timeline(
  p_campaign_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'date', d.date,
      'impressions', COALESCE(SUM(CASE WHEN ae.metric_name = 'impressions' THEN ae.metric_value ELSE 0 END), 0),
      'clicks', COALESCE(SUM(CASE WHEN ae.metric_name = 'clicks' THEN ae.metric_value ELSE 0 END), 0),
      'conversions', COALESCE(SUM(CASE WHEN ae.metric_name = 'conversions' THEN ae.metric_value ELSE 0 END), 0),
      'revenue', COALESCE(SUM(CASE WHEN ae.metric_name = 'revenue' THEN ae.metric_value ELSE 0 END), 0),
      'spend', COALESCE(SUM(CASE WHEN ae.metric_name = 'spend' THEN ae.metric_value ELSE 0 END), 0)
    )
    ORDER BY d.date
  ) INTO result
  FROM (
    SELECT DISTINCT DATE(recorded_at) as date
    FROM public.analytics_events
    WHERE campaign_id = p_campaign_id
      AND recorded_at >= NOW() - (p_days || ' days')::INTERVAL
  ) d
  LEFT JOIN public.analytics_events ae ON DATE(ae.recorded_at) = d.date AND ae.campaign_id = p_campaign_id;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ============================================================
-- RPC: Get active insights for a workspace
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_workspace_insights(
  p_workspace_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'id', i.id,
      'insight_type', i.insight_type,
      'title', i.title,
      'description', i.description,
      'priority', i.priority,
      'category', i.category,
      'confidence', i.confidence,
      'created_at', i.created_at
    )
    ORDER BY
      CASE i.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      i.created_at DESC
    LIMIT p_limit
  ) INTO result
  FROM public.ai_insights i
  WHERE i.workspace_id = p_workspace_id AND i.status = 'active';
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ============================================================
-- RPC: Record an analytics event
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_analytics_event(
  p_workspace_id UUID,
  p_campaign_id UUID DEFAULT NULL,
  p_creative_id UUID DEFAULT NULL,
  p_platform TEXT DEFAULT 'manual',
  p_event_type TEXT DEFAULT 'impression',
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.analytics_events (workspace_id, campaign_id, creative_id, platform, event_type, metric_name, metric_value, metadata)
  VALUES (p_workspace_id, p_campaign_id, p_creative_id, p_platform, p_event_type, p_metric_name, p_metric_value, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
