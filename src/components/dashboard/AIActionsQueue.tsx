import { useQuery } from "@tanstack/react-query";
import { Wand2, Users, TrendingUp, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { AIJobService } from "@/services/ai";
import type { AIJob } from "@/services/ai/types";
import { cn } from "@/lib/utils";

const iconFor = (type: string) => {
  if (type.includes("creative") || type.includes("variation")) return Wand2;
  if (type.includes("audience")) return Users;
  if (type.includes("budget")) return TrendingUp;
  return Sparkles;
};

const statusColor = (s: string) => {
  if (s === "queued") return "text-muted-foreground bg-muted";
  if (s === "running") return "text-primary bg-primary/10";
  if (s === "completed") return "text-emerald-600 bg-emerald-500/10";
  if (s === "failed") return "text-rose-600 bg-rose-500/10";
  return "text-muted-foreground bg-muted";
};

export const AIActionsQueue = () => {
  const { user } = useAuth();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["ai-jobs", user?.id],
    enabled: !!user,
    queryFn: () => AIJobService.recent(user!.id, 6),
  });

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">AI Actions Queue</p>
          <Button variant="ghost" size="sm" className="h-7 text-xs">View all <ChevronRight className="h-3 w-3" /></Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No pending AI actions.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job: AIJob) => {
              const Icon = iconFor(job.job_type);
              const title = job.job_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div key={job.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <span className={cn("mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize", statusColor(job.status))}>
                      {job.status}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs">Review</Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIActionsQueue;
