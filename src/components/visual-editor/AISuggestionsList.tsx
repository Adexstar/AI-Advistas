import React, { useEffect, useMemo, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { Sparkles, Type as TypeIcon, Palette, ImageIcon, Layers, Wand2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DesignScores } from "./DesignScorePanel";

interface Suggestion {
  id: string;
  label: string;
  reason: string;
  category: "text" | "color" | "layout" | "image" | "brand";
}

interface Props {
  canvas: FabricCanvas | null;
  scores: DesignScores;
  designId: string;
}

const CATEGORY_META: Record<Suggestion["category"], { icon: React.ComponentType<any>; tint: string }> = {
  text: { icon: TypeIcon, tint: "bg-fuchsia-500/10 text-fuchsia-600" },
  color: { icon: Palette, tint: "bg-amber-500/10 text-amber-600" },
  layout: { icon: Layers, tint: "bg-sky-500/10 text-sky-600" },
  image: { icon: ImageIcon, tint: "bg-emerald-500/10 text-emerald-600" },
  brand: { icon: Sparkles, tint: "bg-primary/10 text-primary" },
};

function buildSuggestions(scores: DesignScores, canvas: FabricCanvas | null): Suggestion[] {
  const out: Suggestion[] = [];
  const objs = canvas?.getObjects() || [];
  const texts = objs.filter((o: any) => o.type === "textbox" || o.type === "text");

  if (scores.readability < 88 && texts.length) {
    out.push({
      id: "contrast",
      label: "Increase contrast on headline for more impact.",
      reason: "Higher contrast lifts CTR on mobile placements.",
      category: "text",
    });
  }
  if (texts.some((t: any) => (t.text || "").length > 80)) {
    out.push({
      id: "shorten",
      label: "Shorten body text to improve readability.",
      reason: "Shorter body copy converts better on ads.",
      category: "text",
    });
  }
  if (scores.colorHarmony < 90) {
    out.push({
      id: "gradient",
      label: "Try a soft gradient background to enhance the feel.",
      reason: "Adds depth without breaking brand harmony.",
      category: "color",
    });
  }
  if (scores.hierarchy < 82) {
    out.push({
      id: "hierarchy",
      label: "Move CTA higher and enlarge the headline.",
      reason: "Clear hierarchy guides the eye to the action.",
      category: "layout",
    });
  }
  if (scores.branding < 84) {
    out.push({
      id: "brand",
      label: "Apply Brand Kit colors and fonts.",
      reason: "Boosts brand consistency across placements.",
      category: "brand",
    });
  }
  return out.slice(0, 4);
}

export const AISuggestionsList: React.FC<Props> = ({ canvas, scores, designId }) => {
  const suggestions = useMemo(() => buildSuggestions(scores, canvas), [scores, canvas]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  const logDecision = async (s: Suggestion, accepted: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("design_suggestions").insert({
        user_id: user.id,
        design_id: designId,
        suggestion: s.label,
        reasoning: s.reason,
        confidence: 85,
        accepted,
        category: s.category,
      });
    } catch {
      // silent — learning is best-effort
    }
  };

  const onApply = (s: Suggestion) => {
    // Human-first: apply is a preview trigger — surface a toast and log the acceptance.
    // Actual mutation happens through the object AI menu; here we track intent.
    if (s.id === "contrast" && canvas) {
      canvas.getObjects().forEach((o: any) => {
        if (o.type === "textbox" && (o.fontSize || 16) > 40) {
          o.set("fill", "#ffffff");
        }
      });
      canvas.renderAll();
    }
    logDecision(s, true);
    setDismissed((d) => new Set(d).add(s.id));
    toast({ title: "Applied", description: s.label });
  };

  const onDismiss = (s: Suggestion) => {
    logDecision(s, false);
    setDismissed((d) => new Set(d).add(s.id));
  };

  if (!visible.length) return null;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">AI Suggestions</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-bold uppercase">New</Badge>
        </div>
      </div>

      <div className="space-y-2">
        {visible.map((s) => {
          const meta = CATEGORY_META[s.category];
          const Icon = meta.icon;
          return (
            <div
              key={s.id}
              className="group flex items-center gap-2.5 rounded-xl border bg-background/60 px-2.5 py-2 transition-colors hover:bg-muted/40"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <p className="flex-1 text-[11px] leading-tight text-foreground">{s.label}</p>
              <Button size="sm" className="h-7 px-2.5 text-[11px]" onClick={() => onApply(s)}>
                Apply
              </Button>
              <button
                onClick={() => onDismiss(s)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          );
        })}
      </div>

      <button className="mt-3 flex w-full items-center justify-center gap-1 text-[11px] text-primary hover:underline">
        See more suggestions →
      </button>
    </div>
  );
};
