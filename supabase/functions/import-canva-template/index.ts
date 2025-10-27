import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const canvaApiKey = Deno.env.get('CANVA_API_KEY');
    const { canvaTemplateId, template } = await req.json();

    if (!canvaTemplateId && !template) {
      throw new Error('Missing canvaTemplateId or template object');
    }

    let canvaDesign = template;

    // If we have an API key and need to fetch the design
    if (canvaApiKey && canvaTemplateId && !template) {
      console.log('Fetching Canva design from API:', canvaTemplateId);
      const response = await fetch(
        `https://api.canva.com/v1/designs/${canvaTemplateId}`,
        {
          headers: {
            'Authorization': `Bearer ${canvaApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Canva API error: ${response.statusText}`);
      }

      canvaDesign = await response.json();
    }

    // Convert Canva design to Fabric.js canvas format
    const canvas_data = convertCanvaToFabric(canvaDesign);
    const customizable_fields = extractCanvaFields(canvaDesign);

    // Insert into ad_templates table
    const { data: insertedTemplate, error: insertError } = await supabase
      .from('ad_templates')
      .insert({
        name: canvaDesign.name || 'Canva Template',
        description: canvaDesign.description || 'Imported from Canva',
        template_source: 'canva',
        external_id: canvaDesign.id,
        canvas_data,
        customizable_fields,
        platforms: ['Facebook', 'Instagram', 'TikTok'],
        template_json: {},
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('Successfully imported Canva template:', insertedTemplate.id);

    return new Response(
      JSON.stringify({
        success: true,
        templateId: insertedTemplate.id,
        template: insertedTemplate,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error importing Canva template:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to import Canva template',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Convert Canva design format to Fabric.js canvas format
function convertCanvaToFabric(canvaDesign: any) {
  // Mock conversion for MVP
  const objects = [];
  
  // Add text elements
  objects.push({
    type: 'textbox',
    text: canvaDesign.name || 'Canva Template',
    left: 50,
    top: 50,
    fontSize: 32,
    fontFamily: 'Inter',
    fill: '#000000',
    width: 700,
    fontWeight: 'bold',
  });

  objects.push({
    type: 'textbox',
    text: 'Customize this Canva design',
    left: 50,
    top: 120,
    fontSize: 16,
    fontFamily: 'Inter',
    fill: '#666666',
    width: 700,
  });

  return {
    version: '6.0.0',
    objects,
    background: canvaDesign.background_color || '#ffffff',
  };
}

// Extract editable fields from Canva design
function extractCanvaFields(canvaDesign: any) {
  // Mock field extraction for MVP
  return [
    {
      type: 'text',
      label: 'Title',
      path: 'objects[0].text',
      objectIndex: 0,
    },
    {
      type: 'text',
      label: 'Description',
      path: 'objects[1].text',
      objectIndex: 1,
    },
  ];
}
