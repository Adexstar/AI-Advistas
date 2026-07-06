import React, { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useAIContext } from "@/contexts/AIContext";
import { useAIStatus } from "@/contexts/AIStatusContext";
import { AIPreviewDialog } from "./AIPreviewDialog";
import {
  AISuggestion,
  IMAGE_ACTIONS,
  LAYOUT_ACTIONS,
  TEXT_ACTIONS,
  VIDEO_ACTIONS,
  buildImageSuggestion,
  buildLayoutSuggestion,
  buildTextSuggestion,
  buildVideoSuggestion,
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
  const { brand, playbook, context } = useAIContext();
  const { mode, setStatus } = useAIStatus();
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  const ctxInput = useMemo(
    () => ({
      brand: brand?.name ?? null,
      category: playbook?.category ?? context?.active_category ?? null,
      platform: context?.active_platform ?? null,
      goal: context?.current_goal ?? null,
    }),
    [brand, playbook, context],
  );

  if (kind === "none") return null;

  const actions =
    kind === "text"
      ? TEXT_ACTIONS
      : kind === "image"
      ? IMAGE_ACTIONS
      : kind === "video"
      ? VIDEO_ACTIONS
      : LAYOUT_ACTIONS;

  const label = kind === "text" ? "Text AI" : kind === "image" ? "Image AI" : kind === "video" ? "Video AI" : "Layout AI";

  const handleRun = (action: string) => {
    setOpen(false);
    setStatus("working", action);
    const currentText = selected?.text ?? "";
    let s: AISuggestion;
    if (kind === "text") s = buildTextSuggestion(action, currentText, ctxInput);
    else if (kind === "image") s = buildImageSuggestion(action, ctxInput);
    else if (kind === "video") s = buildVideoSuggestion(action, ctxInput);
    else s = buildLayoutSuggestion(action, ctxInput);
    setSuggestion(s);
    setStatus("approval", "Review AI suggestion");
  };

  const applySuggestion = (s: AISuggestion) => {
    // Human first: only apply on explicit confirmation. Text is safely mutable.
    if (s.kind === "text" && selected && canvas && typeof selected.set === "function") {
      const value = s.after.value.replace(/^•\s?/, "").split("\n")[0];
      selected.set("text", value);
      canvas.renderAll();
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
              {actions.map((a) => (
                <button
                  key={a}
                  onClick={() => handleRun(a)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-muted"
                >
                  <Sparkles className="h-3 w-3 text-primary/70 shrink-0" />
                  <span className="truncate">{a}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t px-3 py-2 text-[10px] text-muted-foreground">
            Uses {brand?.name ?? "Brand Kit"} · {playbook?.category ?? "Category"} · Previewed before apply
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
