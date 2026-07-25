import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Seam for Runway. Returns 501 until RUNWAY_API_KEY is set and the caller
// wires up the specific Runway product (Gen-3, background removal, etc.).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("RUNWAY_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "RUNWAY_API_KEY not configured" }), {
      status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "Runway adapter not yet implemented" }), {
    status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
