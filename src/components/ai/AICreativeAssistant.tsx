import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Wand2, Image as ImageIcon, PenLine, MousePointerClick, Info } from "lucide-react";

export interface CreativeAssistantProps {
  step: number;
  onGenerateHeadlines?: () => void;
  onGenerateImages?: () => void;
  onImproveCopy?: () => void;
  onSuggestCta?: () => void;
}

const CONTEXT_BY_STEP: Record<number, { title: string; text: string; impact: string; confidence: number }> = {
  1: { title: "Setup Recommendation", text: "For your goal (Conversions), Website Purchases with Lowest Cost bidding performs best in Beauty.", impact: "High Impact", confidence: 92 },
  2: { title: "Creative Recommendation", text: 'Ads containing "Glow" perform 24% better in Beauty campaigns.', impact: "High Impact", confidence: 93 },
  3: { title: "Audience Insight", text: "Skincare Buyers + Beauty Enthusiasts lookalike expected to reach ~2.4M.", impact: "Medium Impact", confidence: 88 },
  4: { title: "Budget Suggestion", text: "Recommended daily budget: $42 with an expected CPA of $8.60.", impact: "High Impact", confidence: 90 },
  5: { title: "Pre-flight Check", text: "Brand tone, grammar and readability look strong. Consider adding a Story variant.", impact: "Medium Impact", confidence: 86 },
};

export const AICreativeAssistant = ({
  step, onGenerateHeadlines, onGenerateImages, onImproveCopy, onSuggestCta,
}: CreativeAssistantProps) => {
  const ctx = CONTEXT_BY_STEP[step] ?? CONTEXT_BY_STEP[2];

  const actions = [
    { icon: PenLine, label: "Generate Headlines", sub: "AI writing assistant", onClick: onGenerateHeadlines },
    { icon: ImageIcon, label: "Generate Images", sub: "AI image generator", onClick: onGenerateImages },
    { icon: Wand2, label: "Improve Copy", sub: "Enhance performance", onClick: onImproveCopy },
    { icon: MousePointerClick, label: "Suggest CTA", sub: "Best CTA for goal", onClick: onSuggestCta },
  ];

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Creative Assistant</p>
              <p className="text-[11px] text-muted-foreground">Context-aware guidance</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]">View all</Button>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{ctx.title}</p>
            <Badge variant="secondary" className="rounded-full bg-emerald-500/15 text-[10px] text-emerald-600">{ctx.impact}</Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{ctx.text}</p>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Info className="h-3 w-3" /> Confidence <b className="text-foreground">{ctx.confidence}%</b>
            </span>
          </div>
          <Progress value={ctx.confidence} className="mt-1.5 h-1" />
          <Button size="sm" className="mt-3 h-8 w-full rounded-lg text-xs">View Insights</Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {actions.map((a) => (
            <button key={a.label} type="button" onClick={a.onClick}
              className="group flex items-start gap-2 rounded-xl border border-border/60 bg-background/60 p-2.5 text-left transition hover:border-primary/40 hover:bg-primary/[0.04]">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <a.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold">{a.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{a.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AICreativeAssistant;
