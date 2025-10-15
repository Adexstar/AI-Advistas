import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export interface NextBestAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  campaignId: string;
  campaignName: string;
  type: string;
  title: string;
  description: string;
  suggestedAction: string;
  confidence: number;
  actionType?: string;
  metadata?: {
    currentValue?: string;
    targetValue?: string;
    impact?: string;
  };
}

export const useNextBestActions = () => {
  const { state } = useApp();

  return useQuery({
    queryKey: ['next-best-actions', state.campaigns.length, state.campaigns.map(c => c.id).join(',')],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-performance', {
        body: { campaigns: state.campaigns }
      });

      if (error) throw error;
      return (data?.actions || []) as NextBestAction[];
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    enabled: state.campaigns.length > 0,
  });
};
