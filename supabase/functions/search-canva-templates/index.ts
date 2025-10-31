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
    const { query } = await req.json();
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
      console.log('User not authenticated, returning mock templates');
      return getMockTemplates(query);
    }

    // Get user's Canva access token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('user_canva_tokens')
      .select('access_token, expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.log('No Canva connection found, returning mock templates');
      return getMockTemplates(query);
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.log('Token expired, attempting refresh');
      
      // Call refresh endpoint
      const refreshResponse = await supabaseClient.functions.invoke('canva-refresh-token');
      
      if (refreshResponse.error) {
        console.error('Failed to refresh token:', refreshResponse.error);
        return getMockTemplates(query);
      }
      
      // Get updated token
      const { data: newTokenData } = await supabaseClient
        .from('user_canva_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .single();
      
      tokenData.access_token = newTokenData.access_token;
    }

    console.log('Using real Canva API with query:', query);
    
    // Call Canva API to search designs
    try {
      const searchParams = new URLSearchParams({
        query: query || '',
        limit: '20',
      });

      const response = await fetch(
        `https://api.canva.com/rest/v1/designs?${searchParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const templates = data.items?.map((design: any) => ({
          id: design.id,
          name: design.name || design.title || 'Untitled Design',
          thumbnail_url: design.thumbnail?.url || design.thumbnail_url,
          template_source: 'canva',
          canvas_data: design,
          external_id: design.id,
          category: 'canva',
          description: `Canva design - ${design.design_type || 'template'}`,
        })) || [];

        console.log(`Found ${templates.length} Canva templates`);

        return new Response(
          JSON.stringify({ templates, source: 'canva_api' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const errorText = await response.text();
        console.error('Canva API error:', response.status, errorText);
        return getMockTemplates(query);
      }
    } catch (apiError) {
      console.error('Canva API request failed:', apiError);
      return getMockTemplates(query);
    }
    
  } catch (error) {
    console.error('Error in search-canva-templates:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to return mock templates
function getMockTemplates(query: string) {
  console.log('Returning mock Canva templates');
  const mockTemplates = [
      {
        id: 'canva-instagram-story-1',
        name: 'Instagram Story - Product Launch',
        thumbnail_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
        template_source: 'canva',
        canvas_data: {
          version: '6.0.0',
          objects: [
            {
              type: 'textbox',
              text: 'NEW PRODUCT LAUNCH',
              left: 50,
              top: 100,
              fontSize: 48,
              fontFamily: 'Inter',
              fill: '#FFFFFF',
              fontWeight: 'bold',
              width: 500
            },
            {
              type: 'textbox',
              text: 'Coming Soon',
              left: 50,
              top: 200,
              fontSize: 24,
              fontFamily: 'Inter',
              fill: '#FFFFFF',
              width: 500
            }
          ],
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      },
      {
        id: 'canva-facebook-ad-1',
        name: 'Facebook Ad - E-commerce Sale',
        thumbnail_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
        template_source: 'canva',
        canvas_data: {
          version: '6.0.0',
          objects: [
            {
              type: 'textbox',
              text: 'SUMMER SALE',
              left: 100,
              top: 80,
              fontSize: 56,
              fontFamily: 'Inter',
              fill: '#FF6B6B',
              fontWeight: 'bold',
              width: 600
            },
            {
              type: 'textbox',
              text: 'Up to 50% OFF',
              left: 100,
              top: 180,
              fontSize: 32,
              fontFamily: 'Inter',
              fill: '#4ECDC4',
              width: 600
            }
          ],
          background: '#FFF'
        }
      }
    ];

    const filteredTemplates = query 
      ? mockTemplates.filter(t => 
          t.name.toLowerCase().includes(query.toLowerCase())
        )
      : mockTemplates;

  return new Response(
    JSON.stringify({ templates: filteredTemplates, source: 'mock' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
