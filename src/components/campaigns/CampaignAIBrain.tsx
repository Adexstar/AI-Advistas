import { useMemo, useState } from "react";
import { Sparkles, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearnedSuggestionList } from "@/components/ai/LearnedSuggestionList";
import { useLearnedSuggestions } from "@/hooks/useLearnedSuggestions";
import { budgetEfficiency, type CampaignTrackRecord, type LearnedSuggestion } from "@/services/ai/suggestionLearning";
import type { SuggestionStatus } from "@/services/ai/resolveSuggestion";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];

export function CampaignAIBrain({ campaign }: { campaign: CampaignRow }) {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const focus = useMemo<CampaignTrackRecord>(() => {
    const budget = Number(campaign.budget) || 0;
    const spend = Number(campaign.spend) || 0;
    const revenue = Number(campaign.revenue) || 0;
    return {
      id: campaign.id,
      name: campaign.name,
      objective: campaign.objective ?? "",
      platform: campaign.platform,
      ctr: Number(campaign.ctr) || 0,
      roas: Number(campaign.roas) || 0,
      budget,
      spend,
      revenue,
      budgetEfficiency: budgetEfficiency(budget, spend, revenue),
      creativeStyle: null,
    };
  }, [campaign]);
  const scoped = useLearnedSuggestions(focus);
  const history = scoped.track.filter((row) => row.id !== campaign.id).slice(0, 3);

  const act = async (suggestion: LearnedSuggestion, status: SuggestionStatus) => {
    const key = suggestion.decisionId ?? suggestion.angle;
    setPendingId(key);
    try {
      await scoped.resolve(suggestion, status);
      toast({ title: status === "applied" ? "Choice recorded" : status === "accepted" ? "Accepted" : status === "rejected" ? "Rejected" : "Dismissed" });
    } catch (error) {
      toast({ title: "Could not record that choice", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="rounded-2xl border bg-gradient-to-br from-primary/5 via-accent/5 to-background p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold">AI Campaign Brain</h3>
            <p className="text-[11px] text-muted-foreground">Suggestions follow your results and past choices.</p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => scoped.refetch()}>
          Refresh
        </Button>
      </div>

      {scoped.isLoading ? (
        <p className="text-sm text-muted-foreground">Reading your campaign history…</p>
      ) : (
        <LearnedSuggestionList suggestions={scoped.suggestions} onAction={act} pendingId={pendingId} />
      )}

      {history.length > 0 && (
        <Card className="mt-4 border-dashed">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Target className="h-3.5 w-3.5 text-primary" />
              Previous campaign results
            </div>
            <div className="space-y-2">
              {history.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{row.name}</span>
                  <span className="tabular-nums">
                    {row.objective || "No objective"} · {row.ctr.toFixed(2)}% CTR · {row.roas.toFixed(2)}x ROAS · {row.budgetEfficiency.toFixed(2)}x return on budget
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Context: {campaign.objective || "No objective"} · {campaign.platform || "Multi-platform"}
      </p>
    </section>
  );
}
