// AI Gateway — routes AI requests to the appropriate model provider
// Every AI request from the Marketing Brain flows through this function.
// Supports OpenAI, Groq, Gemini, and Claude through interchangeable adapters.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

interface GatewayRequest {
  systemPrompt: string;
  userPrompt: string;
  specialist: string;
  temperature?: number;
  maxTokens?: number;
  schema?: Record<string, unknown>;
  preferredProvider?: "openai" | "groq" | "gemini" | "claude";
}

interface GatewayResponse {
  content: string;
  provider: string;
  model: string;
  latency: number;
  tokensUsed?: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: GatewayRequest = await req.json();
    const start = performance.now();

    const provider = body.preferredProvider ?? getDefaultProvider(body.specialist);
    const model = getModelForProvider(provider, body.specialist);

    let content: string;

    switch (provider) {
      case "openai":
        content = await callOpenAI(body.systemPrompt, body.userPrompt, model, body.temperature, body.maxTokens);
        break;
      case "groq":
        content = await callGroq(body.systemPrompt, body.userPrompt, model, body.temperature, body.maxTokens);
        break;
      case "gemini":
        content = await callGemini(body.systemPrompt, body.userPrompt, model, body.temperature, body.maxTokens);
        break;
      case "claude":
        content = await callClaude(body.systemPrompt, body.userPrompt, model, body.temperature, body.maxTokens);
        break;
      default:
        content = await callOpenAI(body.systemPrompt, body.userPrompt, model, body.temperature, body.maxTokens);
    }

    const latency = Math.round(performance.now() - start);

    const response: GatewayResponse = {
      content,
      provider,
      model,
      latency,
      tokensUsed: undefined,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({
      content: null,
      provider: "error",
      model: "none",
      latency: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function getDefaultProvider(specialist: string): string {
  const providerMap: Record<string, string> = {
    creative_strategist: "groq",
    design_advisor: "openai",
    brand_guardian: "groq",
    campaign_optimizer: "groq",
    analytics_expert: "openai",
    publishing_advisor: "groq",
    general: "openai",
  };
  return providerMap[specialist] ?? "openai";
}

function getModelForProvider(provider: string, _specialist: string): string {
  const models: Record<string, string> = {
    openai: "gpt-4o-mini",
    groq: "openai/gpt-oss-120b",
    gemini: "gemini-2.0-flash",
    claude: "claude-3-haiku-20240307",
  };
  return models[provider] ?? "gpt-4o-mini";
}

async function callOpenAI(system: string, user: string, model: string, temperature = 0.7, maxTokens = 500): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "No response generated";
}

async function callGroq(system: string, user: string, model: string, temperature = 0.7, maxTokens = 500): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "No response generated";
}

async function callGemini(system: string, user: string, model: string, temperature = 0.7, maxTokens = 500): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    },
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response generated";
}

async function callClaude(system: string, user: string, model: string, temperature = 0.7, maxTokens = 500): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      system,
      messages: [{ role: "user", content: user }],
      max_tokens: maxTokens,
      temperature,
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "No response generated";
}
