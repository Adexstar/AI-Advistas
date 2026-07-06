import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, Check } from "lucide-react";
import type { AISuggestion } from "./aiSuggestions";

interface Props {
  suggestion: AISuggestion | null;
  onClose: () => void;
  onApply: (s: AISuggestion) => void;
  onCustomize?: (s: AISuggestion) => void;
}

const SideCard: React.FC<{ label: string; suggestion?: boolean; children: React.ReactNode }> = ({
  label,
  suggestion,
  children,
}) => (
  <div
    className={`rounded-xl border p-4 min-h-[160px] ${
      suggestion ? "border-primary/40 bg-primary/5" : "bg-muted/40"
    }`}
  >
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {suggestion && (
        <Badge variant="secondary" className="gap-1 rounded-full bg-primary/15 text-primary border-primary/20">
          <Sparkles className="h-3 w-3" /> AI
        </Badge>
      )}
    </div>
    {children}
  </div>
);

export const AIPreviewDialog: React.FC<Props> = ({ suggestion, onClose, onApply, onCustomize }) => {
  const open = !!suggestion;
  if (!suggestion) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const renderContent = (side: "before" | "after") => {
    const data = side === "before" ? suggestion.before : suggestion.after;
    if (data.type === "text") {
      return <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.value}</p>;
    }
    if (data.type === "image") {
      return (
        <div className="flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/50 text-xs text-muted-foreground">
          {side === "before" ? "Current image" : `AI ${suggestion.action.toLowerCase()} preview`}
        </div>
      );
    }
    if (data.type === "video") {
      return (
        <div className="flex h-32 items-center justify-center rounded-lg bg-black/80 text-xs text-white/80">
          {side === "before" ? "Current clip" : `AI ${suggestion.action.toLowerCase()}`}
        </div>
      );
    }
    return (
      <div className="flex h-32 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
        {side === "before" ? "Current layout" : `AI-optimized layout`}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> {suggestion.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <SideCard label="Current">{renderContent("before")}</SideCard>
          <SideCard label="AI Suggested" suggestion>
            {renderContent("after")}
          </SideCard>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold">Confidence</span>
              <span className="font-mono">{suggestion.confidence}%</span>
            </div>
            <Progress value={suggestion.confidence} className="h-2" />
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {suggestion.basedOn.slice(0, 4).map((b) => (
                <li key={b} className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-500" /> {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-3">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Estimated Impact
            </div>
            <p className="text-lg font-bold text-emerald-600">{suggestion.estImprovement ?? "+ performance"}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{suggestion.reason}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Keep Current
          </Button>
          {onCustomize && (
            <Button variant="outline" onClick={() => onCustomize(suggestion)}>
              Customize First
            </Button>
          )}
          <Button onClick={() => onApply(suggestion)} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
