REVOKE EXECUTE ON FUNCTION public.admin_overview_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_user_growth(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_plan_distribution() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(text, text, text, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_user_detail(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_decision_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_decisions(text, text, text, text, timestamptz, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_action_trends() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_overview_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_growth(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_plan_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_decision_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_decisions(text, text, text, text, timestamptz, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_action_trends() TO authenticated;