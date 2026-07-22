// generate-ai-template — Layer 3D backend.
// Input: a TemplateBlueprint (from AITemplateGeneratorService) + optional prompt.
// Output: { copy: {headline, subheadline, body, cta, offer}, heroImageUrl,
//           reasoning: string[], confidence: number }.
// No frontend calls a model provider — everything routes through here.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "google/gemini-3.6-flash";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Blueprint {
  layout: { layout: string; cta_style: string; spacing: string; headline_position: string; visual_focus: string; aspect: { width: number; height: number } };
  style: { palette: Record<string, string>; font: { heading: string; body: string }; imageStrategy: string; logoUrl?: string };
  context: { brandName?: string | null; category?: string | null; goal?: string | null; platform?: string | null; productName?: string | null; targetAudience?: string | null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ success: false, error: "Missing LOVABLE_API_KEY" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { blueprint?: Blueprint; prompt?: string | null } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const bp = body.blueprint;
  if (!bp?.context || !bp?.layout) {
    return new Response(JSON.stringify({ success: false, error: "Missing blueprint" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sys = [
    "You are AdVista's AI Creative Director. Generate concise, high-converting marketing copy for one ad creative.",
    "Return STRICT JSON only. No prose, no markdown.",
    "Schema: { headline: string (max 8 words), subheadline?: string (max 14 words), body?: string (max 20 words), cta: string (2-4 words), offer?: string (max 8 words), reasoning: string[] (2-4 short bullets), confidence: number (0..1) }",
  ].join("\n");

  const user = [
    `Brand: ${bp.context.brandName ?? "Unspecified"}`,
    `Category: ${bp.context.category ?? "General"}`,
    `Goal: ${bp.context.goal ?? "conversions"}`,
    `Platform: ${bp.context.platform ?? "instagram"}`,
    `Product: ${bp.context.productName ?? "n/a"}`,
    `Audience: ${bp.context.targetAudience ?? "broad"}`,
    `Layout: ${bp.layout.layout} • focus=${bp.layout.visual_focus} • cta=${bp.layout.cta_style}`,
    body.prompt ? `User prompt: ${body.prompt}` : "",
  ].filter(Boolean).join("\n");

  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ success: false, error: `AI ${res.status}: ${text.slice(0, 200)}` }), {
        status: res.status === 402 || res.status === 429 ? res.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    return new Response(JSON.stringify({
      success: true,
      copy: {
        headline: parsed.headline ?? "Discover Something New",
        subheadline: parsed.subheadline,
        body: parsed.body,
        cta: parsed.cta ?? "Shop Now",
        offer: parsed.offer,
      },
      heroImageUrl: null, // image sourcing handled by MediaService in a later pass
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.75,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
