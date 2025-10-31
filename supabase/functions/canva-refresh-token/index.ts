import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Refreshing Canva token for user:', user.id);

    // Get user's current tokens
    const { data: tokenData, error: fetchError } = await supabaseClient
      .from('user_canva_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !tokenData) {
      throw new Error('No Canva connection found');
    }

    const canvaClientId = Deno.env.get('CANVA_CLIENT_ID');
    const canvaClientSecret = Deno.env.get('CANVA_CLIENT_SECRET');
    
    if (!canvaClientId || !canvaClientSecret) {
      throw new Error('Canva credentials not configured');
    }

    // Refresh the access token
    const refreshResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id: canvaClientId,
        client_secret: canvaClientSecret,
      }).toString(),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('Token refresh failed:', errorText);
      throw new Error(`Failed to refresh token: ${errorText}`);
    }

    const newTokenData = await refreshResponse.json();
    console.log('Token refresh successful');

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000));

    // Update tokens in database
    const { error: updateError } = await supabaseClient
      .from('user_canva_tokens')
      .update({
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update tokens:', updateError);
      throw new Error(`Failed to update tokens: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        access_token: newTokenData.access_token,
        expires_at: expiresAt.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in canva-refresh-token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
