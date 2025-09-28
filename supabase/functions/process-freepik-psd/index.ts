import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PSDLayer {
  id: string;
  name: string;
  type: 'text' | 'image' | 'shape';
  content?: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    font?: string;
    size?: number;
    color?: string;
  };
  visible: boolean;
}

interface ProcessedPSDData {
  type: 'freepik-psd';
  layers: PSDLayer[];
  placeholders: string[];
  canvas: {
    width: number;
    height: number;
  };
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

    // For now, we'll create a mock PSD processing since ag-psd needs to be properly integrated
    // In a real implementation, this would use ag-psd to parse the PSD file
    const processedData: ProcessedPSDData = await mockProcessPSD(psdBuffer);

    // Update template with processed PSD data
    const { error: updateError } = await supabase
      .from('templates')
      .update({
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

// Mock PSD processing function - replace with actual ag-psd implementation
async function mockProcessPSD(psdBuffer: ArrayBuffer): Promise<ProcessedPSDData> {
  // This is a mock implementation. In reality, this would use ag-psd to:
  // 1. Parse the PSD file structure
  // 2. Extract layers, text content, and positioning
  // 3. Identify editable text layers and image placeholders
  // 4. Convert coordinates and styling information
  
  console.log('Mock processing PSD file...');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    type: 'freepik-psd',
    canvas: {
      width: 1080,
      height: 1080
    },
    layers: [
      {
        id: 'layer1',
        name: 'Headline Text',
        type: 'text',
        content: 'Your Product Name',
        bounds: { x: 50, y: 100, width: 400, height: 60 },
        style: { font: 'Arial', size: 32, color: '#000000' },
        visible: true
      },
      {
        id: 'layer2',
        name: 'Description Text',
        type: 'text',
        content: 'Product description goes here',
        bounds: { x: 50, y: 200, width: 400, height: 120 },
        style: { font: 'Arial', size: 16, color: '#333333' },
        visible: true
      },
      {
        id: 'layer3',
        name: 'CTA Button',
        type: 'text',
        content: 'Buy Now',
        bounds: { x: 50, y: 350, width: 150, height: 50 },
        style: { font: 'Arial', size: 18, color: '#ffffff' },
        visible: true
      },
      {
        id: 'layer4',
        name: 'Product Image',
        type: 'image',
        bounds: { x: 500, y: 100, width: 300, height: 300 },
        visible: true
      }
    ],
    placeholders: ['headline', 'description', 'cta', 'product_image']
  };
}