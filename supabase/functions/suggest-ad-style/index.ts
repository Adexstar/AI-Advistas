import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const groqApiKey = Deno.env.get('GROQ_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { productCategory, brandPersonality, platform, templateType } = await req.json();

    console.log('Generating AI style suggestions for:', { productCategory, brandPersonality, platform, templateType });

    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    // Create a detailed prompt for style generation
    const prompt = `Generate 3 distinct design style suggestions for:
    Product Category: ${productCategory}
    Brand Personality: ${brandPersonality || 'Professional'}
    Platform: ${platform}
    Template Type: ${templateType}

    For each style, provide:
    1. Primary color (HSL format)
    2. Secondary/accent color (HSL format)
    3. Font family recommendation
    4. Style name/theme
    5. Brief description

    Consider platform best practices:
    - Facebook: Bold, engaging colors
    - Instagram: Trendy, aesthetic colors
    - LinkedIn: Professional, trustworthy colors
    - Google Ads: High contrast, readable colors

    Return only valid JSON in this exact format:
    {
      "styles": [
        {
          "name": "Style Theme Name",
          "description": "Brief style description",
          "primaryColor": "hsl(210, 100%, 50%)",
          "secondaryColor": "hsl(45, 100%, 60%)",
          "fontFamily": "Poppins"
        }
      ]
    }`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are an expert UI/UX designer specializing in ad design and color theory. Always respond with valid JSON only. Use HSL color format exclusively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 600
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      throw new Error(`Groq API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Groq API style response received');

    let stylesSuggestion;
    try {
      const content = data.choices[0].message.content.trim();
      // Remove any potential markdown formatting
      const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
      stylesSuggestion = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI style response:', data.choices[0].message.content);
      // Fallback style suggestions
      stylesSuggestion = {
        styles: [
          {
            name: "Professional Blue",
            description: "Trust-building corporate style",
            primaryColor: "hsl(210, 100%, 50%)",
            secondaryColor: "hsl(45, 100%, 60%)",
            fontFamily: "Inter"
          },
          {
            name: "Vibrant Energy",
            description: "Bold and engaging modern style",
            primaryColor: "hsl(340, 85%, 55%)",
            secondaryColor: "hsl(25, 90%, 55%)",
            fontFamily: "Poppins"
          },
          {
            name: "Elegant Minimal",
            description: "Clean and sophisticated design",
            primaryColor: "hsl(0, 0%, 20%)",
            secondaryColor: "hsl(200, 10%, 85%)",
            fontFamily: "Playfair Display"
          }
        ]
      };
    }

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    // Save AI suggestion to database if user is authenticated
    if (userId) {
      await supabase
        .from('ai_suggestions')
        .insert({
          user_id: userId,
          suggestions: stylesSuggestion,
          suggestion_type: 'style'
        });
    }

    return new Response(JSON.stringify(stylesSuggestion), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-ad-style function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});