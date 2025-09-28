import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const freepikApiKey = Deno.env.get('FREEPIK_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { freepik_id } = await req.json();
    
    if (!freepikApiKey) {
      console.error('Freepik API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Freepik API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!freepik_id) {
      return new Response(JSON.stringify({ 
        error: 'freepik_id is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Getting Freepik template details: ${freepik_id}`);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First check if we have cached data
    const { data: cachedTemplate, error: cacheError } = await supabase
      .from('templates')
      .select('*')
      .eq('freepik_id', freepik_id)
      .eq('template_source', 'freepik')
      .single();

    if (!cacheError && cachedTemplate) {
      console.log('Returning cached template data');
      return new Response(JSON.stringify({ 
        template: cachedTemplate,
        source: 'cache'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from Freepik API
    const freepikResponse = await fetch(`https://api.freepik.com/v1/resources/${freepik_id}`, {
      headers: {
        'x-freepik-api-key': freepikApiKey,
      },
    });

    if (!freepikResponse.ok) {
      console.error('Freepik API error:', freepikResponse.status, freepikResponse.statusText);
      
      if (freepikResponse.status === 429) {
        const retryAfter = freepikResponse.headers.get('retry-after') || '60';
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: parseInt(retryAfter)
        }), {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': retryAfter
          },
        });
      }

      throw new Error(`Freepik API error: ${freepikResponse.status}`);
    }

    const freepikData = await freepikResponse.json();
    console.log('Retrieved template details from Freepik API');

    // Transform and cache the detailed template data
    const template = {
      id: `freepik-${freepikData.id}`,
      name: freepikData.title || 'Untitled Template',
      description: freepikData.description || '',
      thumbnail_url: freepikData.thumbnail?.url || freepikData.image?.url,
      preview_url: freepikData.preview?.url || freepikData.image?.url,
      template_source: 'freepik',
      freepik_id: freepikData.id.toString(),
      cached_data: {
        freepik_data: freepikData,
        cached_at: new Date().toISOString(),
        detailed: true
      },
      freepik_download_url: freepikData.download?.url,
      schema: {
        type: 'freepik-psd',
        original_data: freepikData,
        layers: freepikData.layers || [],
        dimensions: freepikData.dimensions || {}
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Cache the detailed template
    const { error: upsertError } = await supabase
      .from('templates')
      .upsert(template, { 
        onConflict: 'freepik_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('Error caching detailed template:', upsertError);
    } else {
      console.log(`Cached detailed template: ${template.name}`);
    }

    return new Response(JSON.stringify({ 
      template,
      source: 'freepik-api'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-freepik-template function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});