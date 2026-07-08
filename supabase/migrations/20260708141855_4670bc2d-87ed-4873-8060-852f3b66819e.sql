
CREATE TABLE public.design_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  design_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  ai_assisted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_versions TO authenticated;
GRANT ALL ON public.design_versions TO service_role;
ALTER TABLE public.design_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own design versions" ON public.design_versions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX design_versions_design_idx ON public.design_versions(design_id, version DESC);

CREATE TABLE public.design_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  design_id UUID NOT NULL,
  hierarchy_score INTEGER NOT NULL DEFAULT 0,
  readability_score INTEGER NOT NULL DEFAULT 0,
  branding_score INTEGER NOT NULL DEFAULT 0,
  accessibility_score INTEGER NOT NULL DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_scores TO authenticated;
GRANT ALL ON public.design_scores TO service_role;
ALTER TABLE public.design_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own design scores" ON public.design_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX design_scores_design_uidx ON public.design_scores(design_id);
CREATE TRIGGER update_design_scores_updated_at BEFORE UPDATE ON public.design_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.design_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  design_id UUID NOT NULL,
  suggestion TEXT NOT NULL,
  reasoning TEXT,
  confidence INTEGER NOT NULL DEFAULT 80,
  accepted BOOLEAN,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_suggestions TO authenticated;
GRANT ALL ON public.design_suggestions TO service_role;
ALTER TABLE public.design_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own design suggestions" ON public.design_suggestions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX design_suggestions_design_idx ON public.design_suggestions(design_id, created_at DESC);

CREATE TABLE public.design_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  design_id UUID NOT NULL,
  author UUID NOT NULL,
  comment TEXT NOT NULL,
  position JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_comments TO authenticated;
GRANT ALL ON public.design_comments TO service_role;
ALTER TABLE public.design_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own design comments" ON public.design_comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX design_comments_design_idx ON public.design_comments(design_id, created_at DESC);
