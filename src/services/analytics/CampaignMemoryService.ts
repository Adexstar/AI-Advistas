import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export interface MemoryPattern {
  id: string;
  user_id: string;
  campaign_id: string | null;
  category: string | null;
  platform: string | null;
  pattern_type: string;
  pattern_data: Record<string, unknown>;
  performance_score: number;
  created_at: string;
}

export const CampaignMemoryService = {
  async remember(pattern: Omit<MemoryPattern, 'id' | 'created_at'>) {
    const { data, error } = await db.from('campaign_memory').insert(pattern as any).select().single();
    if (error) throw error;
    return data as MemoryPattern;
  },

  async recall(userId: string, filters: { category?: string; platform?: string; pattern_type?: string } = {}) {
    let q = db.from('campaign_memory').select('*').eq('user_id', userId).order('performance_score', { ascending: false }).limit(20);
    if (filters.category) q = q.eq('category', filters.category);
    if (filters.platform) q = q.eq('platform', filters.platform);
    if (filters.pattern_type) q = q.eq('pattern_type', filters.pattern_type);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as MemoryPattern[];
  },
};
