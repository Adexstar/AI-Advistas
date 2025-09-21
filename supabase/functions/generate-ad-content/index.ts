import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product, platform, adType } = await req.json();
    
    if (!product) {
      throw new Error('Product description is required');
    }

    const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('Google Gemini API key not configured');
    }

    // Platform-specific tone and style
    const platformStyles = {
      facebook: "professional yet engaging, focusing on community and connections",
      instagram: "visual-first, trendy, and lifestyle-focused with emojis",
      tiktok: "fun, energetic, and Gen-Z friendly with trending language",
      youtube: "informative and educational with strong hooks",
      linkedin: "professional, B2B focused, and industry expertise-driven"
    };

    const style = platformStyles[platform as keyof typeof platformStyles] || "engaging and professional";

    const prompt = `Generate compelling ad copy for ${product} on ${platform}.

Style: ${style}
Ad Type: ${adType}

Create:
1. A compelling headline (max 25 words)
2. Body text that highlights key benefits (max 90 words)
3. A strong call-to-action (max 10 words)
4. 3-5 relevant hashtags for the platform

Format as JSON with keys: headline, body, cta, hashtags`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(data.error?.message || 'Failed to generate ad content');
    }

    const generatedText = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    let adContent;
    
    if (jsonMatch) {
      try {
        adContent = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Fallback parsing if JSON is malformed
        adContent = {
          headline: "Discover Amazing " + product,
          body: `Experience the best ${product} has to offer. Quality, innovation, and style come together in perfect harmony.`,
          cta: "Shop Now",
          hashtags: ["#" + product.replace(/\s+/g, ''), "#quality", "#innovation"]
        };
      }
    } else {
      // Fallback if no JSON found
      adContent = {
        headline: "Discover Amazing " + product,
        body: generatedText.substring(0, 200),
        cta: "Learn More",
        hashtags: ["#" + product.replace(/\s+/g, ''), "#amazing"]
      };
    }

    console.log('Generated ad content:', adContent);

    return new Response(JSON.stringify({ 
      success: true, 
      content: adContent,
      prompt: prompt 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating ad content:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});