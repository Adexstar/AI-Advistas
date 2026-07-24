import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { Database } from '@/integrations/supabase/types';
import { CampaignEventService } from './CampaignEventService';
import { CampaignVersionService } from './CampaignVersionService';

type CampaignRow = Database['public']['Tables']['campaigns']['Row'];
type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

async function cloneTableRecords(
  sourceCampaignId: string,
  targetCampaignId: string,
  table: string,
  fkColumn: string,
  stripColumns: string[] = ['id', 'created_at', 'updated_at'],
) {
  const { data: rows, error: fetchError } = await (db as any)
    .from(table)
    .select('*')
    .eq(fkColumn, sourceCampaignId);
  if (fetchError) throw fetchError;
  if (!rows || rows.length === 0) return;

  const inserts = rows.map((row: any) => {
    const copy = { ...row };
    stripColumns.forEach((col) => { delete copy[col]; });
    copy[fkColumn] = targetCampaignId;
    return copy;
  });

  const { error: insertError } = await (db as any).from(table).insert(inserts);
  if (insertError) throw insertError;
}

export const CampaignService = {
  async list(userId: string, opts?: { includeArchived?: boolean; status?: string }) {
    let q = db
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!opts?.includeArchived) q = q.eq('archived', false);
    if (opts?.status) q = q.eq('status', opts.status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as CampaignRow[];
  },

  async get(id: string) {
    const { data, error } = await db
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as CampaignRow;
  },

  async create(userId: string, input: Omit<CampaignInsert, 'user_id'>) {
    const { data, error } = await db
      .from('campaigns')
      .insert({ ...input, user_id: userId } as any)
      .select()
      .single();
    if (error) throw error;
    const campaign = data as CampaignRow;
    await Promise.all([
      CampaignEventService.log(campaign.id, userId, 'campaign_created', 'Campaign Created', `Campaign "${campaign.name}" created`),
      CampaignVersionService.create(campaign.id, userId, 'Initial version', 'Campaign created'),
    ]);
    return campaign;
  },

  async update(id: string, userId: string, updates: CampaignUpdate, changeDescription?: string) {
    const { data, error } = await db
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const campaign = data as CampaignRow;
    if (updates.status) {
      await CampaignEventService.log(id, userId, 'campaign_status_changed', `Status changed to ${updates.status}`, undefined, { from_status: updates.status });
    }
    if (updates.budget !== undefined) {
      await CampaignEventService.log(id, userId, 'budget_updated', 'Budget updated', `Budget changed to $${updates.budget}`, { budget: updates.budget });
    }
    return campaign;
  },

  async duplicate(userId: string, campaign: CampaignRow) {
    const { id, created_at, updated_at, impressions, clicks, conversions, revenue, reach, spend, ctr, roas, health_score, confidence, ...rest } = campaign;
    const { data, error } = await db
      .from('campaigns')
      .insert({ ...rest, name: `${campaign.name} (Copy)`, status: 'draft', user_id: userId } as any)
      .select()
      .single();
    if (error) throw error;
    const duped = data as CampaignRow;
    await CampaignEventService.log(duped.id, userId, 'campaign_created', 'Campaign Duplicated', `Duplicated from "${campaign.name}"`);

    /* Clone all related data tables */
    await Promise.all([
      cloneTableRecords(id, duped.id, 'campaign_assets', 'campaign_id'),
      cloneTableRecords(id, duped.id, 'campaign_versions', 'campaign_id', ['id', 'created_at', 'version_number']),
      cloneTableRecords(id, duped.id, 'campaign_events', 'campaign_id'),
      cloneTableRecords(id, duped.id, 'campaign_recommendations', 'campaign_id'),
      cloneTableRecords(id, duped.id, 'campaign_memory_entries', 'campaign_id'),
      cloneTableRecords(id, duped.id, 'campaign_automation_queue', 'campaign_id'),
    ]);

    return duped;
  },

  async delete(id: string) {
    const { error } = await db.from('campaigns').delete().eq('id', id);
    if (error) throw error;
  },

  async updateStatus(id: string, userId: string, status: string) {
    return this.update(id, userId, { status } as any, `Status changed to ${status}`);
  },

  async updateBudget(id: string, userId: string, budget: number) {
    return this.update(id, userId, { budget } as any);
  },

  async updateAudience(id: string, userId: string, targetAudience: Record<string, unknown>) {
    return this.update(id, userId, { target_audience: targetAudience } as any);
  },

  async updatePlatforms(id: string, userId: string, platforms: string[]) {
    return this.update(id, userId, { platforms } as any);
  },

  async updateNotes(id: string, userId: string, notes: string) {
    return this.update(id, userId, { notes } as any);
  },

  async search(userId: string, query: string) {
    const { data, error } = await db
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .textSearch('name', query)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignRow[];
  },
};
