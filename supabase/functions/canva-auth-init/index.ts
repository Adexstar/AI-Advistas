import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codeChallenge } = await req.json();
    
    const canvaClientId = Deno.env.get('CANVA_CLIENT_ID');
    
    if (!canvaClientId) {
      throw new Error('Canva client ID not configured');
    }

    if (!codeChallenge) {
      throw new Error('Code challenge is required for PKCE flow');
    }

    // Get the redirect URI from the request origin
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || url.origin;
    const redirectUri = `${origin}/auth/canva/callback`;

    // Build Canva OAuth URL with PKCE
    const authUrl = new URL('https://www.canva.com/api/oauth/authorize');
    authUrl.searchParams.set('client_id', canvaClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    
    // Expanded scopes for richer functionality
    authUrl.searchParams.set('scope', [
      'asset:read',
      'asset:write',
      'design:content:read',
      'design:content:write',
      'design:meta:read',
      'folder:read',
      'folder:write',
      'profile:read',
      'brandtemplate:content:read',
      'brandtemplate:meta:read'
    ].join(' '));
    
    // PKCE parameters
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    
    // Generate a random state for CSRF protection
    const state = crypto.randomUUID();
    authUrl.searchParams.set('state', state);

    console.log('Initiating Canva OAuth flow with PKCE:', {
      redirectUri,
      state,
      scopes: authUrl.searchParams.get('scope')
    });

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        state 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in canva-auth-init:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
