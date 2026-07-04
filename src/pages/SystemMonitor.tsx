import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, ListChecks, ServerCog, ShieldAlert, Webhook, Zap } from "lucide-react";

const services = [
  { name: "OpenAI", status: "healthy" },
  { name: "Canva", status: "healthy" },
  { name: "Freepik", status: "healthy" },
  { name: "Supabase", status: "healthy" },
] as const;

const statusColor: Record<string, string> = {
  healthy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  degraded: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  down: "bg-rose-500/10 text-rose-500 border-rose-500/30",
};

const SystemMonitor = () => (
  <div className="page-container space-y-6 py-4 md:py-6">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">System Monitor</h1>
      <p className="text-muted-foreground">Admin-only maintenance surface for AdVista infrastructure.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {services.map((s) => (
        <Card key={s.name}>
          <CardHeader className="pb-2">
            <CardDescription>{s.name}</CardDescription>
            <CardTitle className="flex items-center justify-between text-lg">
              API Health
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor[s.status]}`}>{s.status}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Last checked: just now</CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      {[
        { icon: Zap, title: "AI Jobs", desc: "Currently processing jobs and their runtimes." },
        { icon: ListChecks, title: "Queue Status", desc: "Backlog length, oldest item age, throughput." },
        { icon: ShieldAlert, title: "Failed Jobs", desc: "Error traces from failed AI executions." },
        { icon: Webhook, title: "Webhook Logs", desc: "Inbound and outbound webhook history." },
        { icon: Activity, title: "Rate Limits", desc: "Per-provider quota usage in real time." },
        { icon: Database, title: "Database Health", desc: "Query latency, connection pool, replication." },
      ].map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.title}>
            <CardHeader>
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{s.title}</CardTitle>
              <CardDescription>{s.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Live view coming soon</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ServerCog className="h-5 w-5 text-primary" /> Maintenance surface
        </CardTitle>
        <CardDescription>Not visible in sidebar — reachable only to administrators.</CardDescription>
      </CardHeader>
    </Card>
  </div>
);

export default SystemMonitor;
