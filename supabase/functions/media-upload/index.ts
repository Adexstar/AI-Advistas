import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Uploads a media file to Cloudinary. Falls back to a 501 when Cloudinary is
// not configured so callers can surface a clear "provider not configured".
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({
          error:
            "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
        }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) throw new Error("file required");

    // Signed upload
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `timestamp=${timestamp}${apiSecret}`;
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(paramsToSign));
    const signature = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const upload = new FormData();
    upload.append("file", file);
    upload.append("api_key", apiKey);
    upload.append("timestamp", String(timestamp));
    upload.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: upload,
    });
    if (!res.ok) {
      const body = await res.text();
      return new Response(JSON.stringify({ error: "Cloudinary error", status: res.status, details: body }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const c = await res.json();
    return new Response(
      JSON.stringify({
        id: c.public_id,
        url: c.secure_url,
        thumbnailUrl: c.secure_url,
        provider: "cloudinary",
        kind: c.resource_type === "video" ? "video" : "image",
        width: c.width,
        height: c.height,
        meta: c,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
