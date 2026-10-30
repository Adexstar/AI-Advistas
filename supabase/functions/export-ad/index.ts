import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  adId: string;
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  quality?: number;
  width?: number;
  height?: number;
  canvasData: string; // Base64 encoded canvas data
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { adId, format, quality = 0.9, width = 1920, height = 1080, canvasData }: ExportRequest = await req.json();

    if (!adId || !format || !canvasData) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Exporting ad:', adId, 'in format:', format);

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: creative, error: creativeError } = await supabaseClient.from('ads').select('id, content').eq('id', adId).eq('user_id', user.id).single();
    if (creativeError || !creative) return new Response(JSON.stringify({ error: 'Creative not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!['png', 'jpg'].includes(format)) return new Response(JSON.stringify({ error: 'Only raster PNG/JPG exports are supported here' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Convert base64 canvas data to blob
    const base64Data = canvasData.split(',')[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate filename
    const timestamp = Date.now();
    const fileName = `${user.id}/${adId}_${timestamp}.${format}`;

    // Upload to user_ads bucket
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('ad_templates')
      .upload(fileName, imageBuffer, {
        contentType: `image/${format}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: urlData, error: urlError } = await supabaseClient.storage.from('ad_templates').createSignedUrl(fileName, 3600);
    if (urlError || !urlData) throw new Error('Could not create download link');
    const { error: updateError } = await supabaseClient.from('ads').update({
      content: { ...creative.content, file_path: fileName, export_format: format },
    }).eq('id', adId).eq('user_id', user.id);
    if (updateError) throw updateError;

    console.log('Ad exported successfully:', fileName);

    return new Response(JSON.stringify({
      success: true,
      fileName,
      downloadUrl: urlData.signedUrl,
      format,
      size: imageBuffer.length,
      message: 'Ad exported successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in export-ad function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});