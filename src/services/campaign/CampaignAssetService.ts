import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { CampaignAsset } from './types';
import { CreativeService } from '@/services/creative/CreativeService';
import { CampaignEventService } from './CampaignEventService';

export const CampaignAssetService = {
  async list(campaignId: string, assetType?: string) {
    const { data, error } = await supabase.from('campaign_assets').select('*, ads(*)').eq('campaign_id', campaignId).order('created_at', { ascending: false });
    if (error) throw error;
    const assets: CampaignAsset[] = (data ?? []).map(row => ({ id: row.id, campaign_id: row.campaign_id, user_id: row.user_id,
      asset_type: 'ad', asset_id: row.ad_id, asset_name: row.ads?.name ?? null, asset_url: row.ads?.preview_url ?? null,
      asset_metadata: { creative_id: row.ad_id }, added_at: row.created_at }));
    return assetType ? assets.filter(asset => asset.asset_type === assetType) : assets;
  },

  async add(
    campaignId: string,
    userId: string,
    input: Omit<CampaignAsset, 'id' | 'campaign_id' | 'user_id' | 'added_at'>,
  ) {
    if (!input.asset_id) throw new Error('Select a saved creative first');
    await CreativeService.save(userId, { campaign_id: campaignId }, input.asset_id);
    const assets = await this.list(campaignId);
    return assets.find(asset => asset.asset_id === input.asset_id);
  },

  async remove(id: string, campaignId: string, userId: string) {
    const { data, error } = await supabase.from('campaign_assets').select('ad_id').eq('id', id).eq('campaign_id', campaignId).eq('user_id', userId).single();
    if (error) throw error;
    await CreativeService.save(userId, { campaign_id: null }, data.ad_id);
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
