import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { CampaignVersion, CampaignSnapshot } from './types';
import { CampaignEventService } from './CampaignEventService';

export const CampaignVersionService = {
  async list(campaignId: string) {
    const { data, error } = await supabase.from('campaign_versions').select('*').eq('campaign_id', campaignId).order('version_number', { ascending: false });
    if (error) throw error;
    return data as unknown as CampaignVersion[];
  },
  async create(campaignId: string, _userId: string, label?: string, description?: string) {
    const { data, error } = await supabase.rpc('create_campaign_version', { p_campaign_id: campaignId, p_label: label, p_description: description });
    if (error) throw error;
    return data;
  },
  async get(id: string) {
    const { data, error } = await supabase.from('campaign_versions').select('*').eq('id', id).single();
    if (error) throw error;
    return data as unknown as CampaignVersion;
  },
  async restore(campaignId: string, _userId: string, versionId: string) {
    const { error } = await supabase.rpc('restore_campaign_version', { p_campaign_id: campaignId, p_version_id: versionId });
    if (error) throw error;
  },
};
