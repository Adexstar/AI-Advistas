import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Activity } from "lucide-react";
import { toast } from "sonner";

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
      { name: "Supabase", connected: true, health: "healthy" },
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
    <div className="page-container min-w-0 space-y-6 py-4 md:py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Integrations Hub</h1>
        <p className="text-muted-foreground">These channels are not linked. Connect does not start OAuth, because that flow is not configured.</p>
      </div>

      {categories.map((cat) => (
        <Card key={cat.title} className="min-w-0">
          <CardHeader>
            <CardTitle className="text-lg">{cat.title}</CardTitle>
            <CardDescription>{cat.items.length} integrations</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cat.items.map((it) => (
              <div key={it.name} className="min-w-0 rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{it.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {it.connected ? (
                        <><CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" /> App backend</>
                      ) : (
                        <><Circle className="h-3 w-3 shrink-0" /> Not connected</>
                      )}
                    </p>
                  </div>
                  {it.health && (
                    <span className={`flex shrink-0 items-center gap-1 text-xs ${healthClass[it.health]}`}>
                      <Activity className="h-3 w-3" /> {it.health}
                    </span>
                  )}
                </div>
                <div className="mb-3 break-words text-xs text-muted-foreground">
                  {it.connected ? "Used by this app for data." : "No account link is stored."}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info(it.connected
                    ? "Supabase is the app database. This screen cannot disconnect it."
                    : `${it.name} stays disconnected. OAuth is not configured.`)}
                >
                  {it.connected ? "In use" : "Connect"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default IntegrationsHub;
