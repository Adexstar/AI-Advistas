
-- 1. Extend templates
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS template_json jsonb,
  ADD COLUMN IF NOT EXISTS ai_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS industry_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS brand_compatible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS popularity_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'advista',
  ADD COLUMN IF NOT EXISTS premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_platform ON public.templates(platform);
CREATE INDEX IF NOT EXISTS idx_templates_objective ON public.templates(objective);
CREATE INDEX IF NOT EXISTS idx_templates_ai_tags ON public.templates USING gin(ai_tags);
CREATE INDEX IF NOT EXISTS idx_templates_industry_tags ON public.templates USING gin(industry_tags);

-- Allow public read on templates library (in addition to existing policies)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='templates' AND policyname='Public can view templates') THEN
    CREATE POLICY "Public can view templates" ON public.templates FOR SELECT USING (true);
  END IF;
END $$;
GRANT SELECT ON public.templates TO anon;

-- 2. template_layers
CREATE TABLE IF NOT EXISTS public.template_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  layer_type text NOT NULL,
  variable_key text,
  x numeric,
  y numeric,
  width numeric,
  height numeric,
  rotation numeric DEFAULT 0,
  z_index integer NOT NULL DEFAULT 0,
  effects jsonb NOT NULL DEFAULT '{}'::jsonb,
  animation jsonb NOT NULL DEFAULT '{}'::jsonb,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  editable boolean NOT NULL DEFAULT true,
  brand_replaceable boolean NOT NULL DEFAULT false,
  ai_replaceable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.template_layers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_layers TO authenticated;
GRANT ALL ON public.template_layers TO service_role;
ALTER TABLE public.template_layers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view template layers" ON public.template_layers FOR SELECT USING (true);
CREATE POLICY "Owners manage template layers" ON public.template_layers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_layers.template_id AND t.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_layers.template_id AND t.created_by = auth.uid()));
CREATE TRIGGER trg_template_layers_updated_at BEFORE UPDATE ON public.template_layers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_template_layers_template ON public.template_layers(template_id);

-- 3. template_versions
CREATE TABLE IF NOT EXISTS public.template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  template_json jsonb NOT NULL,
  layers jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_versions TO authenticated;
GRANT ALL ON public.template_versions TO service_role;
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view template versions" ON public.template_versions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_versions.template_id AND (t.created_by = auth.uid() OR t.created_by IS NULL)));
CREATE POLICY "Owners write template versions" ON public.template_versions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_versions.template_id AND t.created_by = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_template_versions_template ON public.template_versions(template_id, version_number DESC);

-- 4. template_usage_events
CREATE TABLE IF NOT EXISTS public.template_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id uuid,
  event text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.template_usage_events TO authenticated;
GRANT ALL ON public.template_usage_events TO service_role;
ALTER TABLE public.template_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage events" ON public.template_usage_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own usage events" ON public.template_usage_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_template_usage_template ON public.template_usage_events(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_user ON public.template_usage_events(user_id);
