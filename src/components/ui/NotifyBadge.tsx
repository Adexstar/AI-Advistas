import { cn } from "@/lib/utils";

export type NotifyVariant = "unread" | "ai" | "automation" | "export" | "campaign" | "billing" | "system";

const variantMap: Record<NotifyVariant, string> = {
  unread:     "bg-rose-500 text-white",
  ai:         "bg-primary text-primary-foreground",
  automation: "bg-amber-500 text-white",
  export:     "bg-sky-500 text-white",
  campaign:   "bg-emerald-500 text-white",
  billing:    "bg-violet-500 text-white",
  system:     "bg-slate-500 text-white",
};

interface NotifyBadgeProps {
  count?: number;
  variant?: NotifyVariant;
  className?: string;
  dot?: boolean;
}

export const NotifyBadge = ({ count = 0, variant = "unread", className, dot = false }: NotifyBadgeProps) => {
  if (count <= 0 && !dot) return null;
  if (dot) {
    return <span className={cn("inline-block h-2 w-2 rounded-full", variantMap[variant], className)} />;
  }
  return (
    <span
      className={cn(
        "inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none",
        "h-[18px]",
        variantMap[variant],
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default NotifyBadge;
