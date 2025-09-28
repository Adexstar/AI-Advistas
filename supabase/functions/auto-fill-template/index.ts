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
    const { templateId, productName, templateStructure, platform, targetAudience } = await req.json();

    console.log('Auto-filling template:', { templateId, productName, platform, targetAudience });

    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    // Fetch template from database
    let template = null;
    if (templateId) {
      const { data: templateData, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) {
        console.error('Error fetching template:', error);
      } else {
        template = templateData;
      }
    }

    // Analyze template structure or use provided structure
    const structure = templateStructure || template?.schema || {
      elements: ['headline', 'subtitle', 'cta', 'description']
    };

    // Create a detailed prompt for template auto-fill
    const prompt = `Auto-fill this template structure with optimized content for:
    Product: ${productName}
    Platform: ${platform}
    Target Audience: ${targetAudience || 'General audience'}
    Template Elements: ${JSON.stringify(structure)}

    For each element in the template, generate appropriate content:
    - Headlines: Compelling, benefit-focused (max 60 chars)
    - Subtitles: Supporting details (max 150 chars)  
    - CTAs: Action-oriented (max 25 chars)
    - Descriptions: Product benefits (max 200 chars)
    - Body text: Engaging copy (max 300 chars)

    Return only valid JSON mapping each template element to its content:
    {
      "filledTemplate": {
        "headline": "Generated headline text",
        "subtitle": "Generated subtitle text", 
        "cta": "Action Text",
        "description": "Product description text"
      },
      "suggestions": {
        "primaryColor": "hsl(210, 100%, 50%)",
        "secondaryColor": "hsl(45, 100%, 60%)",
        "fontFamily": "Poppins"
      }
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
            content: 'You are an expert ad template designer and copywriter. Generate optimized content that fills template structures perfectly. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      throw new Error(`Groq API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Groq API auto-fill response received');

    let autoFillResult;
    try {
      const content = data.choices[0].message.content.trim();
      // Remove any potential markdown formatting
      const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
      autoFillResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI auto-fill response:', data.choices[0].message.content);
      // Fallback auto-fill
      autoFillResult = {
        filledTemplate: {
          headline: `Discover ${productName}`,
          subtitle: `Experience the best ${productName} has to offer`,
          cta: "Get Started",
          description: `Transform your experience with ${productName}. Join thousands of satisfied customers today.`
        },
        suggestions: {
          primaryColor: "hsl(210, 100%, 50%)",
          secondaryColor: "hsl(45, 100%, 60%)",
          fontFamily: "Inter"
        }
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
          template_id: templateId,
          suggestions: autoFillResult,
          suggestion_type: 'auto-fill'
        });
    }

    return new Response(JSON.stringify(autoFillResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-fill-template function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});