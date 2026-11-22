import { consumeAiQuota, json, requireUser } from "../_shared/guard.ts";
import { buildDirectorPrompt, ENHANCE_SECRETS } from "../_shared/directorPrompt.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM = "You write one production prompt for an ad. Follow the brief exactly. Return only the prompt, with the same headings. Do not add a preamble.";
const SHOTS_SYSTEM = "Return only JSON. No markdown. Shape: {\"look\":\"\",\"lighting\":\"\",\"musicMood\":\"\",\"shots\":[{\"camera\":\"\",\"action\":\"\",\"onScreenText\":\"\",\"transition\":\"cut\"}]}. Three to six shots. onScreenText is at most six words. transition is cut, dissolve, or match cut.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = await requireUser(req);
  if (gate instanceof Response) return gate;
  const denied = await consumeAiQuota(gate.client);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "video" ? "video" : "image";
  const brief = buildDirectorPrompt({
    mode,
    category: body.category ?? "generic",
    prompt: typeof body.prompt === "string" ? body.prompt : "",
    duration: Number(body.duration) || 5,
    aspect: typeof body.aspect === "string" ? body.aspect : "16:9",
  });
  const references = Array.isArray(body.references)
    ? body.references.filter((url: unknown) => typeof url === "string" && url.startsWith("http")).slice(0, 4)
    : [];
  const system = body.format === "shots" ? SHOTS_SYSTEM : SYSTEM;
  const ask = body.format === "shots"
    ? `${brief}\n\nReturn the JSON shot list for this brief. The shots together last ${Number(body.duration) || 10} seconds.`
    : brief;

  try {
    const result = await complete(ask, references, system);
    return json({ prompt: result.text, provider: result.provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enhance failed";
    const missing = message.includes("not configured");
    return json({ error: missing ? `Add ${ENHANCE_SECRETS.join(" or ")}.` : message }, missing ? 501 : 500);
  }
});

async function complete(brief: string, references: string[], system = SYSTEM): Promise<{ text: string; provider: string }> {
  if (Deno.env.get("GROQ_API_KEY")) return { text: await chat("https://api.groq.com/openai/v1/chat/completions", Deno.env.get("GROQ_API_KEY")!, "openai/gpt-oss-120b", brief, [], system), provider: "groq" };
  if (Deno.env.get("OPENAI_API_KEY")) return { text: await chat("https://api.openai.com/v1/chat/completions", Deno.env.get("OPENAI_API_KEY")!, "gpt-4o-mini", brief, references, system), provider: "openai" };
  const gemini = Deno.env.get("GOOGLE_GEMINI_API_KEY") || Deno.env.get("GEMINI_API_KEY");
  if (gemini) return { text: await geminiChat(gemini, brief, references, system), provider: "gemini" };
  if (Deno.env.get("ANTHROPIC_API_KEY")) return { text: await claude(Deno.env.get("ANTHROPIC_API_KEY")!, brief, system), provider: "anthropic" };
  if (Deno.env.get("LOVABLE_API_KEY")) return { text: await chat("https://ai.gateway.lovable.dev/v1/chat/completions", Deno.env.get("LOVABLE_API_KEY")!, "google/gemini-3.6-flash", brief, [], system), provider: "lovable" };
  throw new Error("not configured");
}

async function chat(url: string, key: string, model: string, brief: string, images: string[], system = SYSTEM): Promise<string> {
  const user = images.length
    ? [
      { type: "text", text: brief },
      ...images.map((image) => ({ type: "image_url", image_url: { url: image } })),
    ]
    : brief;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 900,
    }),
  });
  const data = await res.json().catch(() => ({}));
  const text = data?.choices?.[0]?.message?.content;
  if (!res.ok || typeof text !== "string" || !text.trim()) {
    throw new Error(data?.error?.message || `The text model returned nothing (${res.status})`);
  }
  return text.trim();
}

async function geminiChat(key: string, brief: string, images: string[], system = SYSTEM): Promise<string> {
  const parts: Array<Record<string, unknown>> = [{ text: `${system}\n\n${brief}` }];
  for (const url of images) {
    parts.push({ fileData: { mimeType: "image/jpeg", fileUri: url } });
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.4, maxOutputTokens: 900 } }),
    },
  );
  const data = await res.json().catch(() => ({}));
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!res.ok || typeof text !== "string" || !text.trim()) {
    throw new Error(data?.error?.message || `Gemini returned nothing (${res.status})`);
  }
  return text.trim();
}

async function claude(key: string, brief: string, system = SYSTEM): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      system,
      messages: [{ role: "user", content: brief }],
      max_tokens: 900,
      temperature: 0.4,
    }),
  });
  const data = await res.json().catch(() => ({}));
  const text = data?.content?.[0]?.text;
  if (!res.ok || typeof text !== "string" || !text.trim()) {
    throw new Error(data?.error?.message || `Claude returned nothing (${res.status})`);
  }
  return text.trim();
}
