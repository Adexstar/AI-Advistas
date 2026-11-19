import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { PlatformConnectionService } from "@/services/publishing/PlatformConnectionService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const advertising = [
  { name: "Meta Ads", platform: "facebook" },
  { name: "Instagram", platform: "instagram" },
  { name: "Google Ads", platform: "google" },
  { name: "TikTok Ads", platform: "tiktok" },
  { name: "LinkedIn Ads", platform: "linkedin" },
];

const IntegrationsHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const connections = useQuery({
    queryKey: ["platform-connections", user?.id],
    enabled: !!user?.id,
    queryFn: () => PlatformConnectionService.list(),
  });
  const database = useQuery({
    queryKey: ["integrations-database", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { error } = await supabase.from("campaigns").select("id", { head: true, count: "exact" });
      if (error) throw error;
      return true;
    },
  });

  const connected = (platform: string) => (connections.data ?? []).some((row) => row.platform === platform && row.is_active);

  return (
    <div className="page-container min-w-0 space-y-6 py-4 md:py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Integrations Hub</h1>
        <p className="text-muted-foreground">Connections shown here are rows saved on your account. Ad platforms do not have an OAuth setup, so Connect opens the place where that is explained.</p>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-lg">Advertising</CardTitle>
          <CardDescription>Saved platform connections</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {connections.isError && <p className="text-sm text-destructive">Could not load connections. None are shown as active.</p>}
          {advertising.map((item) => {
            const on = connected(item.platform);
            return (
              <div key={item.platform} className="min-w-0 rounded-2xl border border-border bg-card p-4">
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {on ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Circle className="h-3 w-3" />}
                  {on ? "A connection is saved" : "Not connected"}
                </p>
                <p className="mb-3 mt-3 text-xs text-muted-foreground">
                  {on ? "Disconnect it from Settings if you no longer want it stored." : "There is no OAuth flow, so this does not sign you into the ad account."}
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/settings?tab=integrations")}>
                  {on ? "Manage" : "View in Settings"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">App backend</CardTitle>
          <CardDescription>The database this workspace is using right now</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Supabase</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {database.isLoading && "Checking the database…"}
              {database.isSuccess && "The campaigns table answered this account."}
              {database.isError && (database.error instanceof Error ? database.error.message : "The database check failed.")}
            </p>
          </div>
          {database.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <span className="text-sm text-muted-foreground">{database.isSuccess ? "Reachable" : "Unavailable"}</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsHub;
