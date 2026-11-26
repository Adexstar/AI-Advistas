-- Ad Studio: one row per session (prompt, files, style, format, plan, status,
-- result) and the styles a person saves. Owner-only through row-level security.

CREATE TABLE IF NOT EXISTS public.ad_studio_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled ad',
  prompt text NOT NULL DEFAULT '',
  format text NOT NULL DEFAULT 'story'
    CHECK (format IN ('feed', 'story', 'video', 'carousel', 'banner')),
  style_id text,
  use_brand_kit boolean NOT NULL DEFAULT true,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  plan jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'planning', 'plan', 'building', 'ready', 'failed')),
  result jsonb,
  design_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_studio_sessions_user_updated_idx
  ON public.ad_studio_sessions (user_id, updated_at DESC);

ALTER TABLE public.ad_studio_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ad studio sessions" ON public.ad_studio_sessions;
DROP POLICY IF EXISTS "Users insert own ad studio sessions" ON public.ad_studio_sessions;
DROP POLICY IF EXISTS "Users update own ad studio sessions" ON public.ad_studio_sessions;
DROP POLICY IF EXISTS "Users delete own ad studio sessions" ON public.ad_studio_sessions;

CREATE POLICY "Users read own ad studio sessions"
  ON public.ad_studio_sessions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- A session may only point at a design the same person owns.
CREATE POLICY "Users insert own ad studio sessions"
  ON public.ad_studio_sessions FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (design_id IS NULL OR EXISTS (
      SELECT 1 FROM public.ads WHERE ads.id = design_id AND ads.user_id = (SELECT auth.uid())
    ))
  );

CREATE POLICY "Users update own ad studio sessions"
  ON public.ad_studio_sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (design_id IS NULL OR EXISTS (
      SELECT 1 FROM public.ads WHERE ads.id = design_id AND ads.user_id = (SELECT auth.uid())
    ))
  );

CREATE POLICY "Users delete own ad studio sessions"
  ON public.ad_studio_sessions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS ad_studio_sessions_updated ON public.ad_studio_sessions;
CREATE TRIGGER ad_studio_sessions_updated
  BEFORE UPDATE ON public.ad_studio_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ad_studio_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_url text,
  pacing text NOT NULL DEFAULT 'steady' CHECK (pacing IN ('fast', 'steady', 'slow')),
  text_style text NOT NULL DEFAULT '',
  scene_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  direction text NOT NULL DEFAULT '',
  analysis jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_studio_styles_user_idx
  ON public.ad_studio_styles (user_id, created_at DESC);

ALTER TABLE public.ad_studio_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ad studio styles" ON public.ad_studio_styles;
DROP POLICY IF EXISTS "Users insert own ad studio styles" ON public.ad_studio_styles;
DROP POLICY IF EXISTS "Users update own ad studio styles" ON public.ad_studio_styles;
DROP POLICY IF EXISTS "Users delete own ad studio styles" ON public.ad_studio_styles;

CREATE POLICY "Users read own ad studio styles"
  ON public.ad_studio_styles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own ad studio styles"
  ON public.ad_studio_styles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own ad studio styles"
  ON public.ad_studio_styles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users delete own ad studio styles"
  ON public.ad_studio_styles FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS ad_studio_styles_updated ON public.ad_studio_styles;
CREATE TRIGGER ad_studio_styles_updated
  BEFORE UPDATE ON public.ad_studio_styles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
