import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LearnedSuggestion } from "@/services/ai/suggestionLearning";
import type { SuggestionStatus } from "@/services/ai/resolveSuggestion";

export function LearnedSuggestionList({
  suggestions,
  onAction,
  pendingId,
  emptyLabel = "Recommendations appear after a campaign has results, and they follow what you accept or reject.",
}: {
  suggestions: LearnedSuggestion[];
  onAction: (suggestion: LearnedSuggestion, status: SuggestionStatus) => Promise<void> | void;
  pendingId?: string | null;
  emptyLabel?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!suggestions.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm font-medium">No suggestions yet</p>
        <p className="mt-1 text-xs text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => {
        const key = suggestion.decisionId ?? suggestion.angle;
        const open = openId === key;
        const busy = pendingId === key;
        return (
          <article key={key} className="min-w-0 rounded-xl border border-border/70 bg-background/70 p-3">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-semibold">{suggestion.title}</h4>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {suggestion.confidence}% confidence
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{suggestion.reasoning}</p>
            {open && (
              <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed">
                {suggestion.preview}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" className="h-7 rounded-lg text-xs" disabled={busy} onClick={() => setOpenId(open ? null : key)}>
                {open ? "Hide preview" : "Preview"}
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 rounded-lg text-xs" disabled={busy} onClick={() => onAction(suggestion, "accepted")}>
                Accept
              </Button>
              <Button type="button" size="sm" className="h-7 rounded-lg text-xs" disabled={busy} onClick={() => onAction(suggestion, "applied")}>
                Apply
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 rounded-lg text-xs" disabled={busy} onClick={() => onAction(suggestion, "dismissed")}>
                Dismiss
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 rounded-lg text-xs text-muted-foreground" disabled={busy} onClick={() => onAction(suggestion, "rejected")}>
                Reject
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Optional. Apply records the choice and leaves the campaign unchanged, so you can reject it later.
            </p>
          </article>
        );
      })}
    </div>
  );
}
