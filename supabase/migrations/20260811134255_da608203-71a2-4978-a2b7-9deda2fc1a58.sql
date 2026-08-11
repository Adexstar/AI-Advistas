-- 1) system_settings (single row)
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  platform_name text NOT NULL DEFAULT 'AdVista',
  default_plan text NOT NULL DEFAULT 'free',
  signups_open boolean NOT NULL DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  default_autonomy text NOT NULL DEFAULT 'assisted',
  ai_model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  image_model text NOT NULL DEFAULT 'google/gemini-2.5-flash-image-preview',
  free_ai_credits integer NOT NULL DEFAULT 10,
  decision_log_retention_days integer NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system settings" ON public.system_settings
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert system settings" ON public.system_settings
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system settings" ON public.system_settings
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_system_settings_updated
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_settings (singleton) VALUES (true);

-- 2) template curation columns
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_by uuid,
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_templates_review_status ON public.templates (review_status);

-- keep public search limited to approved templates
CREATE OR REPLACE FUNCTION public.search_templates(p_query text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_platform text DEFAULT NULL::text, p_goal text DEFAULT NULL::text, p_industry text DEFAULT NULL::text, p_brand_compat text DEFAULT NULL::text, p_layout_style text DEFAULT NULL::text, p_emotion text DEFAULT NULL::text, p_brand_compatible boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 60)
 RETURNS SETOF public.templates
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT *
  FROM public.templates t
  WHERE t.is_active
    AND t.review_status = 'approved'
    AND (p_query IS NULL OR (
      t.name ILIKE '%'||p_query||'%'
      OR COALESCE(t.description,'') ILIKE '%'||p_query||'%'
      OR EXISTS (SELECT 1 FROM unnest(COALESCE(t.ai_tags, ARRAY[]::text[])) tag WHERE tag ILIKE '%'||p_query||'%')
      OR EXISTS (SELECT 1 FROM unnest(COALESCE(t.industry_tags, ARRAY[]::text[])) tag WHERE tag ILIKE '%'||p_query||'%')
    ))
    AND (p_category IS NULL OR t.category = p_category)
    AND (p_platform IS NULL OR t.platform = p_platform OR t.metadata->'recommended_platforms' ? p_platform)
    AND (p_goal IS NULL OR t.objective = p_goal OR t.metadata->'recommended_goal' ? p_goal)
    AND (p_industry IS NULL OR p_industry = ANY(COALESCE(t.industry_tags, ARRAY[]::text[])))
    AND (p_brand_compat IS NULL OR t.metadata->'brand_compatibility' ? p_brand_compat)
    AND (p_layout_style IS NULL OR t.metadata->>'layout_style' = p_layout_style OR t.layout_dna->>'layout_style' = p_layout_style)
    AND (p_emotion IS NULL OR t.metadata->>'emotion' = p_emotion)
    AND (p_brand_compatible IS NULL OR t.brand_compatible = p_brand_compatible)
  ORDER BY t.popularity_score DESC NULLS LAST, t.created_at DESC
  LIMIT p_limit;
$function$;

-- 3) admins can manage category playbooks
CREATE POLICY "Admins manage playbooks" ON public.category_playbooks
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) admin report helpers
CREATE OR REPLACE FUNCTION public.admin_overview_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT jsonb_build_object(
    'users_total', (SELECT count(*) FROM public.profiles),
    'users_prev', (SELECT count(*) FROM public.profiles WHERE created_at < now() - interval '30 days'),
    'users_new_30d', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '30 days'),
    'campaigns_total', (SELECT count(*) FROM public.campaigns),
    'campaigns_new_30d', (SELECT count(*) FROM public.campaigns WHERE created_at >= now() - interval '30 days'),
    'campaigns_prev_30d', (SELECT count(*) FROM public.campaigns WHERE created_at >= now() - interval '60 days' AND created_at < now() - interval '30 days'),
    'revenue_30d', (SELECT COALESCE(sum(revenue),0) FROM public.campaigns WHERE created_at >= now() - interval '30 days'),
    'revenue_prev_30d', (SELECT COALESCE(sum(revenue),0) FROM public.campaigns WHERE created_at >= now() - interval '60 days' AND created_at < now() - interval '30 days'),
    'templates_active', (SELECT count(*) FROM public.templates WHERE is_active),
    'templates_pending', (SELECT count(*) FROM public.templates WHERE review_status = 'pending'),
    'decisions_total', (SELECT count(*) FROM public.decisions),
    'mrr', (SELECT COALESCE(sum(CASE plan WHEN 'starter' THEN 19 WHEN 'pro' THEN 49 WHEN 'agency' THEN 99 ELSE 0 END),0)
            FROM public.subscriptions WHERE status = 'active')
  ) INTO r;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_user_growth(p_days integer DEFAULT 30)
RETURNS TABLE(day date, users bigint) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  WITH days AS (
    SELECT generate_series((now() - (p_days || ' days')::interval)::date, now()::date, interval '1 day')::date AS d
  )
  SELECT days.d, (SELECT count(*) FROM public.profiles p WHERE p.created_at::date <= days.d)::bigint
  FROM days ORDER BY days.d;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_plan_distribution()
RETURNS TABLE(plan text, users bigint) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  SELECT COALESCE(s.plan,'free')::text, count(*)::bigint
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.user_id AND s.status = 'active'
  GROUP BY 1 ORDER BY 2 DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_users(p_search text DEFAULT NULL, p_plan text DEFAULT NULL, p_status text DEFAULT NULL, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(
  user_id uuid, display_name text, email text, avatar_url text, plan text, status text,
  joined_at timestamptz, campaigns bigint, storage_bytes bigint, ai_credits bigint, last_active timestamptz, total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  WITH base AS (
    SELECT p.user_id, p.display_name, p.email, p.avatar_url,
           COALESCE(s.plan,'free')::text AS plan,
           COALESCE(s.status,'active')::text AS status,
           p.created_at AS joined_at,
           (SELECT count(*) FROM public.campaigns c WHERE c.user_id = p.user_id)::bigint AS campaigns,
           (SELECT COALESCE(sum(m.file_size),0) FROM public.media_assets m WHERE m.user_id = p.user_id)::bigint AS storage_bytes,
           (SELECT COALESCE(sum(u.usage_count),0) FROM public.user_usage u WHERE u.user_id = p.user_id)::bigint AS ai_credits,
           (SELECT max(a.created_at) FROM public.activity_logs a WHERE a.user_id = p.user_id) AS last_active
    FROM public.profiles p
    LEFT JOIN public.subscriptions s ON s.user_id = p.user_id AND s.status = 'active'
  ), filtered AS (
    SELECT * FROM base b
    WHERE (p_search IS NULL OR p_search = '' OR b.display_name ILIKE '%'||p_search||'%' OR b.email ILIKE '%'||p_search||'%')
      AND (p_plan IS NULL OR b.plan = p_plan)
      AND (p_status IS NULL OR b.status = p_status)
  )
  SELECT f.*, (SELECT count(*) FROM filtered)::bigint
  FROM filtered f
  ORDER BY f.joined_at DESC
  LIMIT p_limit OFFSET p_offset;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_user_detail(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT jsonb_build_object(
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.user_id = p_user_id),
    'subscription', (SELECT to_jsonb(s) FROM public.subscriptions s WHERE s.user_id = p_user_id AND s.status='active' LIMIT 1),
    'brands', (SELECT count(*) FROM public.brand_kits b WHERE b.user_id = p_user_id),
    'campaigns', (SELECT count(*) FROM public.campaigns c WHERE c.user_id = p_user_id),
    'templates_created', (SELECT count(*) FROM public.templates t WHERE t.created_by = p_user_id),
    'exports', (SELECT count(*) FROM public.user_ads u WHERE u.user_id = p_user_id),
    'storage_bytes', (SELECT COALESCE(sum(m.file_size),0) FROM public.media_assets m WHERE m.user_id = p_user_id),
    'activity', (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT a.action, a.description, a.created_at FROM public.activity_logs a
        WHERE a.user_id = p_user_id ORDER BY a.created_at DESC LIMIT 10) x)
  ) INTO r;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_decision_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.decisions),
    'approved', (SELECT count(*) FROM public.decisions WHERE status IN ('approved','accepted','applied')),
    'ignored', (SELECT count(*) FROM public.decisions WHERE status IN ('ignored','rejected','dismissed')),
    'pending', (SELECT count(*) FROM public.decisions WHERE status = 'pending'),
    'avg_confidence', (SELECT ROUND(COALESCE(avg(confidence),0)::numeric, 2) FROM public.decisions),
    'top_action', (SELECT action FROM public.decisions WHERE action IS NOT NULL GROUP BY action ORDER BY count(*) DESC LIMIT 1),
    'last_30d', (SELECT count(*) FROM public.decisions WHERE created_at >= now() - interval '30 days'),
    'prev_30d', (SELECT count(*) FROM public.decisions WHERE created_at >= now() - interval '60 days' AND created_at < now() - interval '30 days')
  ) INTO r;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_decisions(p_search text DEFAULT NULL, p_category text DEFAULT NULL, p_action text DEFAULT NULL, p_status text DEFAULT NULL, p_since timestamptz DEFAULT NULL, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid, created_at timestamptz, user_id uuid, user_name text, category text, page text,
  trigger_source text, signal text, action text, reasoning text, confidence numeric, status text, campaign_id uuid, campaign_name text, total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  WITH filtered AS (
    SELECT d.id, d.created_at, d.user_id,
           COALESCE(p.display_name, p.email, 'Unknown')::text AS user_name,
           d.category, d.page, d.trigger_source, d.signal, d.action, d.reasoning, d.confidence, d.status,
           d.campaign_id, c.name::text AS campaign_name
    FROM public.decisions d
    LEFT JOIN public.profiles p ON p.user_id = d.user_id
    LEFT JOIN public.campaigns c ON c.id = d.campaign_id
    WHERE (p_search IS NULL OR p_search = '' OR d.action ILIKE '%'||p_search||'%' OR COALESCE(d.reasoning,'') ILIKE '%'||p_search||'%' OR COALESCE(d.signal,'') ILIKE '%'||p_search||'%')
      AND (p_category IS NULL OR d.category = p_category)
      AND (p_action IS NULL OR d.action = p_action)
      AND (p_status IS NULL OR d.status = p_status)
      AND (p_since IS NULL OR d.created_at >= p_since)
  )
  SELECT f.*, (SELECT count(*) FROM filtered)::bigint
  FROM filtered f ORDER BY f.created_at DESC LIMIT p_limit OFFSET p_offset;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_action_trends()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT jsonb_build_object(
    'trending', (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
      SELECT d.action, count(*)::bigint AS uses,
             count(*) FILTER (WHERE d.created_at >= now() - interval '30 days')::bigint AS recent
      FROM public.decisions d WHERE d.action IS NOT NULL
      GROUP BY d.action ORDER BY recent DESC, uses DESC LIMIT 5) x),
    'ignored', (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
      SELECT d.action,
             ROUND(100.0 * count(*) FILTER (WHERE d.status IN ('ignored','rejected','dismissed')) / GREATEST(count(*),1), 1) AS ignored_pct,
             count(*)::bigint AS total
      FROM public.decisions d WHERE d.action IS NOT NULL
      GROUP BY d.action HAVING count(*) > 0 ORDER BY ignored_pct DESC LIMIT 5) x),
    'categories', (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
      SELECT COALESCE(t.category,'uncategorized') AS category, count(*)::bigint AS uses
      FROM public.templates t GROUP BY 1 ORDER BY 2 DESC LIMIT 8) x),
    'storage_users', (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
      SELECT COALESCE(p.display_name, p.email,'Unknown') AS name, COALESCE(sum(m.file_size),0)::bigint AS bytes
      FROM public.media_assets m LEFT JOIN public.profiles p ON p.user_id = m.user_id
      GROUP BY 1 ORDER BY 2 DESC LIMIT 5) x)
  ) INTO r;
  RETURN r;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_overview_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_user_growth(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_plan_distribution() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(text, text, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_user_detail(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_decision_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_decisions(text, text, text, text, timestamptz, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_action_trends() FROM anon;