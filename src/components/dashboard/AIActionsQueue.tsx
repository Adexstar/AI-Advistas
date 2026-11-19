import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wand2, Users, TrendingUp, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const titleFor = (job: AIJob) => job.job_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const outputText = (job: AIJob) => {
  if (!job.output || typeof job.output !== "object" || Array.isArray(job.output)) {
    return job.output ? JSON.stringify(job.output, null, 2) : "This job has no saved output.";
  }
  const record = job.output as Record<string, unknown>;
  const content = record.content ?? record.text ?? record.error;
  if (typeof content === "string" && content.trim()) return content;
  return JSON.stringify(record, null, 2);
};

export const AIActionsQueue = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AIJob | null>(null);

  const { data: jobs = [], isLoading, isError, error } = useQuery({
    queryKey: ["ai-jobs", user?.id],
    enabled: !!user,
    queryFn: () => AIJobService.recent(user!.id, 20),
  });

  const visible = open ? jobs : jobs.slice(0, 4);

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold">AI Actions Queue</p>
          <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={() => setOpen(true)} disabled={jobs.length === 0}>
            View all <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-xs text-destructive">{error instanceof Error ? error.message : "Could not load AI jobs."}</p>
        ) : jobs.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No AI jobs are saved for this account.</p>
        ) : (
          <div className="space-y-2">
            {visible.slice(0, open ? visible.length : 4).map((job) => {
              const Icon = iconFor(job.job_type);
              return (
                <div key={job.id} className="flex items-start gap-2.5 rounded-xl border border-border/60 p-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="truncate text-sm font-medium leading-tight" title={titleFor(job)}>{titleFor(job)}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("inline-flex shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize", statusColor(job.status))}>
                        {job.status}
                      </span>
                      <Button size="sm" variant="outline" className="h-6 shrink-0 rounded-lg px-2 text-[11px]" onClick={() => setSelected(job)}>Review</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI jobs</DialogTitle>
            <DialogDescription>The latest jobs stored for this account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {jobs.map((job) => (
              <button key={job.id} type="button" className="flex w-full items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-left" onClick={() => setSelected(job)}>
                <span className="truncate text-sm font-medium">{titleFor(job)}</span>
                <span className="text-xs capitalize text-muted-foreground">{job.status}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(next) => { if (!next) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? titleFor(selected) : "Job"}</DialogTitle>
            <DialogDescription className="capitalize">{selected?.status}</DialogDescription>
          </DialogHeader>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">{selected ? outputText(selected) : ""}</pre>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AIActionsQueue;
