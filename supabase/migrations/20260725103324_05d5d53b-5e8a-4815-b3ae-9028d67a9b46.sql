
CREATE TABLE IF NOT EXISTS public.provider_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  cache_key text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE (provider, cache_key)
);

CREATE INDEX IF NOT EXISTS provider_search_cache_expires_idx
  ON public.provider_search_cache (expires_at);

GRANT SELECT ON public.provider_search_cache TO authenticated;
GRANT ALL ON public.provider_search_cache TO service_role;

ALTER TABLE public.provider_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cache"
  ON public.provider_search_cache
  FOR SELECT
  TO authenticated
  USING (true);
