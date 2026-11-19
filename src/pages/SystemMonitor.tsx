import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Loader2, ServerCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { readEdgeError } from "@/services/edgeError";

type ProviderRow = {
  id: string;
  label: string;
  category: string;
  configured: boolean;
  envStatus: { name: string; present: boolean }[];
};

async function loadMonitor() {
  const database = await supabase.from("campaigns").select("id", { count: "exact", head: true });
  const jobs = await supabase.from("ai_jobs").select("id, status").order("created_at", { ascending: false }).limit(20);
  const publishing = await supabase.from("publishing_jobs").select("id, status").order("created_at", { ascending: false }).limit(20);

  let providers: ProviderRow[] = [];
  let providerError = "";
  const status = await supabase.functions.invoke("provider-status", { body: { action: "list" } });
  if (status.error) {
    providerError = await readEdgeError(status.error, "Provider status could not be loaded.");
  } else {
    providers = ((status.data?.providers ?? []) as ProviderRow[]).filter(
      (provider) => provider.id !== "freepik" && !provider.envStatus.some((item) => item.name === "FREEPIK_API_KEY"),
    );
  }

  return {
    databaseOk: !database.error,
    databaseError: database.error?.message ?? "",
    campaignCount: database.count ?? 0,
    jobs: jobs.error ? [] : jobs.data ?? [],
    jobsError: jobs.error?.message ?? "",
    publishing: publishing.error ? [] : publishing.data ?? [],
    publishingError: publishing.error?.message ?? "",
    providers,
    providerError,
  };
}

const SystemMonitor = () => {
  const query = useQuery({ queryKey: ["system-monitor"], queryFn: loadMonitor });
  const data = query.data;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
          {query.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Check again
        </Button>
      </div>

      {query.isError && (
        <p className="rounded-xl border border-destructive/30 bg-card px-4 py-8 text-center text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : "The monitor could not run."}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Database</CardDescription>
            <CardTitle className="flex items-center justify-between text-lg">
              Supabase
              <Badge variant="secondary">{data?.databaseOk ? "Reachable" : query.isLoading ? "Checking" : "Unavailable"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data?.databaseOk
              ? `${data.campaignCount.toLocaleString()} campaigns visible to this account.`
              : data?.databaseError || "Waiting for the first check."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI jobs</CardDescription>
            <CardTitle className="text-lg">{data ? data.jobs.length : "—"} recent</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data?.jobsError || (data && data.jobs.length === 0 ? "No AI jobs are stored for this account." : "Statuses come from the ai_jobs table.")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Publishing jobs</CardDescription>
            <CardTitle className="text-lg">{data ? data.publishing.length : "—"} recent</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data?.publishingError || (data && data.publishing.length === 0 ? "No publishing jobs are stored." : "Statuses come from publishing_jobs.")}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ServerCog className="h-5 w-5 text-primary" /> Provider keys
          </CardTitle>
          <CardDescription>Present means the secret exists on the Supabase project. It does not mean a live call succeeded.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.providerError && <p className="text-sm text-destructive">{data.providerError}</p>}
          {!data?.providerError && data && data.providers.length === 0 && !query.isLoading && (
            <p className="text-sm text-muted-foreground">The provider list came back empty.</p>
          )}
          <div className="grid gap-2">
            {(data?.providers ?? []).map((provider) => (
              <div key={provider.id} className="flex flex-col gap-1 rounded-xl border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{provider.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{provider.envStatus.map((item) => `${item.name} ${item.present ? "set" : "missing"}`).join(" · ")}</p>
                </div>
                <Badge variant="secondary" className="w-fit">{provider.configured ? "Configured" : "Missing key"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-primary" /> Recent job statuses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data?.jobs ?? []).slice(0, 8).map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-3">
              <span className="truncate text-muted-foreground">{job.id}</span>
              <span className="capitalize">{job.status}</span>
            </div>
          ))}
          {data && data.jobs.length === 0 && !data.jobsError && <p className="text-muted-foreground">No AI jobs are stored for this account.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitor;
