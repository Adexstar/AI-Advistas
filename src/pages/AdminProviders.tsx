import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";

type EnvStatus = { name: string; present: boolean };
type PlaygroundField = {
  key: string; label: string; type: "text" | "textarea" | "select";
  default?: string; placeholder?: string; options?: string[];
};
type Provider = {
  id: string;
  label: string;
  category: string;
  envVars: string[];
  envStatus: EnvStatus[];
  configured: boolean;
  docsUrl?: string;
  testFn?: string;
  playgroundFn?: string;
  playgroundKind?: "image" | "video" | "search" | "json";
  playgroundFields?: PlaygroundField[];
};

type TestResult = {
  ok: boolean;
  status?: number;
  durationMs?: number;
  count?: number;
  error?: string;
  missing?: string[];
  note?: string;
  results?: any[];
  data?: any;
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [playgroundFor, setPlaygroundFor] = useState<Provider | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase.functions.invoke("provider-status", { body: { action: "list" } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setProviders(data?.providers ?? []);
    } catch (e: any) {
      const msg = e?.message || "Failed to load providers";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runTest = async (id: string) => {
    setTesting((t) => ({ ...t, [id]: true }));
    const { data, error } = await supabase.functions.invoke("provider-status", {
      body: { action: "test", id },
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
            Configure, smoke-test, and interactively try every adapter behind AdVista.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          API keys are stored as Supabase Edge Function secrets.{" "}
          <a
            href="https://supabase.com/dashboard/project/mvfmasacpbjnyfakdwfp/settings/functions"
            target="_blank" rel="noreferrer" className="underline"
          >
            Manage keys here
          </a>
          . <span className="font-medium">Test</span> runs a fixed smoke call.{" "}
          <span className="font-medium">Try it</span> opens a playground where you can send custom input and see the real response.
        </AlertDescription>
      </Alert>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>Couldn't reach provider-status: {loadError}</AlertDescription>
        </Alert>
      )}

      {loading && providers.length === 0 && (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      )}

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
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm" onClick={() => runTest(p.id)}
                        disabled={testing[p.id] || !p.configured || !p.testFn}
                      >
                        {testing[p.id] ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
                        Test
                      </Button>
                      {p.playgroundFn && (
                        <Button
                          size="sm" variant="secondary"
                          onClick={() => setPlaygroundFor(p)}
                          disabled={!p.configured}
                        >
                          <Sparkles className="h-3 w-3 mr-1" /> Try it
                        </Button>
                      )}
                      {p.docsUrl && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={p.docsUrl} target="_blank" rel="noreferrer">
                            Docs <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {!p.testFn && !p.playgroundFn && p.configured && (
                        <span className="text-xs text-muted-foreground">No adapter wired</span>
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

      <PlaygroundDialog
        provider={playgroundFor}
        onClose={() => setPlaygroundFor(null)}
      />
    </div>
  );
}

function PlaygroundDialog({ provider, onClose }: { provider: Provider | null; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const fields = provider?.playgroundFields ?? [];

  useEffect(() => {
    if (!provider) return;
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.key] = f.default ?? ""; });
    setValues(init);
    setResult(null);
  }, [provider?.id]);

  const run = async () => {
    if (!provider) return;
    setBusy(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("provider-status", {
      body: { action: "playground", id: provider.id, input: values },
    });
    const r: TestResult = error ? { ok: false, error: error.message } : data;
    setResult(r);
    setBusy(false);
    if (r.ok) toast.success(`${provider.label}: OK (${r.durationMs ?? 0}ms)`);
    else toast.error(`${provider.label}: ${r.error ?? "failed"}`);
  };

  const previews = useMemo(() => extractPreviews(result, provider?.playgroundKind), [result, provider?.playgroundKind]);

  return (
    <Dialog open={!!provider} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {provider && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> {provider.label} playground
              </DialogTitle>
              <DialogDescription>
                Sends real requests to <code className="font-mono text-xs">{provider.playgroundFn}</code>. Results below are live.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      rows={3} placeholder={f.placeholder}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  ) : f.type === "select" ? (
                    <Select value={values[f.key] ?? ""} onValueChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={f.placeholder}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button onClick={run} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Run
              </Button>
            </DialogFooter>

            {result && (
              <div className="space-y-3 pt-2 border-t">
                <div className={`text-xs rounded border p-2 ${result.ok ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                  {result.ok
                    ? <>OK · {result.status ?? 200} · {result.durationMs ?? 0}ms{typeof result.count === "number" ? ` · ${result.count} results` : ""}</>
                    : <>Failed: {result.error ?? "unknown"}{result.missing?.length ? ` (missing: ${result.missing.join(", ")})` : ""}</>}
                </div>

                {previews.images.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Images ({previews.images.length})</div>
                    <div className="grid grid-cols-3 gap-2">
                      {previews.images.slice(0, 9).map((src, i) => (
                        <a key={i} href={src} target="_blank" rel="noreferrer" className="block">
                          <img src={src} alt="" className="w-full h-32 object-cover rounded border" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {previews.videos.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Videos ({previews.videos.length})</div>
                    <div className="grid grid-cols-2 gap-2">
                      {previews.videos.slice(0, 4).map((src, i) => (
                        <video key={i} src={src} controls className="w-full rounded border" />
                      ))}
                    </div>
                  </div>
                )}

                <details>
                  <summary className="text-xs cursor-pointer text-muted-foreground">Raw response</summary>
                  <pre className="text-[10px] mt-2 max-h-64 overflow-auto p-2 bg-muted rounded">
                    {JSON.stringify(result.data ?? result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function extractPreviews(r: TestResult | null, kind?: string) {
  const images: string[] = [];
  const videos: string[] = [];
  if (!r) return { images, videos };
  const data = r.data ?? {};
  const list: any[] = Array.isArray(r.results) ? r.results : Array.isArray(data.results) ? data.results : [];

  const pushMedia = (item: any) => {
    if (!item || typeof item !== "object") return;
    const url = item.url || item.thumbnailUrl || item.videoUrl || item.image_url;
    const k = item.kind || (item.videoUrl ? "video" : "image");
    if (!url) return;
    if (k === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url)) videos.push(url);
    else images.push(url);
  };

  list.forEach(pushMedia);

  // Single-item responses (generators)
  if (data.url) {
    if ((data.kind ?? kind) === "video") videos.push(data.url);
    else images.push(data.url);
  }

  return { images, videos };
}
