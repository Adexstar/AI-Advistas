import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const {
      product,
      details,
      platforms,
      audience,
      simpleAudience,
      adType,
      placementOptions,
      websiteUrl
    } = await req.json();

    console.log('Generating AI campaign for:', { product, platforms, audience });

    // Build comprehensive prompt for GPT-4o
    const platformsText = platforms.join(', ');
    const placementsText = Object.entries(placementOptions || {})
      .map(([platform, placements]) => 
        `${platform}: ${Array.isArray(placements) ? placements.join(', ') : 'All placements'}`
      ).join('; ');

    const prompt = `You are an expert digital marketing strategist. Generate a comprehensive advertising campaign for the following:

PRODUCT/SERVICE: ${product}
DETAILS: ${details}
TARGET PLATFORMS: ${platformsText}
PLACEMENTS: ${placementsText}
PRIMARY AUDIENCE: ${audience}
ADDITIONAL AUDIENCE DETAILS: ${simpleAudience || 'None provided'}
AD TYPE: ${adType}
WEBSITE: ${websiteUrl || 'Not provided'}

Generate a detailed campaign strategy including:

1. OPTIMIZED HEADLINES: Create 3-5 compelling headlines for each platform, tailored to that platform's audience and style
2. BODY COPY: Write engaging ad copy for each platform (considering character limits and platform voice)
3. CALL-TO-ACTION: Suggest the best CTAs for each platform and placement
4. AUDIENCE INSIGHTS: Provide detailed targeting recommendations, interests, demographics, and behaviors
5. PLACEMENT STRATEGY: Explain why certain placements work best for this product/audience combination
6. CREATIVE RECOMMENDATIONS: Suggest visual elements, video concepts, or carousel ideas that would work best
7. BUDGET ALLOCATION: Recommend how to distribute budget across platforms for optimal performance
8. OPTIMIZATION TIPS: Provide specific tips for improving performance on each platform

Format your response as a structured JSON with the following structure:
{
  "campaign_overview": {
    "strategy_summary": "Brief overall strategy",
    "key_messaging": "Core message themes",
    "success_metrics": ["metric1", "metric2"]
  },
  "platform_campaigns": {
    "facebook": {
      "headlines": ["headline1", "headline2", "headline3"],
      "body_copy": "Platform-specific copy",
      "cta": "Best CTA for platform",
      "targeting": {
        "demographics": "Age, gender, location details",
        "interests": ["interest1", "interest2"],
        "behaviors": ["behavior1", "behavior2"]
      },
      "placement_strategy": "Why these placements work",
      "creative_direction": "Visual/creative recommendations"
    }
  },
  "budget_recommendations": {
    "platform_allocation": "How to split budget",
    "recommended_daily_budget": "Suggested amount",
    "scaling_strategy": "How to increase spend"
  },
  "optimization_tips": ["tip1", "tip2", "tip3"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert digital marketing strategist with deep knowledge of all major advertising platforms. Always respond with valid JSON that matches the requested structure exactly.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('AI response received:', generatedContent.substring(0, 200) + '...');

    // Try to parse JSON response
    let campaignData: any;
    try {
      campaignData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Provide fallback response structure
      campaignData = {
        campaign_overview: {
          strategy_summary: "AI-generated campaign strategy for " + product,
          key_messaging: "Highlight unique value proposition and benefits",
          success_metrics: ["Click-through rate", "Conversions", "Cost per acquisition"]
        },
        platform_campaigns: {} as Record<string, any>,
        budget_recommendations: {
          platform_allocation: "Distribute budget based on audience size and engagement",
          recommended_daily_budget: "$50-100 to start",
          scaling_strategy: "Increase budget on best performing ads by 20% daily"
        },
        optimization_tips: [
          "Test multiple ad variations",
          "Monitor performance daily",
          "Adjust targeting based on results"
        ]
      };
      
      // Add basic campaign data for each platform
      if (Array.isArray(platforms)) {
        platforms.forEach((platform: string) => {
          campaignData.platform_campaigns[platform] = {
            headlines: [`Get ${product} Now!`, `Transform Your Experience`, `Don't Miss Out!`],
            body_copy: `Discover the amazing benefits of ${product}. ${details ? details.substring(0, 100) : 'Great product'}...`,
            cta: platform === 'google' ? 'Learn More' : 'Shop Now',
            targeting: {
              demographics: audience || 'General audience',
              interests: ["Relevant interests based on product"],
              behaviors: ["Online shoppers", "Mobile users"]
            },
            placement_strategy: `Recommended placements for ${platform} based on audience behavior`,
            creative_direction: `Use high-quality visuals showcasing ${product} benefits`
          };
        });
      }
    }

    return new Response(JSON.stringify({ campaign: campaignData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-campaign function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI campaign';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});