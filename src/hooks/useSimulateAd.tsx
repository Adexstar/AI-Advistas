import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdData {
  headline: string;
  body: string;
  imageAlt?: string;
  imageType?: string;
  platform: string;
  cta: string;
  targetAudience?: {
    ageRange?: string;
    interests?: string[];
  };
}

export interface SimulatorScore {
  qualityScore: number;
  ctrEstimate: number;
  confidence: number;
  suggestions: string[];
}

interface SimulateAdParams {
  ad: AdData;
  adId?: string;
}

export const useSimulateAd = () => {
  return useMutation<SimulatorScore, Error, SimulateAdParams>({
    mutationFn: async ({ ad, adId }) => {
      const { data, error } = await supabase.functions.invoke('ai-score-ad', {
        body: { ad, adId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to simulate ad');
      }

      return data.score;
    },
  });
};