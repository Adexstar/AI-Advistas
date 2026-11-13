// Reads provider metrics only. It never writes sample or random campaign data.
import { corsHeaders, json, requireUser } from "../_shared/guard.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const gate = await requireUser(req);
    if (gate instanceof Response) return gate;

    const { campaignId } = await req.json();
    if (!campaignId) return json({ error: "campaignId required" }, 400);

    const { data: campaign, error } = await gate.client
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .maybeSingle();
    if (error) return json({ error: "Could not check campaign ownership" }, 500);
    if (!campaign) return json({ error: "Campaign not found" }, 404);

    const { data: connections } = await gate.client
      .from("platform_connections")
      .select("id,platform")
      .eq("is_active", true);

    return json({
      synced: 0,
      unavailable: true,
      reason: connections?.length
        ? "Connected accounts do not have a metric provider yet. No sample data was written."
        : "Connect a platform before syncing metrics. No sample data was written.",
      platforms: [],
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Sync failed", synced: 0 }, 500);
  }
});
