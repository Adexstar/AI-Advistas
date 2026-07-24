// Layer 6: Unified analytics sync — normalizes external platform metrics into campaign_metrics.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Platform = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'ayrshare';

interface NormalizedRow {
  platform: Platform;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  recorded_at: string;
  raw_data: Record<string, unknown>;
}

// Mock provider fetchers. Real adapters would call Meta/Google/TikTok APIs.
async function fetchPlatform(platform: Platform, _campaignId: string): Promise<NormalizedRow[]> {
  const now = new Date();
  const rows: NormalizedRow[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const impressions = 5000 + Math.floor(Math.random() * 15000);
    const clicks = Math.floor(impressions * (0.02 + Math.random() * 0.05));
    const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.08));
    const spend = +(clicks * (0.6 + Math.random() * 1.2)).toFixed(2);
    const revenue = +(conversions * (15 + Math.random() * 60)).toFixed(2);
    rows.push({
      platform,
      impressions,
      reach: Math.floor(impressions * 0.7),
      clicks,
      conversions,
      spend,
      revenue,
      recorded_at: d.toISOString(),
      raw_data: { source: platform, mock: true },
    });
  }
  return rows;
}

function derive(r: NormalizedRow) {
  const ctr = r.impressions ? (r.clicks / r.impressions) * 100 : 0;
  const cpc = r.clicks ? r.spend / r.clicks : 0;
  const cpm = r.impressions ? (r.spend / r.impressions) * 1000 : 0;
  const conversion_rate = r.clicks ? (r.conversions / r.clicks) * 100 : 0;
  const cpa = r.conversions ? r.spend / r.conversions : 0;
  const roas = r.spend ? r.revenue / r.spend : 0;
  return { ctr, cpc, cpm, conversion_rate, cpa, roas };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await anon.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { campaignId, platforms = ['meta', 'google', 'tiktok'] } = await req.json();
    if (!campaignId) return new Response(JSON.stringify({ error: 'campaignId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const rows: any[] = [];
    for (const p of platforms as Platform[]) {
      const fetched = await fetchPlatform(p, campaignId);
      for (const r of fetched) {
        rows.push({ campaign_id: campaignId, user_id: userId, ...r, ...derive(r) });
      }
    }

    const { error } = await supabase.from('campaign_metrics').insert(rows);
    if (error) throw error;

    return new Response(JSON.stringify({ synced: rows.length, platforms }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('sync-analytics error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
