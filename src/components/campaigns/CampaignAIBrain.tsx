import { Sparkles, TrendingUp, Target, BarChart3, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type CampaignRow = Database['public']['Tables']['campaigns']['Row'];

interface Props {
  campaign: CampaignRow;
  previousCampaigns?: { name: string; ctr: number; roas: number; objective: string }[];
}

export function CampaignAIBrain({ campaign, previousCampaigns = [] }: Props) {
  const insights = generateInsights(campaign, previousCampaigns);

  return (
    <section className="rounded-2xl border bg-gradient-to-br from-primary/5 via-accent/5 to-background p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-base font-bold">AI Campaign Brain</h3>
        </div>
        <Badge variant="secondary" className="text-xs">Always active</Badge>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl bg-background/80 p-4 border border-border/50"
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                insight.type === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                insight.type === 'negative' ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
              }`}>
                {insight.type === 'positive' ? <TrendingUp className="h-3.5 w-3.5" /> :
                 insight.type === 'negative' ? <BarChart3 className="h-3.5 w-3.5" /> :
                 <Lightbulb className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm leading-relaxed">{insight.text}</p>
                {insight.confidence && (
                  <p className="mt-1 text-xs text-muted-foreground">Confidence: {insight.confidence}%</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {previousCampaigns.length > 0 && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Target className="h-3.5 w-3.5 text-primary" />
                Learning from previous campaigns
              </div>
              <div className="space-y-2">
                {previousCampaigns.slice(0, 2).map((pc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                    <span>{pc.name}</span>
                    <span className="tabular-nums">{pc.objective} • {pc.ctr.toFixed(1)}% CTR • {pc.roas.toFixed(1)}x ROAS</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-2">
          <span>Context: {campaign.objective} • {campaign.platform || 'Multi-platform'}</span>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Sparkles className="h-3 w-3" /> Refresh Insights
          </Button>
        </div>
      </div>
    </section>
  );
}

function generateInsights(campaign: CampaignRow, previous: { ctr: number; roas: number; objective: string }[]) {
  const insights: { text: string; type: 'positive' | 'negative' | 'neutral'; confidence?: number }[] = [];

  const ctr = Number(campaign.ctr || 0);
  const roas = Number(campaign.roas || 0);

  if (ctr > 3) {
    insights.push({ text: `Your CTR of ${ctr.toFixed(1)}% is strong. Consider scaling budget to capture more audience.`, type: 'positive', confidence: 90 });
  } else if (ctr > 1) {
    insights.push({ text: `CTR at ${ctr.toFixed(1)}% is healthy. A/B test headlines to improve further.`, type: 'neutral', confidence: 85 });
  } else if (ctr > 0) {
    insights.push({ text: `CTR of ${ctr.toFixed(1)}% needs attention. Try shorter, more benefit-driven headlines.`, type: 'negative', confidence: 88 });
  }

  if (roas > 4) {
    insights.push({ text: `ROAS of ${roas.toFixed(1)}x is excellent. Increase budget by 20-30% to scale.`, type: 'positive', confidence: 92 });
  } else if (roas > 2) {
    insights.push({ text: `ROAS of ${roas.toFixed(1)}x is profitable. Fine-tune audience targeting for further improvement.`, type: 'positive', confidence: 85 });
  } else if (roas > 0) {
    insights.push({ text: `ROAS of ${roas.toFixed(1)}x is below target. Consider adjusting offer or creative.`, type: 'negative', confidence: 87 });
  }

  if (previous.length > 0) {
    const avgCtr = previous.reduce((s, p) => s + p.ctr, 0) / previous.length;
    if (ctr < avgCtr * 0.8) {
      insights.push({ text: `CTR is ${((1 - ctr / avgCtr) * 100).toFixed(0)}% below your historical average. Review creative direction.`, type: 'negative', confidence: 82 });
    }
  }

  insights.push({
    text: `Recommended budget allocation: 60% ${campaign.platform || 'top platform'}, 25% cross-platform, 15% testing new audiences.`,
    type: 'neutral',
    confidence: 78,
  });

  return insights;
}
