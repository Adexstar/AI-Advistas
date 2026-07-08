import React, { useMemo } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { Sparkles, Check, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Props {
  canvas: FabricCanvas | null;
  version: number;
  onImprove?: () => void;
}

export interface DesignScores {
  hierarchy: number;
  colorHarmony: number;
  readability: number;
  branding: number;
  accessibility: number;
  overall: number;
  label: "Excellent" | "Good" | "Needs Improvement";
}

export function computeScores(canvas: FabricCanvas | null): DesignScores {
  const objs = canvas?.getObjects() || [];
  const texts = objs.filter((o: any) => o.type === "textbox" || o.type === "text");
  const shapes = objs.filter((o: any) => o.type === "rect" || o.type === "circle" || o.type === "triangle");

  // Visual hierarchy: reward varied font sizes and a clear largest text
  const sizes = texts.map((t: any) => t.fontSize || 16);
  const range = sizes.length ? Math.max(...sizes) - Math.min(...sizes) : 0;
  const hierarchy = clamp(60 + Math.min(range, 60) / 1.2 + (texts.length > 1 ? 8 : 0));

  // Color harmony: fewer unique fills = tighter palette
  const fills = new Set(objs.map((o: any) => (o.fill || "").toString().toLowerCase()).filter(Boolean));
  const uniq = fills.size;
  const colorHarmony = clamp(uniq === 0 ? 70 : uniq <= 3 ? 96 : uniq <= 5 ? 88 : 72);

  // Readability: minimum text size and total text density
  const minSize = sizes.length ? Math.min(...sizes) : 24;
  const readability = clamp((minSize >= 16 ? 92 : 70) + (texts.length > 0 ? 4 : 0));

  // Brand consistency: reward presence of shapes+text (proxy) — replaced by real brand kit later
  const branding = clamp(72 + (texts.length ? 12 : 0) + (shapes.length ? 12 : 0));

  // Accessibility: contrast placeholder — reward light bg or dark bg with white/near-white text
  const bg = (canvas?.backgroundColor || "#ffffff").toString().toLowerCase();
  const hasHighContrastText = texts.some((t: any) => {
    const f = (t.fill || "").toString().toLowerCase();
    if (!f) return false;
    if (bg.includes("fff") || bg === "#ffffff") return f.includes("000") || f.startsWith("#1") || f.startsWith("#2");
    return f.includes("fff") || f.includes("ffc") || f.startsWith("#e") || f.startsWith("#f");
  });
  const accessibility = clamp(hasHighContrastText ? 90 : 74);

  const overall = Math.round((hierarchy + colorHarmony + readability + branding + accessibility) / 5);
  const label: DesignScores["label"] = overall >= 88 ? "Excellent" : overall >= 72 ? "Good" : "Needs Improvement";
  return { hierarchy, colorHarmony, readability, branding, accessibility, overall, label };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export const DesignScorePanel: React.FC<Props> = ({ canvas, version, onImprove }) => {
  const scores = useMemo(() => computeScores(canvas), [canvas, version]);

  const rows: { label: string; value: number }[] = [
    { label: "Visual Hierarchy", value: scores.hierarchy },
    { label: "Color Harmony", value: scores.colorHarmony },
    { label: "Text Readability", value: scores.readability },
    { label: "Brand Consistency", value: scores.branding },
    { label: "Accessibility", value: scores.accessibility },
  ];

  const ringColor =
    scores.label === "Excellent"
      ? "text-emerald-500"
      : scores.label === "Good"
      ? "text-amber-500"
      : "text-rose-500";

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">AI Creative Assistant</span>
        </div>
        <button className="text-[11px] text-primary hover:underline">View all</button>
      </div>

      <p className="text-xs font-semibold text-foreground mb-3">Design Score</p>

      <div className="flex items-center gap-3">
        <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 ${ringColor.replace("text-", "border-")}/30`}>
          <div className={`text-lg font-bold ${ringColor}`}>{scores.overall}</div>
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${ringColor}`}>{scores.label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
            This design is optimized for your goal.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2 text-[11px]">
            <Check className={`h-3 w-3 shrink-0 ${r.value >= 80 ? "text-emerald-500" : "text-muted-foreground"}`} />
            <span className="flex-1 truncate">{r.label}</span>
            <span className="font-semibold tabular-nums">{r.value}%</span>
          </div>
        ))}
      </div>

      <Button size="sm" variant="outline" className="mt-4 w-full h-8 gap-1.5 text-xs" onClick={onImprove}>
        <Wand2 className="h-3.5 w-3.5" /> Improve Design
      </Button>
    </div>
  );
};
