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
    const { query, page = 1, limit = 20 } = await req.json();
    
    if (!freepikApiKey) {
      console.error('Freepik API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Freepik API key not configured',
        fallback: true 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Searching Freepik templates: "${query}", page ${page}, limit ${limit}`);

    // Search Freepik API
    const freepikResponse = await fetch(`https://api.freepik.com/v1/resources`, {
      method: 'GET',
      headers: {
        'x-freepik-api-key': freepikApiKey,
        'Content-Type': 'application/json',
      },
      body: null,
    });

    const searchParams = new URLSearchParams({
      term: query || '',
      'filters[content_type][psd]': '1',
      page: page.toString(),
      limit: limit.toString(),
      order: 'latest'
    });

    const freepikUrl = `https://api.freepik.com/v1/resources?${searchParams}`;
    
    const freepikApiResponse = await fetch(freepikUrl, {
      headers: {
        'x-freepik-api-key': freepikApiKey,
      },
    });

    if (!freepikApiResponse.ok) {
      console.error('Freepik API error:', freepikApiResponse.status, freepikApiResponse.statusText);
      
      // Check rate limit
      const rateLimitRemaining = freepikApiResponse.headers.get('x-ratelimit-remaining');
      if (freepikApiResponse.status === 429 || rateLimitRemaining === '0') {
        console.log('Rate limit hit, falling back to internal templates');
        return new Response(JSON.stringify({ 
          templates: [],
          fallback: true,
          message: 'Rate limit reached, showing internal templates only'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Freepik API error: ${freepikApiResponse.status}`);
    }

    const freepikData = await freepikApiResponse.json();
    console.log(`Found ${freepikData.data?.length || 0} Freepik templates`);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Transform and cache results
    const templates = await Promise.all(
      (freepikData.data || []).map(async (item: any) => {
        const template = {
          id: `freepik-${item.id}`,
          name: item.title || 'Untitled Template',
          description: item.description || '',
          thumbnail_url: item.thumbnail?.url || item.image?.url,
          preview_url: item.preview?.url || item.image?.url,
          template_source: 'freepik',
          freepik_id: item.id.toString(),
          cached_data: {
            freepik_data: item,
            cached_at: new Date().toISOString(),
          },
          freepik_download_url: item.download?.url,
          schema: {
            type: 'freepik-psd',
            original_data: item
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Cache template in database (upsert)
        try {
          const { error } = await supabase
            .from('templates')
            .upsert(template, { 
              onConflict: 'freepik_id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error('Error caching template:', error);
          } else {
            console.log(`Cached template: ${template.name}`);
          }
        } catch (cacheError) {
          console.error('Cache error:', cacheError);
        }

        return template;
      })
    );

    return new Response(JSON.stringify({ 
      templates,
      pagination: {
        page,
        limit,
        total: freepikData.total || 0,
        hasMore: (freepikData.data?.length || 0) === limit
      },
      source: 'freepik'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-freepik-templates function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
      message: 'Error accessing Freepik, showing internal templates only'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});