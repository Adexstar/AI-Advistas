import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Activity } from "lucide-react";

type Integration = {
  name: string;
  connected: boolean;
  lastSync?: string;
  health?: "healthy" | "degraded" | "down";
};

const categories: { title: string; items: Integration[] }[] = [
  {
    title: "Advertising",
    items: [
      { name: "Meta Ads", connected: false },
      { name: "Google Ads", connected: false },
      { name: "TikTok Ads", connected: false },
      { name: "LinkedIn Ads", connected: false },
      { name: "X Ads", connected: false },
      { name: "Pinterest", connected: false },
    ],
  },
  {
    title: "Creative",
    items: [
      { name: "Canva", connected: false },
      { name: "Freepik", connected: false },
    ],
  },
  {
    title: "Storage",
    items: [
      { name: "Google Drive", connected: false },
      { name: "Dropbox", connected: false },
      { name: "OneDrive", connected: false },
    ],
  },
  {
    title: "Backend",
    items: [
      { name: "Supabase", connected: true, lastSync: "Just now", health: "healthy" },
    ],
  },
  {
    title: "Developer",
    items: [
      { name: "API Keys", connected: false },
      { name: "Webhooks", connected: false },
    ],
  },
];

const healthClass = {
  healthy: "text-emerald-500",
  degraded: "text-amber-500",
  down: "text-rose-500",
} as const;

const IntegrationsHub = () => {
  return (
    <div className="page-container space-y-6 py-4 md:py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations Hub</h1>
        <p className="text-muted-foreground">Connect the platforms and storage your team uses every day.</p>
      </div>

      {categories.map((cat) => (
        <Card key={cat.title}>
          <CardHeader>
            <CardTitle className="text-lg">{cat.title}</CardTitle>
            <CardDescription>{cat.items.length} integrations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cat.items.map((it) => (
              <div key={it.name} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{it.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {it.connected ? (
                        <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Connected</>
                      ) : (
                        <><Circle className="h-3 w-3" /> Not Connected</>
                      )}
                    </p>
                  </div>
                  {it.health && (
                    <span className={`flex items-center gap-1 text-xs ${healthClass[it.health]}`}>
                      <Activity className="h-3 w-3" /> {it.health}
                    </span>
                  )}
                </div>
                <div className="mb-3 text-xs text-muted-foreground">
                  Last sync: <span className="text-foreground">{it.lastSync ?? "—"}</span>
                </div>
                {it.connected ? (
                  <Button variant="outline" size="sm" className="w-full">Disconnect</Button>
                ) : (
                  <Button size="sm" className="w-full">Connect</Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default IntegrationsHub;
