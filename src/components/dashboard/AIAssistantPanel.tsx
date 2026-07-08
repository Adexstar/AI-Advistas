import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Users, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { DecisionService } from "@/services/ai";
import type { Decision } from "@/services/ai/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const iconFor = (signal: string | null) => {
  const s = (signal ?? "").toLowerCase();
  if (s.includes("ctr") || s.includes("performance") || s.includes("alert")) return AlertTriangle;
  if (s.includes("roas") || s.includes("budget") || s.includes("spend")) return TrendingUp;
  if (s.includes("audience") || s.includes("lookalike")) return Users;
  return Sparkles;
};

const toneFor = (signal: string | null) => {
  const s = (signal ?? "").toLowerCase();
  if (s.includes("alert") || s.includes("drop")) return { pill: "bg-rose-500/10 text-rose-600", ring: "border-rose-500/20", icon: "bg-rose-500/15 text-rose-600" };
  if (s.includes("budget") || s.includes("opportunity")) return { pill: "bg-amber-500/10 text-amber-600", ring: "border-amber-500/20", icon: "bg-amber-500/15 text-amber-600" };
  if (s.includes("audience")) return { pill: "bg-sky-500/10 text-sky-600", ring: "border-sky-500/20", icon: "bg-sky-500/15 text-sky-600" };
  return { pill: "bg-primary/10 text-primary", ring: "border-primary/20", icon: "bg-primary/15 text-primary" };
};

export const AIAssistantPanel = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ["ai-decisions", user?.id],
    enabled: !!user,
    queryFn: () => DecisionService.list(user!.id, { status: "pending", limit: 5 }),
  });

  const resolve = async (id: string, status: "accepted" | "dismissed" | "applied") => {
    await DecisionService.resolve(id, status);
    qc.invalidateQueries({ queryKey: ["ai-decisions"] });
    toast({ title: status === "applied" ? "Applied" : status === "accepted" ? "Reviewing" : "Dismissed" });
  };

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Assistant</p>
              <p className="text-[11px] text-muted-foreground">Recommendations from your data</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs">See all <ChevronRight className="h-3 w-3" /></Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
          </div>
        ) : decisions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary/60" />
            <p className="text-sm font-medium">No insights yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground">AI will surface recommendations here as your campaigns run.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {decisions.map((d: Decision) => {
              const Icon = iconFor(d.signal);
              const tone = toneFor(d.signal);
              const confidence = Math.round((Number(d.confidence) || 0) * 100);
              return (
                <div key={d.id} className={cn("rounded-xl border bg-background/60 p-3", tone.ring)}>
                  <div className="flex items-start gap-3">
                    <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", tone.icon)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{d.signal || "Insight"}</p>
                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", tone.pill)}>
                          {confidence}% conf
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{d.reasoning || d.action}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => resolve(d.id, "accepted")}>
                          Review
                        </Button>
                        <Button size="sm" className="h-7 rounded-lg text-xs" onClick={() => resolve(d.id, "applied")}>
                          Apply
                        </Button>
                        <button className="ml-auto text-[11px] text-muted-foreground hover:text-foreground" onClick={() => resolve(d.id, "dismissed")}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssistantPanel;
