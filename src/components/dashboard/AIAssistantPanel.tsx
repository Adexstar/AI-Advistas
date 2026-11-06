import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LearnedSuggestionList } from "@/components/ai/LearnedSuggestionList";
import { useLearnedSuggestions } from "@/hooks/useLearnedSuggestions";
import type { LearnedSuggestion } from "@/services/ai/suggestionLearning";
import type { SuggestionStatus } from "@/services/ai/resolveSuggestion";
import { useToast } from "@/hooks/use-toast";

export const AIAssistantPanel = () => {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { suggestions, isLoading, resolve } = useLearnedSuggestions(null);

  const act = async (suggestion: LearnedSuggestion, status: SuggestionStatus) => {
    const key = suggestion.decisionId ?? suggestion.angle;
    setPendingId(key);
    try {
      await resolve(suggestion, status);
      toast({
        title: status === "applied" ? "Choice recorded" : status === "accepted" ? "Accepted" : status === "rejected" ? "Rejected" : "Dismissed",
        description: "The campaign itself was not changed.",
      });
    } catch (error) {
      toast({ title: "Could not record that choice", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Assistant</p>
            <p className="text-[11px] text-muted-foreground">Weighted by the choices you have already made</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading your results…
          </div>
        ) : (
          <LearnedSuggestionList suggestions={suggestions} onAction={act} pendingId={pendingId} />
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssistantPanel;
