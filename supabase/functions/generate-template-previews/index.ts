// Generates preview images for AdVista Originals templates via Lovable AI
// Gateway (google/gemini-3.1-flash-image), uploads the PNG to Cloudinary, and
// writes ONLY the preview_url back to the templates row. Runs sequentially
// with a small delay to avoid rate limits. Idempotent — a `force` flag will
// regenerate already-populated rows.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME")!;
const CLOUD_KEY = Deno.env.get("CLOUDINARY_API_KEY")!;
const CLOUD_SECRET = Deno.env.get("CLOUDINARY_API_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  objective: string | null;
  metadata: Record<string, unknown> | null;
  preview_url: string | null;
}

const buildPrompt = (t: TemplateRow): string => {
  const emotion = (t.metadata as { emotion?: string } | null)?.emotion ?? "confident";
  return [
    `Professional advertising creative preview for a template titled "${t.name}".`,
    t.description ?? "",
    `Category: ${t.category ?? "general"}. Platform: ${t.platform ?? "Instagram"}. Goal: ${t.objective ?? "engagement"}. Mood: ${emotion}.`,
    `Studio-quality mockup, photorealistic where relevant, cinematic lighting, balanced typography suggestion, plenty of negative space, editorial ad design, no watermarks, no logos.`,
    `4:5 portrait aspect, poster-style layout.`,
  ]
    .filter(Boolean)
    .join(" ");
};

async function generateImageB64(prompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
      // non-streaming for a server job
    }),
  });
  if (!res.ok) {
    throw new Error(`Gateway ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image data returned: ${JSON.stringify(json).slice(0, 200)}`);
  return b64;
}

async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function uploadToCloudinary(b64: string, publicId: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  // Sign the params (sorted, alphabetical) + secret
  const paramsToSign = `folder=advista/originals&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = await sha1Hex(paramsToSign + CLOUD_SECRET);

  const form = new FormData();
  form.append("file", `data:image/png;base64,${b64}`);
  form.append("api_key", CLOUD_KEY);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", "advista/originals");
  form.append("public_id", publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.secure_url as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const force = Boolean(body.force);
    const only: string[] | undefined = body.only;
    const limit: number = Math.min(Number(body.limit ?? 30), 30);

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    let query = sb
      .from("templates")
      .select("id,name,description,category,platform,objective,metadata,preview_url");
    if (only && only.length) query = query.in("id", only);
    else if (!force) query = query.or("preview_url.is.null,preview_url.like./placeholder%,preview_url.eq.");
    const { data, error } = await query.order("name").limit(limit);
    if (error) throw error;

    const rows = (data ?? []) as TemplateRow[];
    const results: Array<{ id: string; name: string; status: string; url?: string; error?: string }> = [];

    for (const t of rows) {
      try {
        const prompt = buildPrompt(t);
        const b64 = await generateImageB64(prompt);
        const publicId = `${t.id}`;
        const url = await uploadToCloudinary(b64, publicId);
        const { error: upErr } = await sb
          .from("templates")
          .update({ preview_url: url })
          .eq("id", t.id);
        if (upErr) throw upErr;
        results.push({ id: t.id, name: t.name, status: "ok", url });
      } catch (e) {
        results.push({ id: t.id, name: t.name, status: "error", error: (e as Error).message });
      }
      // gentle pace
      await new Promise((r) => setTimeout(r, 800));
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
