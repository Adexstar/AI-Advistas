import { consumeAiQuota, json, requireUser } from "../_shared/guard.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Cheap Runware image model (Flux Schnell). The provider returns the real
// error if this id is retired, and the panel shows that error.
const RUNWARE_IMAGE_MODEL = "runware:101@1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = await requireUser(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt || body.product || "").trim();
  const provider = body.provider === "openai" ? "openai" : body.provider === "runware" ? "runware" : null;
  if (!prompt) return json({ error: "A prompt is required" }, 400);

  const runwareKey = Deno.env.get("RUNWARE_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const chosen = provider ?? (runwareKey ? "runware" : openaiKey ? "openai" : null);
  if (!chosen) return json({ error: "Add RUNWARE_API_KEY or OPENAI_API_KEY." }, 501);
  if (chosen === "runware" && !runwareKey) return json({ error: "Add RUNWARE_API_KEY." }, 501);
  if (chosen === "openai" && !openaiKey) return json({ error: "Add OPENAI_API_KEY." }, 501);

  const denied = await consumeAiQuota(gate.client);
  if (denied) return denied;

  try {
    if (chosen === "runware") {
      const images = await runwareImages(runwareKey!, prompt, body);
      return json({ success: true, imageUrl: images[0], images, provider: "runware", prompt });
    }
    const imageUrl = await openAiImage(openaiKey!, prompt, body);
    return json({ success: true, imageUrl, images: [imageUrl], provider: "openai", prompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed";
    return json({ success: false, error: message }, 500);
  }
});

async function runwareImages(key: string, prompt: string, body: Record<string, unknown>): Promise<string[]> {
  const width = snap(Number(body.width) || 1024);
  const height = snap(Number(body.height) || 1024);
  const count = Math.min(4, Math.max(1, Number(body.count) || 1));
  const reference = firstHttp(body.references);
  const tasks = Array.from({ length: count }, () => ({
    taskType: "imageInference",
    taskUUID: crypto.randomUUID(),
    model: RUNWARE_IMAGE_MODEL,
    positivePrompt: prompt,
    width,
    height,
    outputType: "URL",
    outputFormat: "JPG",
    ...(reference ? { seedImage: reference } : {}),
  }));
  const data = await runware(key, tasks);
  const images = data.map((row) => row.imageURL).filter((url): url is string => typeof url === "string" && url.length > 0);
  if (!images.length) throw new Error("Runware returned no image");
  return images;
}

async function openAiImage(key: string, prompt: string, body: Record<string, unknown>): Promise<string> {
  const platform = body.platform ? ` for ${body.platform}` : "";
  const extra = typeof body.adContent === "string" && body.adContent ? `. ${body.adContent}` : "";
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: `Professional ad image${platform}: ${prompt}${extra}. No extra text in the picture.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI image failed (${res.status})`);
  const url = data?.data?.[0]?.url;
  if (typeof url !== "string") throw new Error("OpenAI returned no image");
  return url;
}

async function runware(key: string, tasks: unknown[]): Promise<Array<Record<string, string>>> {
  const res = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(tasks),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.errors?.length) {
    const message = payload?.errors?.[0]?.message || payload?.error || `Runware failed (${res.status})`;
    throw new Error(message);
  }
  return Array.isArray(payload?.data) ? payload.data : [];
}

function snap(value: number): number {
  const n = Number.isFinite(value) ? value : 1024;
  return Math.max(256, Math.min(1440, Math.round(n / 64) * 64));
}

function firstHttp(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const url = value.find((item) => typeof item === "string" && item.startsWith("http"));
  return typeof url === "string" ? url : null;
}
