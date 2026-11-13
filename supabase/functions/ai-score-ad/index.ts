import { consumeAiQuota, requireUser } from "../_shared/guard.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdData {
  headline: string;
  body: string;
  imageAlt?: string;
  imageType?: string;
  platform: string;
  cta: string;
  targetAudience?: {
    ageRange?: string;
    interests?: string[];
  };
}

interface SimulatorScore {
  qualityScore: number;
  ctrEstimate: number;
  confidence: number;
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const gate = await requireUser(req);
  if (gate instanceof Response) return gate;

  try {
    const { ad, adId } = await req.json() as { ad: AdData; adId?: string };
    
    if (!ad || !ad.headline || !ad.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required ad data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute heuristic score
    const heuristicScore = computeHeuristicScore(ad);
    if (!Deno.env.get('OPENAI_API_KEY')) {
      return new Response(JSON.stringify({
        score: {
          qualityScore: heuristicScore,
          ctrEstimate: null,
          confidence: null,
          suggestions: [...getHeuristicSuggestions(ad), 'AI scoring is unavailable. This is a checklist, not a predicted result.'],
          aiAvailable: false,
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const denied = await consumeAiQuota(gate.client);
    if (denied) return denied;

    const aiScore = await getAIScore(ad);
    
    // Combine scores
    const finalScore: SimulatorScore = {
      qualityScore: Math.round((heuristicScore * 0.4) + (aiScore.qualityScore * 0.6)),
      ctrEstimate: aiScore.ctrEstimate,
      confidence: aiScore.confidence,
      suggestions: [...getHeuristicSuggestions(ad), ...aiScore.suggestions]
    };

    // Save to database
    const { error: dbError } = await supabase
      .from('ad_simulations')
      .upsert({
        ad_id: adId || null,
        user_id: user.id,
        score: finalScore
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(
      JSON.stringify({ score: finalScore }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-score-ad function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function computeHeuristicScore(ad: AdData): number {
  let score = 70; // Base score
  
  // Headline length check (optimal: 25-40 chars)
  const headlineLength = ad.headline.length;
  if (headlineLength >= 25 && headlineLength <= 40) {
    score += 10;
  } else if (headlineLength < 20 || headlineLength > 50) {
    score -= 5;
  }
  
  // Body length check (optimal: 80-125 chars)
  const bodyLength = ad.body.length;
  if (bodyLength >= 80 && bodyLength <= 125) {
    score += 10;
  } else if (bodyLength < 50 || bodyLength > 150) {
    score -= 5;
  }
  
  // CTA presence and quality
  if (ad.cta && ad.cta.length > 0) {
    score += 10;
    const strongCTAs = ['get', 'buy', 'shop', 'learn', 'try', 'start', 'discover'];
    if (strongCTAs.some(cta => ad.cta.toLowerCase().includes(cta))) {
      score += 5;
    }
  } else {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function getHeuristicSuggestions(ad: AdData): string[] {
  const suggestions: string[] = [];
  
  if (ad.headline.length < 20) {
    suggestions.push("Consider making your headline more descriptive");
  } else if (ad.headline.length > 50) {
    suggestions.push("Shorten your headline for better readability");
  }
  
  if (ad.body.length < 50) {
    suggestions.push("Add more details to your ad copy");
  } else if (ad.body.length > 150) {
    suggestions.push("Consider shortening your ad copy for better engagement");
  }
  
  if (!ad.cta || ad.cta.length === 0) {
    suggestions.push("Add a clear call-to-action button");
  }
  
  return suggestions;
}

async function getAIScore(ad: AdData): Promise<SimulatorScore> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) throw new Error('AI scoring is unavailable');

  try {
    const prompt = `You are an ad-quality assessor. Given the ad data below, return JSON with keys:
qualityScore (0-100), ctrEstimate (float %), confidence (0-1), suggestions (array of short strings).

Ad: 
- Headline: "${ad.headline}"
- Body: "${ad.body}"
- CTA: "${ad.cta}"
- Platform: "${ad.platform}"
- Image: ${ad.imageAlt || 'No image description'}
${ad.targetAudience ? `- Audience: Age ${ad.targetAudience.ageRange}, Interests: ${ad.targetAudience.interests?.join(', ')}` : ''}

Return only valid JSON with no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert ad analyst. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed.qualityScore !== 'number' || typeof parsed.ctrEstimate !== 'number') {
        throw new Error('AI scoring returned an incomplete result');
      }
      return {
        qualityScore: Math.max(0, Math.min(100, parsed.qualityScore)),
        ctrEstimate: Math.max(0, Math.min(10, parsed.ctrEstimate)),
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('AI scoring error:', error);
    throw error instanceof Error ? error : new Error('AI scoring is unavailable');
  }
}