import { supabase } from '@/integrations/supabase/client';

export type SyncPlatform = 'meta' | 'google' | 'tiktok' | 'linkedin';

/** Kicks off external → AdVista sync via edge function. Normalization happens server-side. */
export const AnalyticsSyncService = {
  async sync(campaignId: string, platforms: SyncPlatform[] = ['meta', 'google', 'tiktok']) {
    const { data, error } = await supabase.functions.invoke('sync-analytics', {
      body: { campaignId, platforms },
    });
    if (error) throw error;
    return data as { synced: number; platforms: SyncPlatform[] };
  },
};
