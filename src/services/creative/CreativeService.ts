import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

export type Creative = Database['public']['Tables']['ads']['Row'];
type CreativeInput = Database['public']['Tables']['ads']['Insert'];

export const CreativeService = {
  async list(userId: string, campaignId?: string) {
    let query = supabase.from('ads').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (campaignId) query = query.eq('campaign_id', campaignId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
  async get(userId: string, id: string) {
    const { data, error } = await supabase.from('ads').select('*').eq('id', id).eq('user_id', userId).single();
    if (error) throw error;
    return data;
  },
  async save(userId: string, input: Omit<CreativeInput, 'user_id'>, id?: string | null) {
    const query = id
      ? supabase.from('ads').update(input).eq('id', id).eq('user_id', userId)
      : supabase.from('ads').insert({ ...input, user_id: userId });
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
};

export function creativeDocument(json: Record<string, unknown>, width: number, height: number, pages: unknown[] = []): Json {
  return JSON.parse(JSON.stringify({ ...json, width, height, pages })) as Json;
}