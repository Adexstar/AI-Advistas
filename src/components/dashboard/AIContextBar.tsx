import { useEffect, useMemo, useState } from "react";
import { Sparkles, ChevronDown, Loader2, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAIContext } from "@/contexts/AIContext";
import { useAIStatus, AIMode } from "@/contexts/AIStatusContext";
import { cn } from "@/lib/utils";

const GOALS = ["Awareness", "Traffic", "Engagement", "Conversions", "Leads", "Sales"];
const MODE_LABEL: Record<AIMode, string> = {
  manual: "Manual",
  assisted: "Assisted",
  smart: "Smart",
  growth: "Growth Agent",
};

const STATUS_META = {
  ready:    { text: "Ready",    dot: "bg-emerald-500", ring: "text-emerald-600" },
  working:  { text: "Working",  dot: "bg-primary",     ring: "text-primary" },
  approval: { text: "Approval", dot: "bg-amber-500",   ring: "text-amber-600" },
  learning: { text: "Learning", dot: "bg-sky-500",     ring: "text-sky-600" },
} as const;

export const AIContextBar = () => {
  const { effectiveContext, override, brand, brands, categories, update, clearOverride } = useAIContext();
  const { mode, status, setMode } = useAIStatus();
  const [open, setOpen] = useState(false);

  const [draftBrand, setDraftBrand] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [draftMode, setDraftMode] = useState<AIMode>("assisted");
  const [saving, setSaving] = useState(false);

  const locked = !!override;
  const lockLabel = override?.source === "campaign"
    ? "From Campaign"
    : override?.source === "brand" ? "From Brand Kit" : "";

  useEffect(() => {
    if (open) {
      setDraftBrand(brand?.id ?? "");
      setDraftCategory(effectiveContext?.active_category ?? "");
      setDraftGoal(effectiveContext?.current_goal ?? "");
      setDraftMode(mode);
    }
  }, [open, brand?.id, effectiveContext?.active_category, effectiveContext?.current_goal, mode]);

  const meta = STATUS_META[status] ?? STATUS_META.ready;
  const brandLabel = brand?.name ?? "Select Brand";
  const subLabel = useMemo(() => {
    const parts = [effectiveContext?.active_category, effectiveContext?.current_goal].filter(Boolean);
    return parts.length ? parts.join(" · ") : MODE_LABEL[mode];
  }, [effectiveContext?.active_category, effectiveContext?.current_goal, mode]);

  const apply = async () => {
    if (locked) return;
    setSaving(true);
    try {
      await update({
        brand_id: draftBrand || null,
        active_brandkit_id: draftBrand || null,
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
          title={`${brandLabel} · ${subLabel} · AI ${meta.text}`}
          className={cn(
            "inline-flex h-10 max-w-full items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 pr-3 text-left transition hover:border-primary/40 hover:bg-accent/40",
            !brand && "text-muted-foreground"
          )}
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[12px] font-semibold text-foreground max-w-[8.5rem] sm:max-w-[10rem]">
              {brandLabel}
            </span>
            <span className="truncate text-[10px] text-muted-foreground max-w-[8.5rem] sm:max-w-[10rem]">
              {subLabel}
            </span>
          </span>
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <span className={cn("hidden items-center gap-1 text-[10px] font-semibold sm:inline-flex", meta.ring)}>
            <span className="relative flex h-2 w-2">
              <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", meta.dot, status === "working" && "animate-ping")} />
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
            </span>
            {meta.text}
          </span>
          {locked && (
            <Lock className="h-3 w-3 shrink-0 text-amber-500" aria-label={lockLabel} />
          )}
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[320px] space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Working Context</p>
            <p className="text-[11px] text-muted-foreground">
              {locked ? "Temporarily set by this workspace." : "Used by AI across every page."}
            </p>
          </div>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta.ring, "border-current/30")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.text}
          </span>
        </div>

        {locked && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            <Lock className="h-3 w-3" /> {lockLabel}
          </div>
        )}

        <fieldset disabled={locked} className="space-y-3 disabled:opacity-60">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Brand</Label>
              <Select value={draftBrand} onValueChange={setDraftBrand} disabled={locked}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {brands.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No brands yet</div>}
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Category</Label>
              <Select value={draftCategory} onValueChange={setDraftCategory} disabled={locked}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.category}>{c.category}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Goal</Label>
              <Select value={draftGoal} onValueChange={setDraftGoal} disabled={locked}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Goal" /></SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Mode</Label>
              <Select value={draftMode} onValueChange={(v) => setDraftMode(v as AIMode)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="assisted">Assisted</SelectItem>
                  <SelectItem value="smart">Smart</SelectItem>
                  <SelectItem value="growth">Growth Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-2">
          {locked ? (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { clearOverride(); setOpen(false); }}>
              Exit workspace
            </Button>
          ) : <span />}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs" onClick={apply} disabled={saving || locked}>
              {saving && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AIContextBar;
