import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Sparkles, CheckCircle2, Loader2, ShieldCheck, GraduationCap, Circle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAIContext } from "@/contexts/AIContext";
import { useAIStatus, AIStatus, AIMode } from "@/contexts/AIStatusContext";
import { cn } from "@/lib/utils";

const modeLabel: Record<AIMode, string> = {
  manual: "Manual",
  assisted: "Assisted",
  smart: "Smart",
  growth: "Growth Agent",
};

const statusMeta: Record<AIStatus, { label: string; icon: any; dotClass: string; textClass: string }> = {
  ready:    { label: "AI Ready",         icon: Circle,        dotClass: "bg-emerald-500",  textClass: "text-emerald-500" },
  working:  { label: "AI Working",       icon: Loader2,       dotClass: "bg-primary",      textClass: "text-primary" },
  approval: { label: "Approval needed",  icon: ShieldCheck,   dotClass: "bg-amber-500",    textClass: "text-amber-500" },
  learning: { label: "Learning",         icon: GraduationCap, dotClass: "bg-sky-500",      textClass: "text-sky-500" },
};

const GOALS = ["Awareness", "Traffic", "Engagement", "Conversions", "Leads", "Sales"];

interface Props {
  compact?: boolean;
}

export const AIContextPill = ({ compact = false }: Props) => {
  const { context, brand, playbook, brands, categories, update, loading } = useAIContext();
  const { mode, status, setMode } = useAIStatus();
  const [open, setOpen] = useState(false);

  // Draft state — only committed on Apply
  const [draftBrandId, setDraftBrandId] = useState<string>("");
  const [draftCategory, setDraftCategory] = useState<string>("");
  const [draftGoal, setDraftGoal] = useState<string>("");
  const [draftMode, setDraftMode] = useState<AIMode>("assisted");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraftBrandId(brand?.id ?? "");
      setDraftCategory(context?.active_category ?? "");
      setDraftGoal(context?.current_goal ?? "");
      setDraftMode(mode);
    }
  }, [open, brand?.id, context?.active_category, context?.current_goal, mode]);

  const draftBrand = useMemo(() => brands.find((b) => b.id === draftBrandId) ?? null, [brands, draftBrandId]);
  const draftPlaybook = useMemo(() => categories.find((c) => c.category === draftCategory) ?? null, [categories, draftCategory]);

  // Confidence heuristic based on how much AI knows
  const understanding = useMemo(() => {
    const items = [
      { label: "Brand Kit", has: !!draftBrand },
      { label: "Category Rules", has: !!draftPlaybook },
      { label: "Campaign History", has: !!context?.current_campaign_id || !!draftBrand },
      { label: "Winning Creatives", has: !!draftPlaybook && !!draftBrand },
    ];
    const score = items.filter((i) => i.has).length / items.length;
    const confidence = score >= 0.85 ? "High" : score >= 0.5 ? "Medium" : "Low";
    return { items, score, confidence };
  }, [draftBrand, draftPlaybook, context?.current_campaign_id]);

  const brandLabel = brand?.name ?? "Select Brand";
  const meta = statusMeta[status];

  const apply = async () => {
    setSaving(true);
    try {
      await update({
        brand_id: draftBrandId || null,
        active_brandkit_id: draftBrandId || null,
        active_category: draftCategory || null,
        current_goal: draftGoal || null,
      });
      setMode(draftMode);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:border-primary/50 hover:bg-accent/40",
            loading && "opacity-60",
            !brand && "text-muted-foreground"
          )}
          title={`${brandLabel} · ${meta.label}`}
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className={cn("truncate", compact ? "max-w-[110px]" : "max-w-[160px]")}>{brandLabel}</span>
          <span className="relative flex h-2 w-2 items-center justify-center" aria-label={meta.label}>
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", meta.dotClass, status === "working" && "animate-ping")} />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dotClass)} />
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[340px] space-y-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">AI Working Context</p>
            <p className="text-[11px] text-muted-foreground">Memory used by AI across every page.</p>
          </div>
          <div className={cn("inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-[10px] font-medium", meta.textClass)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
            {meta.label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px]">Brand</Label>
            <Select value={draftBrandId} onValueChange={setDraftBrandId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select brand" /></SelectTrigger>
              <SelectContent>
                {brands.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No brand kits yet</div>}
                {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px]">Category</Label>
            <Select value={draftCategory} onValueChange={setDraftCategory}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.category}>{c.category}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px]">Goal</Label>
            <Select value={draftGoal} onValueChange={setDraftGoal}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Goal" /></SelectTrigger>
              <SelectContent>
                {GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px]">AI Mode</Label>
            <Select value={draftMode} onValueChange={(v) => setDraftMode(v as AIMode)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="assisted">Assisted</SelectItem>
                <SelectItem value="smart">Smart</SelectItem>
                <SelectItem value="growth">Growth Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">AI understands</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                understanding.confidence === "High" && "bg-emerald-500/15 text-emerald-500",
                understanding.confidence === "Medium" && "bg-amber-500/15 text-amber-500",
                understanding.confidence === "Low" && "bg-muted text-muted-foreground",
              )}
            >
              {understanding.confidence} confidence
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-1.5">
            {understanding.items.map((i) => (
              <li key={i.label} className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className={cn("h-3 w-3", i.has ? "text-emerald-500" : "text-muted-foreground/40")} />
                <span className={cn(i.has ? "text-foreground" : "text-muted-foreground/60 line-through")}>{i.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {modeLabel[draftMode]} · AI assists only when you act on a page.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={apply} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AIContextPill;
