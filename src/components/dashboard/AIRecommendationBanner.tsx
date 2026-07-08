import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DecisionService } from "@/services/ai";

export const AIRecommendationBanner = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dismissed, setDismissed] = useState<string | null>(null);

  const { data: decisions = [] } = useQuery({
    queryKey: ["ai-decisions", user?.id],
    enabled: !!user,
    queryFn: () => DecisionService.list(user!.id, { status: "pending", limit: 5 }),
  });

  const top = decisions
    .filter((d) => d.id !== dismissed)
    .sort((a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0))[0];

  if (!top) return null;

  const dismiss = async () => {
    setDismissed(top.id);
    await DecisionService.resolve(top.id, "dismissed");
    qc.invalidateQueries({ queryKey: ["ai-decisions"] });
  };

  const accept = async () => {
    await DecisionService.resolve(top.id, "accepted");
    qc.invalidateQueries({ queryKey: ["ai-decisions"] });
  };

  return (
    <div className="pointer-events-none sticky bottom-20 z-30 mx-auto w-full max-w-4xl px-4 lg:bottom-4">
      <div className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary">AI Suggestion</p>
            <p className="line-clamp-2 text-sm text-foreground">
              {top.reasoning || top.action || top.signal}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <Button size="sm" className="h-8 rounded-lg text-xs" onClick={accept}>
            {top.action?.slice(0, 30) || "Review"}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={dismiss}>
            Not now
          </Button>
          <button onClick={dismiss} aria-label="Dismiss" className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendationBanner;
