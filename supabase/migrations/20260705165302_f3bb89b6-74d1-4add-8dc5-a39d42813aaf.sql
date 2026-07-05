
-- 1. ai_context
CREATE TABLE public.ai_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  brand_id uuid,
  active_brandkit_id uuid,
  active_category text,
  active_platform text,
  active_objective text,
  current_campaign_id uuid,
  current_goal text,
  session_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_context TO authenticated;
GRANT ALL ON public.ai_context TO service_role;
ALTER TABLE public.ai_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai_context" ON public.ai_context FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ai_context_updated BEFORE UPDATE ON public.ai_context
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. decisions
CREATE TABLE public.decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page text,
  trigger_source text,
  category text,
  campaign_id uuid,
  signal text,
  action text,
  reasoning text,
  confidence numeric,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decisions TO authenticated;
GRANT ALL ON public.decisions TO service_role;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own decisions" ON public.decisions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_decisions_user_status ON public.decisions(user_id, status);

-- 3. category_playbooks
CREATE TABLE public.category_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  focus_areas jsonb DEFAULT '[]'::jsonb,
  tone_guidance text,
  winning_hooks jsonb DEFAULT '[]'::jsonb,
  headline_patterns jsonb DEFAULT '[]'::jsonb,
  cta_patterns jsonb DEFAULT '[]'::jsonb,
  audience_patterns jsonb DEFAULT '[]'::jsonb,
  visual_rules jsonb DEFAULT '{}'::jsonb,
  offer_rules jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.category_playbooks TO authenticated;
GRANT ALL ON public.category_playbooks TO service_role;
ALTER TABLE public.category_playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read playbooks" ON public.category_playbooks FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_playbooks_updated BEFORE UPDATE ON public.category_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.category_playbooks (category, tone_guidance) VALUES
  ('Real Estate','Aspirational, trustworthy, location-driven'),
  ('Beauty','Sensory, confident, transformation-focused'),
  ('Fashion','Trendy, bold, identity-driven'),
  ('SaaS','Clear, benefit-led, ROI-focused'),
  ('Restaurant','Appetizing, warm, local'),
  ('Fitness','Energetic, motivating, results-driven'),
  ('Education','Encouraging, credible, outcome-focused'),
  ('Healthcare','Reassuring, professional, empathetic'),
  ('Automotive','Powerful, aspirational, feature-driven'),
  ('E-commerce','Urgent, benefit-first, offer-driven');

-- 4. campaign_memory
CREATE TABLE public.campaign_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id uuid,
  category_id uuid,
  winning_templates jsonb DEFAULT '[]'::jsonb,
  best_copy jsonb DEFAULT '[]'::jsonb,
  best_brand_elements jsonb DEFAULT '{}'::jsonb,
  failed_templates jsonb DEFAULT '[]'::jsonb,
  failed_copy jsonb DEFAULT '[]'::jsonb,
  results_summary jsonb DEFAULT '{}'::jsonb,
  last_learning timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_memory TO authenticated;
GRANT ALL ON public.campaign_memory TO service_role;
ALTER TABLE public.campaign_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memory" ON public.campaign_memory FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_memory_updated BEFORE UPDATE ON public.campaign_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. ai_jobs
CREATE TABLE public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_jobs TO authenticated;
GRANT ALL ON public.ai_jobs TO service_role;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai_jobs" ON public.ai_jobs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ai_jobs_user_status ON public.ai_jobs(user_id, status);

-- 6. automation_rules
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger jsonb DEFAULT '{}'::jsonb,
  condition jsonb DEFAULT '{}'::jsonb,
  action jsonb DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own automation_rules" ON public.automation_rules FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_automation_updated BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
