import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string);

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing template upload:', file.name, file.type);

    // Upload file to storage
    const fileName = `${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('ad_templates')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('ad_templates')
      .getPublicUrl(fileName);

    // Process PSD if it's a PSD file
    let processedData = null;
    if (file.type === 'application/x-photoshop' || file.name.toLowerCase().endsWith('.psd')) {
      try {
        // Call PSD processing function
        const { data: psdData, error: psdError } = await supabaseClient.functions.invoke('process-freepik-psd', {
          body: {
            templateId: 'temp',
            freepikDownloadUrl: urlData.publicUrl
          }
        });

        if (!psdError && psdData) {
          processedData = psdData.processedData;
        }
      } catch (error) {
        console.log('PSD processing failed, continuing without processed data:', error);
      }
    }

    // Create template record
    const templateData = {
      name: metadata.name,
      description: metadata.description || '',
      file_path: fileName,
      file_type: file.type,
      file_size: file.size,
      dimensions: metadata.dimensions || { width: 0, height: 0 },
      is_file_based: true,
      template_source: 'internal',
      preview_url: urlData.publicUrl,
      thumbnail_url: urlData.publicUrl,
      schema: processedData || {},
      category: metadata.category || 'business'
    };

    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .insert(templateData)
      .select()
      .single();

    if (templateError) {
      console.error('Template creation error:', templateError);
      // Cleanup uploaded file
      await supabaseClient.storage.from('ad_templates').remove([fileName]);
      
      return new Response(JSON.stringify({ error: templateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Template uploaded successfully:', template.id);

    return new Response(JSON.stringify({ 
      template,
      processedData: processedData ? 'Processed' : 'Not processed',
      message: 'Template uploaded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upload-template function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});