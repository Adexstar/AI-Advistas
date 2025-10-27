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
    const { query } = await req.json();
    const canvaApiKey = Deno.env.get('CANVA_API_KEY');
    
    // If API key is available, use real Canva API
    if (canvaApiKey) {
      console.log('Using Canva API with query:', query);
      
      try {
        const response = await fetch(
          `https://api.canva.com/v1/designs?query=${encodeURIComponent(query || '')}&category=social-media&limit=20`,
          {
            headers: {
              'Authorization': `Bearer ${canvaApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const templates = data.designs?.map((design: any) => ({
            id: design.id,
            name: design.name,
            thumbnail_url: design.thumbnail_url,
            template_source: 'canva',
            canvas_data: design,
          })) || [];

          return new Response(
            JSON.stringify({ templates, source: 'canva_api' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (apiError) {
        console.error('Canva API error, falling back to mocks:', apiError);
      }
    }
    
    // Fallback to mock templates
    console.log('Using mock Canva templates');
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
