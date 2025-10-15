import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

export const usePauseCampaign = () => {
  const { actions } = useApp();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      actions.updateCampaign(campaignId, { status: 'paused' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-best-actions'] });
      toast({
        title: 'Campaign Paused',
        description: 'The campaign has been paused successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to pause campaign.',
        variant: 'destructive',
      });
    }
  });
};

export const useResumeCampaign = () => {
  const { actions } = useApp();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      actions.updateCampaign(campaignId, { status: 'active' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-best-actions'] });
      toast({
        title: 'Campaign Resumed',
        description: 'The campaign is now active.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to resume campaign.',
        variant: 'destructive',
      });
    }
  });
};

export const useUpdateBudget = () => {
  const { actions } = useApp();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ campaignId, newBudget }: { campaignId: string; newBudget: number }) => {
      actions.updateCampaign(campaignId, { budget: newBudget });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-best-actions'] });
      toast({
        title: 'Budget Updated',
        description: 'Campaign budget has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update budget.',
        variant: 'destructive',
      });
    }
  });
};
