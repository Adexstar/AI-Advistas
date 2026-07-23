import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  PublishingService,
  PublishingValidator,
  PublishingHistoryService,
  AIPublishingAssistant,
  type PublishJobRow,
  type PublishMode,
  type MarketingAsset,
} from "@/services/publishing";
import {
  Send, Sparkles, CheckCircle2, XCircle, Clock, AlertTriangle, RotateCcw, X, History,
} from "lucide-react";

const PLATFORMS = [
  { id: "facebook",  label: "Facebook",  mode: "social" as const },
  { id: "instagram", label: "Instagram", mode: "social" as const },
  { id: "tiktok",    label: "TikTok",    mode: "social" as const },
  { id: "linkedin",  label: "LinkedIn",  mode: "social" as const },
  { id: "x",         label: "X",         mode: "social" as const },
  { id: "pinterest", label: "Pinterest", mode: "social" as const },
  { id: "youtube",   label: "YouTube",   mode: "social" as const },
  { id: "google",    label: "Google Ads", mode: "paid"   as const },
];

const STATUS_STYLE: Record<string, { bg: string; fg: string; icon: any }> = {
  queued:     { bg: "bg-slate-100",   fg: "text-slate-700",   icon: Clock },
  scheduled:  { bg: "bg-blue-100",    fg: "text-blue-700",    icon: Clock },
  publishing: { bg: "bg-amber-100",   fg: "text-amber-700",   icon: Send },
  published:  { bg: "bg-emerald-100", fg: "text-emerald-700", icon: CheckCircle2 },
  failed:     { bg: "bg-red-100",     fg: "text-red-700",     icon: XCircle },
  draft:      { bg: "bg-slate-100",   fg: "text-slate-500",   icon: Clock },
  cancelled:  { bg: "bg-slate-100",   fg: "text-slate-500",   icon: X },
};

interface Props {
  campaign: any;
}

export function CampaignPublishingTab({ campaign }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selected, setSelected] = useState<string[]>(["facebook", "instagram"]);
  const [when, setWhen] = useState<PublishMode>("now");
  const [scheduledAt, setScheduledAt] = useState<string>("");

  const asset: MarketingAsset = useMemo(() => ({
    id: campaign.id,
    userId: user?.id ?? "",
    campaignId: campaign.id,
    category: campaign.category ?? null,
    platform: selected[0] ?? "facebook",
    goal: campaign.objective ?? null,
    status: "draft",
    mediaUrl: campaign.hero_image_url ?? campaign.media_url ?? undefined,
    headline: campaign.headline ?? campaign.name,
    body: campaign.body_copy ?? campaign.description ?? "",
    cta: campaign.cta ?? campaign.call_to_action ?? "Learn More",
  }), [campaign, user, selected]);

  const validation = useMemo(
    () => PublishingValidator.validateMany(asset, selected),
    [asset, selected],
  );
  const review = useMemo(
    () => AIPublishingAssistant.review(asset, selected),
    [asset, selected],
  );

  const jobsQuery = useQuery({
    queryKey: ["publishing-jobs", campaign.id],
    queryFn: () => PublishingService.listJobs(campaign.id),
  });

  const historyQuery = useQuery({
    queryKey: ["publishing-history", campaign.id],
    queryFn: () => PublishingHistoryService.list(campaign.id),
  });

  useEffect(() => {
    const active = (jobsQuery.data ?? []).some(j => ["queued", "publishing", "scheduled"].includes(j.status));
    if (!active) return;
    const t = setInterval(() => qc.invalidateQueries({ queryKey: ["publishing-jobs", campaign.id] }), 4000);
    return () => clearInterval(t);
  }, [jobsQuery.data, campaign.id, qc]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      const targets = selected.map((platform) => {
        const p = PLATFORMS.find((x) => x.id === platform);
        return { platform, mode: p?.mode ?? "social" as const };
      });
      return PublishingService.publish({
        campaignId: campaign.id,
        asset,
        targets,
        when,
        scheduledAt: when === "schedule" ? scheduledAt : undefined,
      });
    },
    onSuccess: () => {
      toast({ title: when === "now" ? "Publishing started" : when === "schedule" ? "Scheduled" : "Saved as draft" });
      qc.invalidateQueries({ queryKey: ["publishing-jobs", campaign.id] });
      qc.invalidateQueries({ queryKey: ["publishing-history", campaign.id] });
      qc.invalidateQueries({ queryKey: ["campaign", campaign.id] });
    },
    onError: (e: any) => toast({ title: "Publish failed", description: e.message, variant: "destructive" }),
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => PublishingService.retry(jobId, asset),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", campaign.id] }),
  });
  const cancelMutation = useMutation({
    mutationFn: (jobId: string) => PublishingService.cancel(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["publishing-jobs", campaign.id] }),
  });

  const canPublish =
    selected.length > 0 &&
    selected.every((p) => validation[p]?.ok) &&
    (when !== "schedule" || !!scheduledAt);

  const toggle = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: config */}
      <div className="lg:col-span-2 space-y-6">
        {/* Platforms */}
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Platforms</h3>
                <p className="text-xs text-muted-foreground">Choose where to publish this campaign.</p>
              </div>
              <Badge variant="secondary">{selected.length} selected</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PLATFORMS.map((p) => {
                const v = validation[p.id];
                const isSel = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`flex items-start gap-2 rounded-xl border p-3 text-left transition ${isSel ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <Checkbox checked={isSel} className="mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{p.mode}</p>
                      {isSel && v && !v.ok && (
                        <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {v.issues[0].message}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* When */}
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-base font-bold">Publishing Time</h3>
            <RadioGroup value={when} onValueChange={(v) => setWhen(v as PublishMode)} className="grid gap-2">
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer">
                <RadioGroupItem value="now" /> <span className="text-sm font-medium">Publish Now</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer">
                <RadioGroupItem value="schedule" /> <span className="text-sm font-medium">Schedule</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer">
                <RadioGroupItem value="draft" /> <span className="text-sm font-medium">Save as Draft</span>
              </label>
            </RadioGroup>
            {when === "schedule" && (
              <div className="grid gap-2 max-w-xs">
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jobs */}
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Active Jobs</h3>
              <Badge variant="secondary">{jobsQuery.data?.length ?? 0}</Badge>
            </div>
            {(jobsQuery.data?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                No publishing jobs yet.
              </div>
            ) : (
              <div className="space-y-2">
                {jobsQuery.data!.map((job) => <JobRow key={job.id} job={job} onRetry={() => retryMutation.mutate(job.id)} onCancel={() => cancelMutation.mutate(job.id)} />)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <h3 className="text-base font-bold">Distribution History</h3>
            </div>
            {(historyQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <ul className="divide-y">
                {historyQuery.data!.slice(0, 20).map((h: any) => (
                  <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className="font-medium capitalize">{h.action}</span>
                      <span className="text-muted-foreground"> · {h.platform}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ResultBadge result={h.result} />
                      <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: AI review + publish */}
      <div className="space-y-6">
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold">AI Publishing Assistant</h3>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estimated performance</p>
              <p className="text-3xl font-bold">{review.score}<span className="text-base text-muted-foreground">/100</span></p>
              <Progress value={review.score} className="h-2 mt-2" />
            </div>
            {review.bestTime && (
              <div className="rounded-lg bg-background/60 p-3 text-xs">
                <span className="text-muted-foreground">Best time to publish: </span>
                <span className="font-medium">{review.bestTime}</span>
              </div>
            )}
            {selected.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Platform compatibility</p>
                {selected.map((p) => (
                  <div key={p} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{p}</span>
                    <span className="font-medium">{review.compatibility[p]}%</span>
                  </div>
                ))}
              </div>
            )}
            {review.warnings.length > 0 && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">
                  {review.warnings.slice(0, 2).map((w, i) => <div key={i}>{w}</div>)}
                </AlertDescription>
              </Alert>
            )}
            {review.recommendations.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Recommendations</p>
                <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                  {review.recommendations.slice(0, 4).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!canPublish || publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              <Send className="h-4 w-4" />
              {publishMutation.isPending
                ? "Working…"
                : when === "now"    ? "Publish Now"
                : when === "schedule" ? "Schedule Campaign"
                :                     "Save as Draft"}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              All publishing routes through AdVista's Publishing Engine — never directly from your browser.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function JobRow({ job, onRetry, onCancel }: { job: PublishJobRow; onRetry: () => void; onCancel: () => void }) {
  const style = STATUS_STYLE[job.status] ?? STATUS_STYLE.queued;
  const Icon = style.icon;
  const url = (job.external_ids as any)?.url;
  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${style.bg}`}>
          <Icon className={`h-4 w-4 ${style.fg}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold capitalize truncate">{job.platform} · {job.provider}</p>
          <p className="text-[11px] text-muted-foreground">
            {job.status}
            {job.scheduled_at && ` · scheduled ${new Date(job.scheduled_at).toLocaleString()}`}
            {job.error_message && ` · ${job.error_message.slice(0, 60)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {url && <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View</a>}
        {job.status === "failed" && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRetry}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        {["queued", "scheduled"].includes(job.status) && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700",
    failure: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${map[result] ?? "bg-slate-100 text-slate-700"}`}>{result}</span>;
}
