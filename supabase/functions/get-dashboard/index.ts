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

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Getting dashboard layout for user:', user.id);

    // Get user's dashboard layout
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('user_dashboards')
      .select('layout')
      .eq('user_id', user.id)
      .maybeSingle();

    if (dashboardError) {
      console.error('Error fetching dashboard:', dashboardError);
      throw dashboardError;
    }

    // Default dashboard layout
    const defaultLayout = [
      { widget: 'summary', position: { x: 0, y: 0, w: 4, h: 2 } },
      { widget: 'topCampaigns', position: { x: 4, y: 0, w: 4, h: 2 } },
      { widget: 'recentActivity', position: { x: 0, y: 2, w: 4, h: 3 } },
      { widget: 'forecast', position: { x: 4, y: 2, w: 4, h: 3 } }
    ];

    const layout = dashboardData?.layout || defaultLayout;

    return new Response(JSON.stringify({ layout }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-dashboard function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});