import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("VEO_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "VEO_API_KEY not configured" }), {
      status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "Veo adapter not yet implemented" }), {
    status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
