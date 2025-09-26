import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RUNWARE_API_ENDPOINT = "https://api.runware.ai/v1";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const { product, platform, adContent } = await req.json();
    
    if (!product || !platform || !adContent) {
      throw new Error('Missing required fields: product, platform, and adContent are required');
    }

    const runwareApiKey = Deno.env.get('RUNWARE_API_KEY');
    if (!runwareApiKey) {
      throw new Error('RunAI API key not configured');
    }

    console.log('Generating video for product:', product, 'platform:', platform);

    // Create video prompt based on platform and product
    let aspectRatio = "16:9"; // Default YouTube horizontal
    let videoDuration = 30; // seconds
    
    if (platform === 'tiktok' || platform === 'instagram-story') {
      aspectRatio = "9:16"; // Vertical for TikTok/Stories
      videoDuration = 15;
    } else if (platform === 'instagram-post') {
      aspectRatio = "1:1"; // Square for Instagram posts
      videoDuration = 15;
    }

    // Enhanced video prompt incorporating the ad content
    const videoPrompt = `Create a professional product showcase video for ${product}. 
    Style: Modern, clean, dynamic with smooth transitions. 
    Content: Show the product prominently with lifestyle shots. 
    Text overlay: "${adContent.headline}" as main title.
    Mood: Engaging and premium, suitable for ${platform}.
    Quality: High-definition, commercial-grade.
    Duration: ${videoDuration} seconds.
    No people faces, focus on product and lifestyle elements.`;

    console.log('Video generation prompt:', videoPrompt);

    // Generate video using RunAI video model
    const videoResponse = await fetch(RUNWARE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          taskType: "authentication",
          apiKey: runwareApiKey
        },
        {
          taskType: "videoInference",
          taskUUID: crypto.randomUUID(),
          positivePrompt: videoPrompt,
          width: aspectRatio === "9:16" ? 720 : aspectRatio === "1:1" ? 1080 : 1920,
          height: aspectRatio === "9:16" ? 1280 : aspectRatio === "1:1" ? 1080 : 1080,
          model: "runware:video@1", // Assuming this is the video model
          numberResults: 1,
          duration: videoDuration,
          outputFormat: "MP4",
          quality: "high"
        }
      ])
    });

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error('RunAI API error:', videoResponse.status, errorText);
      throw new Error(`RunAI API error: ${videoResponse.status}`);
    }

    const videoData = await videoResponse.json();
    console.log('RunAI video response:', videoData);

    // Extract video URL from response
    const videoResult = videoData.data?.find((item: any) => item.taskType === 'videoInference');
    if (!videoResult || !videoResult.videoURL) {
      console.error('No video URL in response:', videoData);
      throw new Error('Failed to generate video - no URL returned');
    }

    const videoUrl = videoResult.videoURL;
    console.log('Generated video URL:', videoUrl);

    // Create thumbnail from first frame (simplified approach)
    const thumbnailUrl = videoUrl.replace('.mp4', '_thumbnail.jpg'); // Assuming RunAI provides thumbnails

    const result = {
      success: true,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      aspectRatio: aspectRatio,
      duration: videoDuration,
      platform: platform,
      prompt: videoPrompt
    };

    console.log('Video generation successful:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating video:', error);
    
    // Return a fallback response for development
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred',
      // Temporary placeholder for development
      videoUrl: `https://via.placeholder.com/1920x1080/000000/ffffff?text=Video+Generation+Coming+Soon`,
      thumbnailUrl: `https://via.placeholder.com/1920x1080/000000/ffffff?text=Video+Preview`,
      message: "Video generation is being implemented. This is a placeholder."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});