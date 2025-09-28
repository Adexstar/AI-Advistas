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

    // Convert base64 canvas data to blob
    const base64Data = canvasData.split(',')[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate filename
    const timestamp = Date.now();
    const fileName = `${user.id}/${adId}_${timestamp}.${format}`;

    // Upload to user_ads bucket
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('user_ads')
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

    // Get public URL (this will be a signed URL for private bucket)
    const { data: urlData } = supabaseClient.storage
      .from('user_ads')
      .getPublicUrl(fileName);

    // Update user_ads record with export info
    const { error: updateError } = await supabaseClient
      .from('user_ads')
      .update({
        file_path: fileName,
        export_format: format,
        status: 'exported'
      })
      .eq('id', adId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      // Don't fail the export if update fails
    }

    console.log('Ad exported successfully:', fileName);

    return new Response(JSON.stringify({
      success: true,
      fileName,
      downloadUrl: urlData.publicUrl,
      format,
      size: imageBuffer.length,
      message: 'Ad exported successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in export-ad function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});