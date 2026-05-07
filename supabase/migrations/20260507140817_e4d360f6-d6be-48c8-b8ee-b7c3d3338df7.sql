
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ============ TIMESTAMP FN ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ AD_TEMPLATES (catalog) ============
CREATE TABLE public.ad_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  goal text,
  platforms text[] DEFAULT '{}',
  is_popular boolean NOT NULL DEFAULT false,
  template_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_source text NOT NULL DEFAULT 'internal',
  external_id text,
  canvas_data jsonb,
  customizable_fields jsonb,
  preview_url text,
  thumbnail_url text,
  category text,
  tags text[] DEFAULT '{}',
  industry text,
  performance_score numeric,
  difficulty_level text,
  estimated_setup_time_minutes integer,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates readable by all" ON public.ad_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated insert templates" ON public.ad_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins update templates" ON public.ad_templates FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete templates" ON public.ad_templates FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ad_templates_updated BEFORE UPDATE ON public.ad_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ad_templates SET usage_count = COALESCE(usage_count,0)+1 WHERE id = template_id;
$$;

-- ============ TEMPLATES (file-based) ============
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  file_path text,
  file_type text,
  file_size bigint,
  dimensions jsonb DEFAULT '{}'::jsonb,
  is_file_based boolean NOT NULL DEFAULT true,
  template_source text NOT NULL DEFAULT 'internal',
  preview_url text,
  thumbnail_url text,
  canvas_data jsonb,
  placeholders jsonb,
  external_id text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates files readable" ON public.templates FOR SELECT USING (true);
CREATE POLICY "Auth insert templates files" ON public.templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins manage templates files" ON public.templates FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ADS (saved ads tied to a template) ============
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ads" ON public.ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ads" ON public.ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ads" ON public.ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own ads" ON public.ads FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_ads_updated BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER_ADS (visual editor saves) ============
CREATE TABLE public.user_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_path text,
  export_format text DEFAULT 'png',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own user_ads" ON public.user_ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own user_ads" ON public.user_ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own user_ads" ON public.user_ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own user_ads" ON public.user_ads FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_ads_updated BEFORE UPDATE ON public.user_ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ GENERATED_ADS (AI generated) ============
CREATE TABLE public.generated_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_name text NOT NULL,
  ad_type text NOT NULL,
  platform text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  generation_prompt text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own generated_ads" ON public.generated_ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own generated_ads" ON public.generated_ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own generated_ads" ON public.generated_ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own generated_ads" ON public.generated_ads FOR DELETE USING (auth.uid() = user_id);

-- ============ AD_SIMULATIONS ============
CREATE TABLE public.ad_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad_id uuid,
  score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own simulations" ON public.ad_simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own simulations" ON public.ad_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ AI_SUGGESTIONS ============
CREATE TABLE public.ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid,
  suggestion_type text NOT NULL,
  suggestions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own suggestions" ON public.ai_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own suggestions" ON public.ai_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'flutterwave',
  provider_subscription_id text,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER_USAGE ============
CREATE TABLE public.user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  last_reset timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature)
);
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage" ON public.user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own usage" ON public.user_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own usage" ON public.user_usage FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_usage_updated BEFORE UPDATE ON public.user_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER_DASHBOARDS ============
CREATE TABLE public.user_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_dashboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own dashboard" ON public.user_dashboards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own dashboard" ON public.user_dashboards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own dashboard" ON public.user_dashboards FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_dashboards_updated BEFORE UPDATE ON public.user_dashboards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER_CANVAS_DRAFTS ============
CREATE TABLE public.user_canvas_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  template_id uuid,
  canvas_data jsonb,
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_canvas_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own draft" ON public.user_canvas_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own draft" ON public.user_canvas_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own draft" ON public.user_canvas_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own draft" ON public.user_canvas_drafts FOR DELETE USING (auth.uid() = user_id);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('ad_templates', 'ad_templates', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read ad_templates" ON storage.objects FOR SELECT USING (bucket_id = 'ad_templates');
CREATE POLICY "Auth upload ad_templates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ad_templates');
CREATE POLICY "Auth update ad_templates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ad_templates');
CREATE POLICY "Auth delete ad_templates" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ad_templates');
