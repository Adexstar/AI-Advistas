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
import { Sparkles } from "lucide-react";
import { useAIContext } from "@/contexts/AIContext";
import { useAIStatus } from "@/contexts/AIStatusContext";
import { AIPreviewDialog } from "./AIPreviewDialog";
import { AISuggestion, TIMELINE_ACTIONS, buildTimelineSuggestion } from "./aiSuggestions";

export const AITimelineMenu: React.FC = () => {
  const { brand, playbook, context } = useAIContext();
  const { setStatus } = useAIStatus();
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  const ctx = useMemo(
    () => ({
      brand: brand?.name ?? null,
      category: playbook?.category ?? context?.active_category ?? null,
      platform: context?.active_platform ?? null,
      goal: context?.active_goal ?? null,
    }),
    [brand, playbook, context],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs border-primary/30 bg-primary/5 text-primary hover:bg-primary/10">
            <Sparkles className="h-3 w-3" /> AI
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs">Timeline AI</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TIMELINE_ACTIONS.map((a) => (
            <DropdownMenuItem
              key={a}
              onClick={() => {
                setStatus("approval", a);
                setSuggestion(buildTimelineSuggestion(a, ctx));
              }}
              className="text-xs"
            >
              {a}
            </DropdownMenuItem>
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
