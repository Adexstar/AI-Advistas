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

    // Get user ID from auth header first
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
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

    // Handle PSD templates with layer-specific content generation
    if (template?.cached_data?.type === 'freepik-psd') {
      return await handlePSDTemplateAutoFill(template.cached_data, productName, platform, targetAudience, supabase, userId);
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

// Enhanced PSD template auto-fill handler
async function handlePSDTemplateAutoFill(psdData: any, productName: string, platform: string, targetAudience: string, supabase: any, userId: string | null) {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  // Extract text layers from PSD data
  const textLayers = psdData.layers.filter((layer: any) => layer.type === 'text');
  
  // Create smart prompt for PSD layer content
  const prompt = `You are an expert copywriter specializing in ${platform} ads. Generate content for a PSD template with the following layers:

Product: ${productName}
Platform: ${platform}
Target Audience: ${targetAudience || 'General audience'}

PSD Template Layers:
${textLayers.map((layer: any, index: number) => `${index + 1}. ${layer.name} (current: "${layer.content}")`).join('\n')}

Generate content that:
- Fits the character limits and style of each layer
- Is optimized for ${platform} advertising
- Appeals to the target audience
- Maintains visual hierarchy and readability

Return a JSON object with content for each layer, plus styling suggestions:

{
  "layerContent": {
    ${textLayers.map((layer: any) => `"${layer.id}": "content for ${layer.name}"`).join(',\n    ')}
  },
  "suggestions": {
    "primaryColor": "#hexcolor",
    "secondaryColor": "#hexcolor", 
    "fontFamily": "font name"
  }
}`;

  console.log('PSD Auto-fill prompt:', prompt);

  // Call Groq API
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!groqResponse.ok) {
    throw new Error(`Groq API error: ${groqResponse.statusText}`);
  }

  const groqResult = await groqResponse.json();
  const aiContent = groqResult.choices[0]?.message?.content;

  if (!aiContent) {
    throw new Error('No content generated by AI');
  }

  console.log('AI generated PSD content:', aiContent);

  // Parse AI response
  let parsedContent;
  try {
    parsedContent = JSON.parse(aiContent);
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    // Fallback parsing
    parsedContent = {
      layerContent: {},
      suggestions: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        fontFamily: 'Arial'
      }
    };
  }

  // Create filled template by updating layer content
  const filledTemplate = {
    ...psdData,
    layers: psdData.layers.map((layer: any) => {
      if (layer.type === 'text' && parsedContent.layerContent[layer.id]) {
        return {
          ...layer,
          content: parsedContent.layerContent[layer.id]
        };
      }
      return layer;
    })
  };

  // Save AI suggestions if user is authenticated
  if (userId) {
    const { error: saveError } = await supabase
      .from('ai_suggestions')
      .insert({
        user_id: userId,
        suggestion_type: 'psd-autofill',
        suggestions: {
          filledTemplate,
          aiSuggestions: parsedContent.suggestions,
          originalPrompt: prompt
        }
      });

    if (saveError) {
      console.error('Error saving AI suggestions:', saveError);
    }
  }

  return new Response(JSON.stringify({
    filledTemplate,
    suggestions: parsedContent.suggestions
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}