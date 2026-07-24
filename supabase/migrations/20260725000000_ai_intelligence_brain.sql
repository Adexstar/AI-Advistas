-- Layer 7 — AI Intelligence & Marketing Brain
-- Adds ai_feedback, prompt_templates tables
-- Extends ai_recommendations with explainability and learning fields
-- Extends category_playbooks with more granular industry patterns
-- Adds RPC functions for recommendation acceptance feedback loop

-- ============================================================
-- AI FEEDBACK — tracks every accept/reject/dismiss for learning
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES ai_recommendations(id) ON DELETE SET NULL,
  decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'headline','cta','image','layout','audience','budget','platform',
    'schedule','creative','copy','style','strategy','automation','other'
  )),
  source_label TEXT,
  action TEXT NOT NULL CHECK (action IN ('accepted','rejected','dismissed','applied','edited','viewed')),
  confidence NUMERIC DEFAULT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_source ON ai_feedback(source_type);
CREATE INDEX idx_ai_feedback_action ON ai_feedback(action);
CREATE INDEX idx_ai_feedback_created ON ai_feedback(created_at DESC);

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own feedback"
  ON ai_feedback FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- PROMPT TEMPLATES — reusable structured AI prompt patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  specialist TEXT NOT NULL CHECK (specialist IN (
    'creative_strategist','design_advisor','brand_guardian',
    'campaign_optimizer','analytics_expert','publishing_advisor',
    'general'
  )),
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  output_schema JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_user_defined BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  avg_confidence NUMERIC DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_specialist ON prompt_templates(specialist);
CREATE INDEX idx_prompt_templates_public ON prompt_templates(is_public) WHERE is_public = true;

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prompt templates"
  ON prompt_templates FOR ALL
  USING (user_id = auth.uid() OR is_public = true)
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Extend ai_recommendations with explainability fields
-- ============================================================
ALTER TABLE ai_recommendations
  ADD COLUMN IF NOT EXISTS specialist TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS expected_improvement NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS applied_data JSONB DEFAULT NULL;

-- ============================================================
-- Extend category_playbooks with richer industry patterns
-- ============================================================
ALTER TABLE category_playbooks
  ADD COLUMN IF NOT EXISTS color_palettes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS typography_rules JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS imagery_style TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS emotional_triggers TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_pillars TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS competitor_patterns JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS seasonality JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- RPC: record AI feedback and update learning
-- ============================================================
CREATE OR REPLACE FUNCTION record_ai_feedback(
  p_user_id UUID,
  p_source_type TEXT,
  p_action TEXT,
  p_confidence NUMERIC DEFAULT NULL,
  p_source_label TEXT DEFAULT NULL,
  p_recommendation_id UUID DEFAULT NULL,
  p_decision_id UUID DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_feedback_id UUID;
BEGIN
  INSERT INTO ai_feedback (
    user_id, source_type, source_label, action, confidence,
    recommendation_id, decision_id, context, metadata
  ) VALUES (
    p_user_id, p_source_type, p_source_label, p_action, p_confidence,
    p_recommendation_id, p_decision_id, p_context, p_metadata
  )
  RETURNING id INTO v_feedback_id;

  -- Update recommendation accepted/rejected count if applicable
  IF p_recommendation_id IS NOT NULL AND p_action IN ('accepted','applied') THEN
    UPDATE ai_recommendations
    SET
      status = CASE
        WHEN p_action = 'applied' THEN 'applied'
        ELSE 'accepted'
      END,
      accepted_at = CASE WHEN p_action IN ('accepted','applied') THEN now() ELSE accepted_at END
    WHERE id = p_recommendation_id;
  ELSIF p_recommendation_id IS NOT NULL AND p_action = 'rejected' THEN
    UPDATE ai_recommendations
    SET status = 'rejected', rejected_at = now()
    WHERE id = p_recommendation_id;
  END IF;

  RETURN v_feedback_id;
END;
$$;

-- ============================================================
-- RPC: get learning summary for a user (across all memory)
-- ============================================================
CREATE OR REPLACE FUNCTION get_ai_learning_summary(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  source_type TEXT,
  total_count BIGINT,
  accepted_count BIGINT,
  rejected_count BIGINT,
  applied_count BIGINT,
  avg_confidence NUMERIC,
  last_action TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.source_type,
    COUNT(*)::BIGINT AS total_count,
    COUNT(*) FILTER (WHERE f.action IN ('accepted','applied'))::BIGINT AS accepted_count,
    COUNT(*) FILTER (WHERE f.action = 'rejected')::BIGINT AS rejected_count,
    COUNT(*) FILTER (WHERE f.action = 'applied')::BIGINT AS applied_count,
    AVG(f.confidence)::NUMERIC AS avg_confidence,
    MAX(f.created_at)::TIMESTAMPTZ AS last_action
  FROM ai_feedback f
  WHERE f.user_id = p_user_id
  GROUP BY f.source_type
  ORDER BY total_count DESC
  LIMIT p_limit;
END;
$$;
