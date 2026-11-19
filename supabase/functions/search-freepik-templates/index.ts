import { requireUser } from "../_shared/guard.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const freepikApiKey = Deno.env.get('FREEPIK_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const gate = await requireUser(req);
  if (gate instanceof Response) return gate;

  try {
    const { query, page = 1, limit = 20 } = await req.json();
    
    if (!freepikApiKey) {
      return new Response(JSON.stringify({
        error: 'FREEPIK_API_KEY is not set.',
      }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Searching Freepik templates: "${query}", page ${page}, limit ${limit}`);

    // Build search parameters
    const searchParams = new URLSearchParams({
      term: query || 'template',
      'filters[content_type][psd]': '1',
      page: page.toString(),
      limit: limit.toString(),
      order: 'latest'
    });

    const freepikUrl = `https://api.freepik.com/v1/resources?${searchParams}`;
    console.log('Freepik API URL:', freepikUrl);
    
    // Search Freepik API
    const freepikApiResponse = await fetch(freepikUrl, {
      method: 'GET',
      headers: {
        'x-freepik-api-key': freepikApiKey,
        'Accept': 'application/json',
      },
    });

    console.log('Freepik API response status:', freepikApiResponse.status);

    if (!freepikApiResponse.ok) {
      const errorText = await freepikApiResponse.text();
      console.error('Freepik API error:', freepikApiResponse.status, freepikApiResponse.statusText, errorText);
      
      // Check for authentication error
      if (freepikApiResponse.status === 401 || freepikApiResponse.status === 403) {
        return new Response(JSON.stringify({
          error: 'Freepik rejected FREEPIK_API_KEY.',
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (freepikApiResponse.status === 429) {
        return new Response(JSON.stringify({
          error: 'Freepik accepted FREEPIK_API_KEY and then rate-limited the request.',
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        error: `Freepik returned HTTP ${freepikApiResponse.status}.`,
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const freepikData = await freepikApiResponse.json();
    console.log(`Found ${freepikData.data?.length || 0} Freepik templates`);

    // Transform results. Saving into the library happens through import-stock-templates.
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
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Freepik search failed.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});