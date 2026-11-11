import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { LearnedSuggestionList } from "@/components/ai/LearnedSuggestionList";
import { useLearnedSuggestions } from "@/hooks/useLearnedSuggestions";
import { budgetEfficiency, type CampaignTrackRecord, type LearnedSuggestion } from "@/services/ai/suggestionLearning";
import type { SuggestionStatus } from "@/services/ai/resolveSuggestion";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];

export function suggestionsForCampaign(suggestions: LearnedSuggestion[], campaignId: string) {
  return suggestions.filter((item) => !item.campaignId || item.campaignId === campaignId);
}

export function CampaignRecommendations({ campaign }: { campaign: CampaignRow }) {
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
  const learned = useLearnedSuggestions(focus);
  const suggestions = suggestionsForCampaign(learned.suggestions, campaign.id);
  const ctr = Number(campaign.ctr) || 0;
  const roas = Number(campaign.roas) || 0;

  const act = async (suggestion: LearnedSuggestion, status: SuggestionStatus) => {
    const key = suggestion.decisionId ?? suggestion.angle;
    setPendingId(key);
    try {
      await learned.resolve(suggestion, status);
      toast.success(status === "dismissed" ? "Recommendation dismissed" : status === "rejected" ? "Recommendation rejected" : "Choice recorded. The campaign is unchanged.");
    } catch {
      toast.error("Could not record that choice");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>
          Built from this campaign: {ctr.toFixed(2)}% CTR · {roas.toFixed(2)}x ROAS · {focus.budgetEfficiency.toFixed(2)}x return on budget
        </span>
      </div>
      {learned.isLoading ? (
        <p className="text-sm text-muted-foreground">Reading this campaign’s results…</p>
      ) : (
        <LearnedSuggestionList
          suggestions={suggestions}
          onAction={act}
          pendingId={pendingId}
          emptyLabel="This campaign has no CTR or ROAS yet, so there is no performance suggestion to make."
        />
      )}
    </div>
  );
}
