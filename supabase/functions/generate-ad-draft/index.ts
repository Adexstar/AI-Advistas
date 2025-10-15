import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, goal, platform } = await req.json();

    if (!prompt || prompt.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Prompt must be at least 20 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert digital advertising AI assistant. 
Convert user's natural language ad descriptions into structured campaign data.

Extract the following information:
- Product name (concise, 3-100 characters)
- Detailed features/benefits (10-500 characters)
- Ad type (image, video, or carousel)
- Target platforms (facebook, instagram, tiktok, twitter, youtube, google)
- Target audience persona (select from: Young Adults (18-24), Young Professionals (25-34), Parents (30-45), Seniors (55+), College Students, Business Owners, High Income Individuals, General Audience)
- Additional audience details (optional)
- Website URL (optional, must be valid)
- Platform-specific placement options
- 3 suggested headlines
- Suggested call-to-action
- Confidence score (0-100)

Return ONLY valid JSON matching this exact structure:
{
  "product": "string",
  "details": "string",
  "adType": "image" | "video" | "carousel",
  "platforms": ["platform1", "platform2"],
  "audience": "audience persona",
  "simpleAudience": "additional details (optional)",
  "websiteUrl": "https://example.com (optional)",
  "placementOptions": {
    "facebook": ["Newsfeed", "Stories"],
    "instagram": ["Feed", "Stories"]
  },
  "aiGenerated": true,
  "aiMetadata": {
    "suggestedHeadlines": ["headline1", "headline2", "headline3"],
    "suggestedCTA": "call to action",
    "confidence": 85
  }
}

Available platform placements:
- facebook: Newsfeed, Stories, Marketplace, Video Feeds, Right Column, In-stream
- instagram: Feed, Stories, Explore, Reels, Shop, Profile
- tiktok: For You Page, Following Feed, TopView, Brand Takeover, Branded Effects, Hashtag Challenge
- twitter: Timeline, Profile, Search, Explore, Spaces, Trending Topics
- youtube: Pre-roll, Display, Overlay, Sponsored Cards, Bumper, Masthead
- google: Search, Display, YouTube, Shopping, Apps, Discovery`;

    const userPrompt = `User's ad description: "${prompt}"
${goal ? `Goal: ${goal}` : ''}
${platform && platform.length > 0 ? `Preferred platforms: ${platform.join(', ')}` : ''}

Generate a complete ad draft based on this information.`;

    console.log('Calling Groq API for ad draft generation...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('AI response received, parsing JSON...');
    
    let draft;
    try {
      draft = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure aiGenerated flag is set
    draft.aiGenerated = true;

    // Validate required fields
    if (!draft.product || !draft.details || !draft.adType || !draft.platforms || !draft.audience) {
      console.error('AI response missing required fields:', draft);
      return new Response(
        JSON.stringify({ error: 'Incomplete AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Ad draft generated successfully');

    return new Response(
      JSON.stringify({ draft }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ad-draft function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
