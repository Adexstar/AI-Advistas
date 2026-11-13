import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export type Authed = {
  user: { id: string };
  client: SupabaseClient;
};

export async function requireUser(req: Request): Promise<Authed | Response> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Sign in required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return json({ error: "Auth is not configured" }, 500);
  const client = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return json({ error: "Sign in required" }, 401);
  return { user: { id: data.user.id }, client };
}

export async function requireAdmin(req: Request): Promise<Authed | Response> {
  const gate = await requireUser(req);
  if (gate instanceof Response) return gate;
  const { data, error } = await gate.client.rpc("has_role", {
    _user_id: gate.user.id,
    _role: "admin",
  });
  if (error || data !== true) return json({ error: "Admin access required" }, 403);
  return gate;
}

/** Returns a denial response, or null when the signed-in user still has quota. */
export async function consumeAiQuota(client: SupabaseClient): Promise<Response | null> {
  const { data, error } = await client.rpc("consume_quota", { p_feature: "ai_generations" });
  if (error) return json({ error: "Could not check your plan limit. Apply the quota migration and try again." }, 503);
  const result = (data ?? {}) as { allowed?: boolean; used?: number; limit?: number };
  if (!result.allowed) {
    return json({
      error: "Plan limit reached",
      used: result.used ?? null,
      limit: result.limit ?? null,
    }, 402);
  }
  return null;
}
