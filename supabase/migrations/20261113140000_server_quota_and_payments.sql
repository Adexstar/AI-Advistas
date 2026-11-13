-- Server-owned plan limits and payment records.
-- Users can read their counters. Only consume_quota and the service role can change them.

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users upsert own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users update own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.user_usage;

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  tx_ref text PRIMARY KEY,
  user_id uuid NOT NULL,
  plan text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  interval text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'pending',
  provider_transaction_id text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own checkouts" ON public.checkout_sessions;
CREATE POLICY "Users view own checkouts"
  ON public.checkout_sessions FOR SELECT
  USING (auth.uid() = user_id);

GRANT SELECT ON public.checkout_sessions TO authenticated;
GRANT ALL ON public.checkout_sessions TO service_role;

CREATE OR REPLACE FUNCTION public.consume_quota(p_feature text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  plan text;
  status text;
  period_end timestamptz;
  lim integer;
  used integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_feature NOT IN ('ai_generations', 'active_campaigns', 'template_downloads') THEN
    RAISE EXCEPTION 'unknown feature';
  END IF;

  SELECT s.plan, s.status, s.current_period_end
    INTO plan, status, period_end
  FROM public.subscriptions s
  WHERE s.user_id = uid;

  IF plan IS NULL OR status IS DISTINCT FROM 'active' OR period_end IS NULL OR period_end < now() THEN
    plan := 'free';
  END IF;

  lim := CASE plan
    WHEN 'pro' THEN CASE p_feature
      WHEN 'ai_generations' THEN 100
      WHEN 'active_campaigns' THEN 50
      ELSE 50
    END
    WHEN 'enterprise' THEN -1
    ELSE CASE p_feature
      WHEN 'ai_generations' THEN 5
      WHEN 'active_campaigns' THEN 3
      ELSE 2
    END
  END;

  INSERT INTO public.user_usage (user_id, feature, usage_count)
  VALUES (uid, p_feature, 0)
  ON CONFLICT (user_id, feature) DO NOTHING;

  SELECT usage_count INTO used
  FROM public.user_usage
  WHERE user_id = uid AND feature = p_feature
  FOR UPDATE;

  IF lim <> -1 AND used >= lim THEN
    RETURN jsonb_build_object('allowed', false, 'used', used, 'limit', lim);
  END IF;

  UPDATE public.user_usage
  SET usage_count = usage_count + 1
  WHERE user_id = uid AND feature = p_feature
  RETURNING usage_count INTO used;

  RETURN jsonb_build_object('allowed', true, 'used', used, 'limit', lim);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_quota(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_quota(text) TO authenticated, service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users read own brand files" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own brand files" ON storage.objects;
DROP POLICY IF EXISTS "Users update own brand files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own brand files" ON storage.objects;

CREATE POLICY "Users read own brand files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own brand files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own brand files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own brand files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
