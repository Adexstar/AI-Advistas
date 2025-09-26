import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product, platform, adContent } = await req.json();
    
    if (!product) {
      throw new Error('Product description is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Platform-specific image specifications
    const platformSpecs = {
      facebook: { size: "1200x630", style: "professional social media post" },
      instagram: { size: "1080x1080", style: "aesthetic square format with lifestyle elements" },
      tiktok: { size: "1080x1920", style: "vertical mobile-first design" },
      youtube: { size: "1280x720", style: "thumbnail-style with bold text overlay" },
      linkedin: { size: "1200x627", style: "professional business-oriented" }
    };

    const specs = platformSpecs[platform as keyof typeof platformSpecs] || platformSpecs.facebook;

    // Create a detailed image prompt
    const imagePrompt = `Create a professional advertisement image for ${product}. 
    Style: ${specs.style}
    
    The image should:
    - Show the product in an appealing, high-quality setting
    - Be optimized for ${platform} (${specs.size})
    - Include lifestyle elements that appeal to the target audience
    - Have space for text overlay if needed
    - Be visually striking and scroll-stopping
    - Use modern, clean design aesthetics
    
    Product context: ${adContent?.headline || product}
    
    Ultra high resolution, professional photography style, clean composition.`;

    console.log('Generating image with prompt:', imagePrompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "vivid"
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Failed to generate image');
    }

    const imageUrl = data.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image generated');
    }

    console.log('Generated image URL:', imageUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      imageUrl: imageUrl,
      prompt: imagePrompt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating ad image:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});