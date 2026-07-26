import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type EnvStatus = { name: string; present: boolean };
type Provider = {
  id: string;
  label: string;
  category: string;
  envVars: string[];
  envStatus: EnvStatus[];
  configured: boolean;
  docsUrl?: string;
  testFn?: string;
};

type TestResult = {
  ok: boolean;
  status?: number;
  durationMs?: number;
  count?: number;
  error?: string;
  missing?: string[];
  note?: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  search: "Media Search",
  "generate-image": "Image Generation",
  "generate-video": "Video Generation",
  media: "Media Engine",
  brand: "Brand",
  publishing: "Publishing",
  ai: "AI Models",
};

export default function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TestResult>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("provider-status?action=list", { method: "GET" as any });
    if (error) {
      toast.error(error.message);
    } else {
      setProviders(data?.providers ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runTest = async (id: string) => {
    setTesting((t) => ({ ...t, [id]: true }));
    const { data, error } = await supabase.functions.invoke("provider-status?action=test", {
      body: { id },
    });
    const result: TestResult = error ? { ok: false, error: error.message } : data;
    setResults((r) => ({ ...r, [id]: result }));
    setTesting((t) => ({ ...t, [id]: false }));
    if (result.ok) toast.success(`${id}: OK${result.durationMs ? ` (${result.durationMs}ms)` : ""}`);
    else toast.error(`${id}: ${result.error ?? "failed"}`);
  };

  const grouped = providers.reduce<Record<string, Provider[]>>((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">External Providers</h1>
          <p className="text-muted-foreground mt-2">
            Configure and test API keys for every adapter behind AdVista's service layer.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          API keys are stored as Supabase Edge Function secrets. To add or rotate a key, open the{" "}
          <a
            href="https://supabase.com/dashboard/project/mvfmasacpbjnyfakdwfp/settings/functions"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Edge Function Secrets page
          </a>{" "}
          and then click Refresh here.
        </AlertDescription>
      </Alert>

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}

      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">{CATEGORY_LABEL[cat] ?? cat}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((p) => {
              const r = results[p.id];
              return (
                <Card key={p.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        {p.configured ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        {p.label}
                      </span>
                      <Badge variant={p.configured ? "default" : "secondary"}>
                        {p.configured ? "Configured" : "Missing keys"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      {p.envStatus.map((e) => (
                        <div key={e.name} className="flex items-center justify-between text-xs font-mono">
                          <span>{e.name}</span>
                          {e.present ? (
                            <span className="text-green-500">set</span>
                          ) : (
                            <span className="text-destructive">missing</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => runTest(p.id)}
                        disabled={testing[p.id] || !p.configured}
                      >
                        {testing[p.id] ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
                        Test
                      </Button>
                      {p.docsUrl && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={p.docsUrl} target="_blank" rel="noreferrer">
                            Docs <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {!p.testFn && p.configured && (
                        <span className="text-xs text-muted-foreground">No automated test</span>
                      )}
                    </div>
                    {r && (
                      <div className={`text-xs rounded border p-2 ${r.ok ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                        {r.ok ? (
                          <>
                            OK · {r.status ?? 200}
                            {typeof r.durationMs === "number" ? ` · ${r.durationMs}ms` : ""}
                            {typeof r.count === "number" ? ` · ${r.count} results` : ""}
                            {r.note ? ` · ${r.note}` : ""}
                          </>
                        ) : (
                          <>
                            Failed: {r.error ?? "unknown"}
                            {r.missing?.length ? ` (missing: ${r.missing.join(", ")})` : ""}
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
