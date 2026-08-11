import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const db = supabase as any;

export interface AdminOverviewStats {
  users_total: number;
  users_prev: number;
  users_new_30d: number;
  campaigns_total: number;
  campaigns_new_30d: number;
  campaigns_prev_30d: number;
  revenue_30d: number;
  revenue_prev_30d: number;
  templates_active: number;
  templates_pending: number;
  decisions_total: number;
  mrr: number;
}

export const pctChange = (current: number, previous: number) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

export const useAdminOverview = () =>
  useQuery<AdminOverviewStats>({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const { data, error } = await db.rpc('admin_overview_stats');
      if (error) throw new Error(error.message);
      return data as AdminOverviewStats;
    },
  });

export const useAdminUserGrowth = (days: number) =>
  useQuery<{ day: string; users: number }[]>({
    queryKey: ['admin-user-growth', days],
    queryFn: async () => {
      const { data, error } = await db.rpc('admin_user_growth', { p_days: days });
      if (error) throw new Error(error.message);
      return (data ?? []) as { day: string; users: number }[];
    },
  });

export const useAdminPlanDistribution = () =>
  useQuery<{ plan: string; users: number }[]>({
    queryKey: ['admin-plan-distribution'],
    queryFn: async () => {
      const { data, error } = await db.rpc('admin_plan_distribution');
      if (error) throw new Error(error.message);
      return (data ?? []) as { plan: string; users: number }[];
    },
  });

export interface AdminUserRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  plan: string;
  status: string;
  joined_at: string;
  campaigns: number;
  storage_bytes: number;
  ai_credits: number;
  last_active: string | null;
  total_count: number;
}

export const useAdminUsers = (params: {
  search?: string;
  plan?: string | null;
  status?: string | null;
  page: number;
  pageSize: number;
}) =>
  useQuery<AdminUserRow[]>({
    queryKey: ['admin-users', params],
    queryFn: async () => {
      const { data, error } = await db.rpc('admin_list_users', {
        p_search: params.search || null,
        p_plan: params.plan || null,
        p_status: params.status || null,
        p_limit: params.pageSize,
        p_offset: (params.page - 1) * params.pageSize,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as AdminUserRow[];
    },
  });

export const useAdminUserDetail = (userId: string | null) =>
  useQuery<any>({
    queryKey: ['admin-user-detail', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db.rpc('admin_user_detail', { p_user_id: userId });
      if (error) throw new Error(error.message);
      return data;
    },
  });

export const useAdminDecisionStats = () =>
  useQuery<any>({
    queryKey: ['admin-decision-stats'],
    queryFn: async () => {
      const { data, error } = await db.rpc('admin_decision_stats');
      if (error) throw new Error(error.message);
      return data;
    },
  });

export interface AdminDecisionRow {
  id: string;
  created_at: string;
  user_id: string;
  user_name: string;
  category: string | null;
  page: string | null;
  trigger_source: string | null;
  signal: string | null;
  action: string | null;
  reasoning: string | null;
  confidence: number | null;
  status: string;
  campaign_id: string | null;
  campaign_name: string | null;
  total_count: number;
}

export const useAdminDecisions = (params: {
  search?: string;
  category?: string | null;
  action?: string | null;
  status?: string | null;
  since?: string | null;
  page: number;
  pageSize: number;
}) =>
  useQuery<AdminDecisionRow[]>({
    queryKey: ['admin-decisions', params],
    queryFn: async () => {
      const { data, error } = await db.rpc('admin_list_decisions', {
        p_search: params.search || null,
        p_category: params.category || null,
        p_action: params.action || null,
        p_status: params.status || null,
        p_since: params.since || null,
        p_limit: params.pageSize,
        p_offset: (params.page - 1) * params.pageSize,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as AdminDecisionRow[];
    },
  });

export const useAdminActionTrends = () =>
  useQuery<any>({
    queryKey: ['admin-action-trends'],
    queryFn: async () => {
      const { data, error } = await db.rpc('admin_action_trends');
      if (error) throw new Error(error.message);
      return data;
    },
  });

export const useAdminTopTemplates = () =>
  useQuery<any[]>({
    queryKey: ['admin-top-templates'],
    queryFn: async () => {
      const { data, error } = await db
        .from('templates')
        .select('id,name,category,platform,usage_count,popularity_score,thumbnail_url')
        .order('usage_count', { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export interface SystemSettings {
  id: string;
  platform_name: string;
  default_plan: string;
  signups_open: boolean;
  maintenance_mode: boolean;
  default_autonomy: string;
  ai_model: string;
  image_model: string;
  free_ai_credits: number;
  decision_log_retention_days: number;
}

export const useSystemSettings = () =>
  useQuery<SystemSettings | null>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await db.from('system_settings').select('*').limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      return data as SystemSettings | null;
    },
  });

export const useUpdateSystemSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<SystemSettings> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await db.from('system_settings').update(rest).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Settings saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const usePlaybooks = () =>
  useQuery<any[]>({
    queryKey: ['admin-playbooks'],
    queryFn: async () => {
      const { data, error } = await db.from('category_playbooks').select('*').order('category');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const useSavePlaybook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await db.from('category_playbooks').update(rest).eq('id', id);
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await db.from('category_playbooks').insert(rest);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-playbooks'] });
      toast.success('Playbook saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const usePendingTemplates = () =>
  useQuery<any[]>({
    queryKey: ['admin-pending-templates'],
    queryFn: async () => {
      const { data, error } = await db
        .from('templates')
        .select('*')
        .eq('review_status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const useReviewTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: 'approved' | 'rejected'; note?: string }) => {
      const { error } = await db
        .from('templates')
        .update({
          review_status: status,
          review_note: note ?? null,
          reviewed_at: new Date().toISOString(),
          is_active: status === 'approved',
        })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-pending-templates'] });
      qc.invalidateQueries({ queryKey: ['admin-templates'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
      toast.success(vars.status === 'approved' ? 'Template approved' : 'Template rejected');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};
