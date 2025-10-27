import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PSDLayer {
  id: string;
  name: string;
  type: 'text' | 'image' | 'shape' | 'group';
  content?: string;
  bounds: { left: number; top: number; width: number; height: number };
  style?: any;
  visible: boolean;
}

interface ProcessedPSDData {
  type: 'psd';
  layers: PSDLayer[];
  placeholders: Array<{ type: string; label: string; path: string; objectIndex: number }>;
  canvas: { width: number; height: number };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { templateId, freepikDownloadUrl } = await req.json();

    if (!templateId || !freepikDownloadUrl) {
      return new Response(
        JSON.stringify({ error: 'templateId and freepikDownloadUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing PSD for template: ${templateId}`);

    // Download PSD file
    console.log(`Downloading PSD from: ${freepikDownloadUrl}`);
    const psdResponse = await fetch(freepikDownloadUrl);
    
    if (!psdResponse.ok) {
      throw new Error(`Failed to download PSD: ${psdResponse.statusText}`);
    }

    const psdBuffer = await psdResponse.arrayBuffer();
    console.log(`Downloaded PSD file, size: ${psdBuffer.byteLength} bytes`);

    // Mock PSD processing for MVP
    const processedData = await mockProcessPSD(psdBuffer);

    // Update template in database with canvas_data and customizable_fields
    const { error: updateError } = await supabase
      .from('templates')
      .update({
        schema: processedData,
        cached_data: processedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId);

    if (updateError) {
      throw new Error(`Failed to update template: ${updateError.message}`);
    }

    console.log(`Successfully processed PSD for template: ${templateId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedData,
        message: 'PSD processed and cached successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing PSD:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Mock PSD processing - Replace with real ag-psd implementation later
async function mockProcessPSD(psdBuffer: ArrayBuffer): Promise<ProcessedPSDData> {
  console.log('Mock processing PSD...');
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    type: 'psd',
    layers: [
      {
        id: 'layer_1',
        name: 'Product Title',
        type: 'text',
        content: 'Your Product Name',
        bounds: { left: 50, top: 50, width: 700, height: 60 },
        style: {
          fontSize: 32,
          fontFamily: 'Inter',
          fill: '#000000',
          fontWeight: 'bold',
        },
        visible: true,
      },
      {
        id: 'layer_2',
        name: 'Product Description',
        type: 'text',
        content: 'Add your product description here',
        bounds: { left: 50, top: 130, width: 700, height: 100 },
        style: {
          fontSize: 16,
          fontFamily: 'Inter',
          fill: '#666666',
        },
        visible: true,
      },
      {
        id: 'layer_3',
        name: 'Product Image',
        type: 'image',
        bounds: { left: 50, top: 250, width: 400, height: 300 },
        visible: true,
      },
    ],
    placeholders: [
      { type: 'text', label: 'Product Title', path: 'objects[0].text', objectIndex: 0 },
      { type: 'text', label: 'Product Description', path: 'objects[1].text', objectIndex: 1 },
      { type: 'image', label: 'Product Image', path: 'objects[2].src', objectIndex: 2 },
    ],
    canvas: { width: 800, height: 600 },
  };
}