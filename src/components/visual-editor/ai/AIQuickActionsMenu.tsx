import React, { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Zap, Sparkles } from "lucide-react";
import { useAIContext } from "@/contexts/AIContext";
import { useAIStatus } from "@/contexts/AIStatusContext";
import { AIPreviewDialog } from "./AIPreviewDialog";
import { AISuggestion, QUICK_ACTIONS, buildQuickSuggestion } from "./aiSuggestions";

export const AIQuickActionsMenu: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { brand, playbook, effectiveContext } = useAIContext();
  const { setStatus } = useAIStatus();
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  const ctx = useMemo(
    () => ({
      brand: brand?.name ?? null,
      category: playbook?.category ?? effectiveContext?.active_category ?? null,
      platform: effectiveContext?.active_platform ?? null,
      goal: effectiveContext?.current_goal ?? null,
    }),
    [brand, playbook, effectiveContext],
  );

  const groups: Record<string, readonly string[]> = {
    Generate: ["Generate 5 Variations", "Generate New Creative", "Duplicate Creative"],
    Format: ["Generate Carousel", "Generate Story", "Generate Reel", "Generate Banner", "Resize For All Platforms"],
    Optimize: [
      "Create A/B Test",
      "Apply Brand Kit",
      "Optimize For Mobile",
      "Optimize For Facebook",
      "Optimize For Instagram",
      "Optimize For TikTok",
      "Optimize For LinkedIn",
    ],
  };

  const run = (action: string) => {
    setStatus("approval", action);
    setSuggestion(buildQuickSuggestion(action, ctx));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700"
          >
            <Zap className="h-3.5 w-3.5" />
            {!compact && <span>Quick Actions</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Quick Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(groups).map(([g, items], gi) => (
            <React.Fragment key={g}>
              {gi > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {g}
              </DropdownMenuLabel>
              {items.map((a) => (
                <DropdownMenuItem key={a} onClick={() => run(a)} className="text-xs">
                  {a}
                </DropdownMenuItem>
              ))}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <AIPreviewDialog
        suggestion={suggestion}
        onClose={() => {
          setSuggestion(null);
          setStatus("ready");
        }}
        onApply={() => {
          setSuggestion(null);
          setStatus("ready");
        }}
      />
    </>
  );
};

// Also usable inline (e.g. inside a floating toolbar).
// Nothing executes without confirmation via the preview dialog.
export const useQuickActionsList = () => QUICK_ACTIONS;
