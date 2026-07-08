import { useEffect, useMemo, useState } from "react";
import { Building2, Tag, Target, Sparkles, ChevronDown, Loader2, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface ChipProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onClick: () => void;
  muted?: boolean;
  className?: string;
}

const Chip = ({ icon: Icon, label, value, onClick, muted, className }: ChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group flex min-w-0 items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2 text-left transition hover:border-primary/40 hover:bg-accent/40",
      className
    )}
  >
    <Icon className="h-4 w-4 shrink-0 text-primary" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("truncate text-xs font-semibold", muted ? "text-muted-foreground" : "text-foreground")}>{value}</p>
    </div>
    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
  </button>
);

export const AIContextBar = () => {
  const { context, effectiveContext, override, brand, brands, categories, update, clearOverride } = useAIContext();
  const { mode, status, setMode } = useAIStatus();
  const [open, setOpen] = useState(false);

  const [draftBrand, setDraftBrand] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [draftMode, setDraftMode] = useState<AIMode>("assisted");
  const [remember, setRemember] = useState(true);
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

  const workspaceLabel = brand?.name ?? "AdVista Workspace";
  const categoryLabel = effectiveContext?.active_category ?? "Set category";
  const goalLabel = effectiveContext?.current_goal ?? "Set goal";
  const modeLabel = MODE_LABEL[mode];

  const readyText = useMemo(() => {
    if (status === "working") return "AI Working";
    if (status === "approval") return "Approval";
    if (status === "learning") return "Learning";
    return "AI Ready";
  }, [status]);

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
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <PopoverTrigger asChild>
          <div className="contents">
            <Chip icon={Building2} label="Workspace" value={workspaceLabel} muted={!brand} onClick={() => setOpen(true)} />
          </div>
        </PopoverTrigger>
        <Chip icon={Tag} label="Category" value={categoryLabel} muted={!context?.active_category} onClick={() => setOpen(true)} />
        <Chip icon={Target} label="Goal" value={goalLabel} muted={!context?.current_goal} onClick={() => setOpen(true)} />
        <Chip icon={Sparkles} label="Mode" value={modeLabel} onClick={() => setOpen(true)} />

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "col-span-2 flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition sm:col-span-1",
            status === "ready" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
            status === "working" && "border-primary/30 bg-primary/10 text-primary",
            status === "approval" && "border-amber-500/30 bg-amber-500/10 text-amber-600",
            status === "learning" && "border-sky-500/30 bg-sky-500/10 text-sky-600",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {readyText}
          <span className="relative flex h-2 w-2">
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60",
              status === "ready" && "bg-emerald-500",
              status === "working" && "bg-primary animate-ping",
              status === "approval" && "bg-amber-500",
              status === "learning" && "bg-sky-500",
            )} />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full",
              status === "ready" && "bg-emerald-500",
              status === "working" && "bg-primary",
              status === "approval" && "bg-amber-500",
              status === "learning" && "bg-sky-500",
            )} />
          </span>
        </button>
      </div>

      <PopoverContent align="start" className="w-[340px] space-y-4 p-4">
        <div>
          <p className="text-sm font-semibold">Working Context</p>
          <p className="text-[11px] text-muted-foreground">AI uses this on every page.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px]">Brand</Label>
            <Select value={draftBrand} onValueChange={setDraftBrand}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select brand" /></SelectTrigger>
              <SelectContent>
                {brands.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No brands yet</div>}
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
            <Label className="text-[11px]">Mode</Label>
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
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Remember this context
        </label>
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

export default AIContextBar;
