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

const FALLBACK_CATALOG: Omit<Provider, "envStatus" | "configured">[] = [
  { id: "pexels", label: "Pexels", category: "search", envVars: ["PEXELS_API_KEY"], testFn: "search-pexels", docsUrl: "https://www.pexels.com/api/" },
  { id: "pixabay", label: "Pixabay", category: "search", envVars: ["PIXABAY_API_KEY"], testFn: "search-pixabay", docsUrl: "https://pixabay.com/api/docs/" },
  { id: "unsplash", label: "Unsplash", category: "search", envVars: ["UNSPLASH_ACCESS_KEY"], testFn: "search-unsplash", docsUrl: "https://unsplash.com/developers" },
  { id: "freepik", label: "Freepik / Magnific", category: "search", envVars: ["FREEPIK_API_KEY"], testFn: "search-freepik-templates", docsUrl: "https://freepik.com/api" },
  { id: "brandfetch", label: "Brandfetch", category: "brand", envVars: ["BRANDFETCH_API_KEY"], docsUrl: "https://brandfetch.com/developers" },
  { id: "leonardo", label: "Leonardo AI", category: "generate-image", envVars: ["LEONARDO_API_KEY"], docsUrl: "https://leonardo.ai/api" },
  { id: "ideogram", label: "Ideogram", category: "generate-image", envVars: ["IDEOGRAM_API_KEY"], docsUrl: "https://ideogram.ai/api" },
  { id: "runway", label: "Runway", category: "generate-video", envVars: ["RUNWARE_API_KEY"], docsUrl: "https://runwayml.com/api" },
  { id: "kling", label: "Kling", category: "generate-video", envVars: ["KLING_API_KEY"], docsUrl: "https://klingai.com/" },
  { id: "veo", label: "Veo", category: "generate-video", envVars: ["VEO_API_KEY", "GOOGLE_GEMINI_API_KEY"], docsUrl: "https://deepmind.google/technologies/veo/" },
  { id: "cloudinary", label: "Cloudinary", category: "media", envVars: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"], docsUrl: "https://cloudinary.com/documentation" },
  { id: "ayrshare", label: "Ayrshare", category: "publishing", envVars: ["AYRSHARE_API_KEY"], docsUrl: "https://ayrshare.com/docs" },
  { id: "openai", label: "OpenAI", category: "ai", envVars: ["OPENAI_API_KEY"], docsUrl: "https://platform.openai.com/" },
  { id: "gemini", label: "Google Gemini", category: "ai", envVars: ["GOOGLE_GEMINI_API_KEY"], docsUrl: "https://ai.google.dev/" },
  { id: "groq", label: "Groq", category: "ai", envVars: ["GROQ_API_KEY"], docsUrl: "https://groq.com/" },
  { id: "lovable", label: "Lovable AI Gateway", category: "ai", envVars: ["LOVABLE_API_KEY"] },
];

export default function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TestResult>>({});

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
      // Fallback so the page always renders something useful
      setProviders(
        FALLBACK_CATALOG.map((p) => ({
          ...p,
          envStatus: p.envVars.map((name) => ({ name, present: false })),
          configured: false,
        })),
      );
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

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>
            Couldn't reach provider-status edge function: {loadError}. Showing catalog with unknown key status — click Refresh to retry.
          </AlertDescription>
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
