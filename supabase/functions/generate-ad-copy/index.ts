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
    const { productName, templateType, platform, targetAudience, additionalContext } = await req.json();

    console.log('Generating AI copy for:', { productName, templateType, platform, targetAudience });

    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    // Create a detailed prompt for copy generation
    const prompt = `Generate compelling ad copy for:
    Product: ${productName}
    Template Type: ${templateType}
    Platform: ${platform}
    Target Audience: ${targetAudience || 'General audience'}
    Additional Context: ${additionalContext || 'None'}

    Please create:
    1. A compelling headline (max 60 characters for most platforms)
    2. An engaging subtitle/description (max 150 characters)
    3. A strong call-to-action (max 25 characters)
    4. 2-3 alternative headlines for A/B testing

    Focus on benefits, create urgency, and match the platform's style.
    Return only valid JSON in this exact format:
    {
      "headline": "Primary headline text",
      "subtitle": "Engaging subtitle text",
      "cta": "Action Text",
      "alternativeHeadlines": ["Alt 1", "Alt 2", "Alt 3"]
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
            content: 'You are an expert copywriter specializing in high-converting ad copy. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      throw new Error(`Groq API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Groq API response received');

    let adCopy;
    try {
      const content = data.choices[0].message.content.trim();
      // Remove any potential markdown formatting
      const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
      adCopy = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', data.choices[0].message.content);
      // Fallback copy generation
      adCopy = {
        headline: `Discover ${productName}`,
        subtitle: `Experience the best ${productName} has to offer`,
        cta: "Learn More",
        alternativeHeadlines: [
          `Get ${productName} Today`,
          `Try ${productName} Now`,
          `${productName} Awaits`
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
          suggestions: adCopy,
          suggestion_type: 'copy'
        });
    }

    return new Response(JSON.stringify({ copy: adCopy }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ad-copy function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});