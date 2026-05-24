import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout, DashboardData } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

export const useDashboard = () => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard layout
  const { data: layout, isLoading: layoutLoading } = useQuery({
    queryKey: ['dashboard-layout'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-dashboard');
      if (error) throw error;
      return data.layout as DashboardLayout;
    },
  });

  // Save dashboard layout
  const saveLayoutMutation = useMutation({
    mutationFn: async (newLayout: DashboardLayout) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_dashboards')
        .upsert({
          user_id: user.user.id,
          layout: newLayout as any,
        });

      if (error) throw error;
      return newLayout;
    },
    onSuccess: (newLayout) => {
      queryClient.setQueryData(['dashboard-layout'], newLayout);
      toast({
        title: 'Dashboard Updated',
        description: 'Your dashboard layout has been saved.',
      });
    },
    onError: (error) => {
      console.error('Error saving dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to save dashboard layout.',
        variant: 'destructive',
      });
    },
  });

  // Export dashboard data
  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'pdf') => {
      const { data, error } = await supabase.functions.invoke('export-dashboard', {
        body: { format }
      });
      if (error) throw error;
      return { data, format };
    },
    onSuccess: async ({ data, format }) => {
      if (format === 'csv') {
        // For CSV, the data is already formatted as CSV string
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dashboard-export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        await generatePDF(data as DashboardData);
      }
      
      toast({
        title: 'Export Complete',
        description: `Dashboard exported as ${format.toUpperCase()}.`,
      });
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export dashboard data.',
        variant: 'destructive',
      });
    },
  });

  const generatePDF = async (data: DashboardData) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Dashboard Export Report', 20, 20);
    
    // Export date
    doc.setFontSize(12);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 20, 35);
    
    let yPosition = 50;
    
    // Summary section
    doc.setFontSize(16);
    doc.text('Summary Metrics', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    const summaryItems = [
      `Total Spend: ${data.summary.totalSpend}`,
      `Impressions: ${data.summary.impressions}`,
      `Clicks: ${data.summary.clicks}`,
      `CTR: ${data.summary.ctr}`,
      `Conversions: ${data.summary.conversions}`,
      `ROAS: ${data.summary.roas}`
    ];
    
    summaryItems.forEach(item => {
      doc.text(item, 30, yPosition);
      yPosition += 10;
    });
    
    yPosition += 10;
    
    // Top Campaigns section
    doc.setFontSize(16);
    doc.text('Top Campaigns', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    data.topCampaigns.forEach(campaign => {
      doc.text(`${campaign.name}: ${campaign.spend} spend, ${campaign.ctr} CTR`, 30, yPosition);
      yPosition += 10;
    });
    
    yPosition += 10;
    
    // Forecast section
    doc.setFontSize(16);
    doc.text('Forecast', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    const forecastItems = [
      `Predicted Spend: ${data.forecast.predictedSpend}`,
      `Predicted Impressions: ${data.forecast.predictedImpressions}`,
      `Predicted Conversions: ${data.forecast.predictedConversions}`,
      `Confidence: ${data.forecast.confidence}`
    ];
    
    forecastItems.forEach(item => {
      doc.text(item, 30, yPosition);
      yPosition += 10;
    });
    
    doc.save('dashboard-export.pdf');
  };

  const saveLayout = useCallback((newLayout: DashboardLayout) => {
    saveLayoutMutation.mutate(newLayout);
  }, [saveLayoutMutation]);

  const exportDashboard = useCallback((format: 'csv' | 'pdf') => {
    exportMutation.mutate(format);
  }, [exportMutation]);

  const toggleCustomizing = useCallback(() => {
    setIsCustomizing(prev => !prev);
  }, []);

  return {
    layout,
    layoutLoading,
    saveLayout,
    isCustomizing,
    toggleCustomizing,
    exportDashboard,
    isSaving: saveLayoutMutation.isPending,
    isExporting: exportMutation.isPending,
  };
};