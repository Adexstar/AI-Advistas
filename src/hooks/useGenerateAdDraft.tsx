import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AdDraftRequest, AdDraftResponse } from '@/schemas/adDraftSchema';

export const useGenerateAdDraft = () => {
  return useMutation<AdDraftResponse, Error, AdDraftRequest>({
    mutationFn: async (request: AdDraftRequest) => {
      const { data, error } = await supabase.functions.invoke('generate-ad-draft', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate ad draft');
      }

      if (!data || !data.draft) {
        throw new Error('Invalid response from AI service');
      }

      return data.draft;
    },
  });
};
