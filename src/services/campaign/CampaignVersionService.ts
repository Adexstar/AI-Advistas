import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { CampaignVersion, CampaignSnapshot } from './types';
import { CampaignEventService } from './CampaignEventService';

export const CampaignVersionService = {
  async list(campaignId: string) {
    const { data, error } = await db
      .from('campaign_versions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('version_number', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignVersion[];
  },

  async create(campaignId: string, userId: string, label?: string, description?: string) {
    const { data, error } = await db.rpc('create_campaign_version', {
      p_campaign_id: campaignId,
      p_user_id: userId,
      p_label: label ?? null,
      p_description: description ?? null,
    });
    if (error) {
      const { data: campaign } = await db
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      const snapshot = (campaign ?? {}) as CampaignSnapshot;
      const { data: existing } = await db
        .from('campaign_versions')
        .select('version_number')
        .eq('campaign_id', campaignId)
        .order('version_number', { ascending: false })
        .limit(1);
      const nextVersion = ((existing as any)?.[0]?.version_number ?? 0) + 1;
      const { data: versionData, error: versionError } = await db
        .from('campaign_versions')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          version_number: nextVersion,
          label: label ?? null,
          description: description ?? null,
          snapshot: snapshot as any,
        })
        .select()
        .single();
      if (versionError) throw versionError;
      await CampaignEventService.log(campaignId, userId, 'version_created', `Version ${nextVersion} created`, label ?? undefined);
      return versionData;
    }
    await CampaignEventService.log(campaignId, userId, 'version_created', `Version ${data} created`, label ?? undefined);
    return { version_number: data };
  },

  async get(id: string) {
    const { data, error } = await db
      .from('campaign_versions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as CampaignVersion;
  },

  async restore(campaignId: string, userId: string, versionId: string) {
    const version = await this.get(versionId);
    const snapshot = version.snapshot as any;
    const { error } = await db
      .from('campaigns')
      .update({
        name: snapshot.name,
        status: snapshot.status,
        objective: snapshot.objective,
        budget: snapshot.budget,
        spend: snapshot.spend,
        platform: snapshot.platform,
        platforms: snapshot.platforms,
        target_audience: snapshot.target_audience,
        start_date: snapshot.start_date,
        end_date: snapshot.end_date,
        notes: snapshot.notes,
        tags: snapshot.tags,
      })
      .eq('id', campaignId);
    if (error) throw error;
    await this.create(campaignId, userId, `Restored from v${version.version_number}`, `Restored version ${version.version_number}: ${version.label ?? ''}`);
    await CampaignEventService.log(campaignId, userId, 'version_restored', `Restored version ${version.version_number}`, version.label ?? undefined);
  },
};
