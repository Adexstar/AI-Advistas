import React, { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useAIContext } from "@/contexts/AIContext";
import { useAIStatus } from "@/contexts/AIStatusContext";
import { useAuth } from "@/hooks/useAuth";
import { DecisionService } from "@/services/ai/DecisionService";
import { resolveSuggestion } from "@/services/ai/resolveSuggestion";
import { requestTextRewrite } from "@/services/ai/requestTextRewrite";
import { toast } from "sonner";
import { AIPreviewDialog } from "./AIPreviewDialog";
import {
  AISuggestion,
  TEXT_ACTIONS,
  buildTextSuggestion,
} from "./aiSuggestions";

type ObjectKind = "text" | "image" | "video" | "layout" | "none";

const detectKind = (selected: any): ObjectKind => {
  if (!selected) return "none";
  if (Array.isArray(selected) && selected.length > 1) return "layout";
  const t = selected?.type;
  if (t === "textbox" || t === "text" || t === "i-text") return "text";
  if (t === "image") return "image";
  if (t === "video") return "video";
  if (t === "activeselection" || t === "group") return "layout";
  return "layout";
};

interface Props {
  selected: any;
  canvas?: any;
  /** Optional custom trigger; defaults to a compact ✨ AI pill */
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
}

export const AIActionsMenu: React.FC<Props> = ({ selected, canvas, trigger, align = "end" }) => {
  const kind = detectKind(selected);
  const { brand, playbook, effectiveContext } = useAIContext();
  const { mode, setStatus } = useAIStatus();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  const ctxInput = useMemo(
    () => ({
      brand: brand?.name ?? null,
      category: playbook?.category ?? effectiveContext?.active_category ?? null,
      platform: effectiveContext?.active_platform ?? null,
      goal: effectiveContext?.current_goal ?? null,
    }),
    [brand, playbook, effectiveContext],
  );

  if (kind === "none") return null;

  const actions = kind === "text" ? TEXT_ACTIONS : [];

  const label = kind === "text" ? "Rewrite copy" : kind === "image" ? "Image" : kind === "video" ? "Video" : "Layout";

  const handleRun = async (action: string) => {
    if (kind !== "text") return;
    setOpen(false);
    setStatus("working", action);
    const currentText = String(selected?.text ?? "");
    try {
      const rewritten = await requestTextRewrite(action, currentText);
      const preview = buildTextSuggestion(action, currentText, ctxInput);
      setSuggestion({
        ...preview,
        confidence: 0,
        estImprovement: undefined,
        reason: "Returned by the AI gateway. Nothing is applied until you confirm.",
        before: { type: "text", value: currentText || "(empty)" },
        after: { type: "text", value: rewritten },
      });
      setStatus("approval", "Review the rewrite");
    } catch (error) {
      setStatus("ready");
      toast.error(error instanceof Error ? error.message : "Copy generation is unavailable.");
    }
  };

  const applySuggestion = async (s: AISuggestion) => {
    // Human first: only apply on explicit confirmation. Text is safely mutable.
    if (s.kind === "text" && selected && canvas && typeof selected.set === "function") {
      const value = s.after.value.replace(/^•\s?/, "").split("\n")[0];
      selected.set("text", value);
      canvas.renderAll();
    }
    if (user?.id) {
      try {
        const decision = await DecisionService.record(user.id, {
          page: "visual-editor",
          trigger_source: "confirmed_ai_action",
          category: playbook?.category ?? effectiveContext?.active_category ?? null,
          signal: `${kind}:${s.action}`,
          action: s.action,
          reasoning: s.reason,
          confidence: s.confidence,
          metadata: { angle: s.action },
        });
        await resolveSuggestion({
          id: decision.id,
          status: "applied",
          userId: user.id,
          sourceType: s.action,
          sourceLabel: s.kind,
          confidence: s.confidence,
        });
      } catch (error) {
        console.error("[VisualEditor] decision logging failed", error);
      }
    }
    setSuggestion(null);
    setStatus("ready");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger ?? (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 gap-1.5 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 text-primary hover:from-primary/25 hover:to-accent/25 border border-primary/20"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align={align} sideOffset={6} className="w-72 p-0">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> {label}
            </div>
            <Badge variant="outline" className="rounded-full text-[10px] capitalize">
              {mode}
            </Badge>
          </div>
          <ScrollArea className="max-h-72">
            <div className="p-1.5">
              {actions.length === 0 ? (
                <p className="px-2 py-3 text-[12px] leading-5 text-muted-foreground">
                  {kind === "image"
                    ? "Image changes are made in AI Studio. That panel calls the image provider and does not invent a preview here."
                    : kind === "video"
                    ? "Video changes are made in AI Studio. That panel calls the video provider."
                    : "Layout changes are made with the canvas tools. There is no model call for this selection."}
                </p>
              ) : actions.map((a) => (
                <button
                  key={a}
                  onClick={() => void handleRun(a)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-muted"
                >
                  <Sparkles className="h-3 w-3 text-primary/70 shrink-0" />
                  <span className="truncate">{a}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t px-3 py-2 text-[10px] text-muted-foreground">
            {kind === "text" ? "Rewrite calls the AI gateway. Nothing changes until you apply it." : "No automatic change is applied from this menu."}
          </div>
        </PopoverContent>
      </Popover>
      <AIPreviewDialog
        suggestion={suggestion}
        onClose={() => {
          setSuggestion(null);
          setStatus("ready");
        }}
        onApply={applySuggestion}
      />
    </>
  );
};
