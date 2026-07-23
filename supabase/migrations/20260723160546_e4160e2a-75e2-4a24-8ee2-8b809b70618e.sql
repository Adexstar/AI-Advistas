
-- publishing_jobs
CREATE TABLE public.publishing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  provider TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'social',
  status TEXT NOT NULL DEFAULT 'queued',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  external_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishing_jobs TO authenticated;
GRANT ALL ON public.publishing_jobs TO service_role;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their publishing jobs" ON public.publishing_jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_publishing_jobs_campaign ON public.publishing_jobs(campaign_id);
CREATE INDEX idx_publishing_jobs_status ON public.publishing_jobs(status);
CREATE TRIGGER trg_publishing_jobs_updated BEFORE UPDATE ON public.publishing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- platform_connections
CREATE TABLE public.platform_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  provider TEXT NOT NULL,
  account_name TEXT,
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_connections TO authenticated;
GRANT ALL ON public.platform_connections TO service_role;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their platform connections" ON public.platform_connections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_platform_connections_updated BEFORE UPDATE ON public.platform_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- publishing_history
CREATE TABLE public.publishing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.publishing_jobs(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishing_history TO authenticated;
GRANT ALL ON public.publishing_history TO service_role;
ALTER TABLE public.publishing_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view their publishing history" ON public.publishing_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_publishing_history_campaign ON public.publishing_history(campaign_id);
