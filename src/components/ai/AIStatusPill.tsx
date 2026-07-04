import { Sparkles, Loader2, ShieldCheck, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIStatus, AIStatus, AIMode } from "@/contexts/AIStatusContext";

const statusMap: Record<AIStatus, { label: string; icon: any; className: string }> = {
  ready:    { label: "AI Ready",         icon: Sparkles,      className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  working:  { label: "AI Working",       icon: Loader2,       className: "bg-primary/15 text-primary border-primary/30" },
  approval: { label: "Approval Required", icon: ShieldCheck,  className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  learning: { label: "Learning",         icon: GraduationCap, className: "bg-sky-500/15 text-sky-500 border-sky-500/30" },
};

const modeLabel: Record<AIMode, string> = {
  manual: "Manual Mode",
  assisted: "Assisted",
  smart: "Smart",
  growth: "Growth Agent",
};

export const AIStatusPill = ({ compact = false }: { compact?: boolean }) => {
  const { status, mode, category, detail } = useAIStatus();
  const meta = statusMap[status];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        meta.className
      )}
      title={detail || `${meta.label} · ${category} · ${modeLabel[mode]}`}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "working" && "animate-spin")} />
      <span className="font-semibold">{meta.label}</span>
      {!compact && (
        <>
          <span className="h-3 w-px bg-current opacity-30" />
          <span className="opacity-80">{category}</span>
          <span className="h-3 w-px bg-current opacity-30" />
          <span className="opacity-80">{modeLabel[mode]}</span>
        </>
      )}
    </div>
  );
};

export default AIStatusPill;
