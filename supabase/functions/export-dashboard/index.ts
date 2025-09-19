import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { format = 'csv' } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Exporting dashboard data for user:', user.id, 'format:', format);

    // Generate mock dashboard data (in real app, this would come from actual metrics)
    const dashboardData = {
      summary: {
        totalSpend: '$12,450',
        impressions: '2.4M',
        clicks: '48.2K',
        ctr: '2.01%',
        conversions: '1,205',
        roas: '3.2x'
      },
      topCampaigns: [
        { name: 'Summer Sale 2024', spend: '$3,200', impressions: '450K', ctr: '2.8%', conversions: '350' },
        { name: 'Product Launch', spend: '$2,800', impressions: '380K', ctr: '2.4%', conversions: '285' },
        { name: 'Brand Awareness', spend: '$2,100', impressions: '520K', ctr: '1.8%', conversions: '190' }
      ],
      recentActivity: [
        { action: 'Campaign "Holiday Special" started', timestamp: new Date().toISOString() },
        { action: 'Budget increased for "Product Launch"', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { action: 'New ad creative uploaded', timestamp: new Date(Date.now() - 7200000).toISOString() }
      ],
      forecast: {
        predictedSpend: '$15,200',
        predictedImpressions: '3.1M',
        predictedConversions: '1,580',
        confidence: '87%'
      },
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Generate CSV format
      let csv = 'Dashboard Export Report\n';
      csv += `Exported at: ${new Date(dashboardData.exportedAt).toLocaleString()}\n\n`;
      
      csv += 'SUMMARY METRICS\n';
      csv += 'Metric,Value\n';
      csv += `Total Spend,${dashboardData.summary.totalSpend}\n`;
      csv += `Impressions,${dashboardData.summary.impressions}\n`;
      csv += `Clicks,${dashboardData.summary.clicks}\n`;
      csv += `CTR,${dashboardData.summary.ctr}\n`;
      csv += `Conversions,${dashboardData.summary.conversions}\n`;
      csv += `ROAS,${dashboardData.summary.roas}\n\n`;
      
      csv += 'TOP CAMPAIGNS\n';
      csv += 'Campaign Name,Spend,Impressions,CTR,Conversions\n';
      dashboardData.topCampaigns.forEach(campaign => {
        csv += `${campaign.name},${campaign.spend},${campaign.impressions},${campaign.ctr},${campaign.conversions}\n`;
      });
      
      csv += '\nFORECASTED METRICS\n';
      csv += 'Metric,Predicted Value,Confidence\n';
      csv += `Spend,${dashboardData.forecast.predictedSpend},${dashboardData.forecast.confidence}\n`;
      csv += `Impressions,${dashboardData.forecast.predictedImpressions},${dashboardData.forecast.confidence}\n`;
      csv += `Conversions,${dashboardData.forecast.predictedConversions},${dashboardData.forecast.confidence}\n`;

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="dashboard-export.csv"'
        },
      });
    }

    // Return JSON format for frontend to handle PDF generation
    return new Response(JSON.stringify(dashboardData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in export-dashboard function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});