import { useState } from "react";
import { Building2, Layers, Target, Sparkles, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAIContext } from "@/contexts/AIContext";
import { useAIStatus } from "@/contexts/AIStatusContext";
import { cn } from "@/lib/utils";

const modeLabel: Record<string, string> = {
  manual: "Manual",
  assisted: "Assisted",
  smart: "Smart",
  growth: "Growth Agent",
};

interface Props {
  compact?: boolean;
}

export const AIContextPill = ({ compact = false }: Props) => {
  const { context, brand, playbook, brands, categories, update, loading } = useAIContext();
  const { mode, setMode } = useAIStatus();
  const [open, setOpen] = useState(false);

  const brandName = brand?.name ?? "No brand";
  const categoryName = playbook?.category ?? context?.active_category ?? "General";
  const goal = context?.current_goal ?? context?.active_objective ?? "Not set";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:border-primary/50",
            loading && "opacity-60"
          )}
          title="AI working context"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {compact ? (
            <span className="truncate max-w-[120px]">{brandName}</span>
          ) : (
            <>
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3 opacity-60" />{brandName}</span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1"><Layers className="h-3 w-3 opacity-60" />{categoryName}</span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1"><Target className="h-3 w-3 opacity-60" />{goal}</span>
              <span className="h-3 w-px bg-border" />
              <span className="opacity-80">{modeLabel[mode]}</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4 p-4">
        <div>
          <p className="text-sm font-semibold">AI Working Context</p>
          <p className="text-xs text-muted-foreground">Every AI action across AdVista uses these values.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Brand</Label>
          <Select value={brand?.id ?? ""} onValueChange={(v) => update({ brand_id: v || null, active_brandkit_id: v || null })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select brand" /></SelectTrigger>
            <SelectContent>
              {brands.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No brand kits yet</div>}
              {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select value={context?.active_category ?? ""} onValueChange={(v) => update({ active_category: v })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.category}>{c.category}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Goal</Label>
            <Select value={context?.current_goal ?? ""} onValueChange={(v) => update({ current_goal: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Goal" /></SelectTrigger>
              <SelectContent>
                {["Awareness", "Traffic", "Engagement", "Conversions", "Leads", "Sales"].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="assisted">Assisted</SelectItem>
                <SelectItem value="smart">Smart</SelectItem>
                <SelectItem value="growth">Growth Agent (Beta)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AIContextPill;
