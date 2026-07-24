import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { CampaignAsset } from './types';
import { CampaignEventService } from './CampaignEventService';

export const CampaignAssetService = {
  async list(campaignId: string, assetType?: string) {
    let q = supabase
      .from('campaign_assets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('added_at', { ascending: false });
    if (assetType) q = q.eq('asset_type', assetType);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as CampaignAsset[];
  },

  async add(
    campaignId: string,
    userId: string,
    input: Omit<CampaignAsset, 'id' | 'campaign_id' | 'user_id' | 'added_at'>,
  ) {
    const { data, error } = await supabase
      .from('campaign_assets')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        ...input,
      } as any)
      .select()
      .single();
    if (error) throw error;
    await CampaignEventService.log(campaignId, userId, 'asset_added', `Added ${input.asset_type}`, input.asset_name ?? undefined);
    return data as CampaignAsset;
  },

  async remove(id: string, campaignId: string, userId: string) {
    const { error } = await supabase
      .from('campaign_assets')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await CampaignEventService.log(campaignId, userId, 'asset_removed', 'Asset removed');
  },

  async getByType(campaignId: string, assetType: string) {
    return this.list(campaignId, assetType);
  },

  async getTemplates(campaignId: string) {
    return this.getByType(campaignId, 'template');
  },

  async getImages(campaignId: string) {
    return this.getByType(campaignId, 'image');
  },
};
