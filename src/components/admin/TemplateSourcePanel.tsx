import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, KeyRound, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readEdgeError } from "@/services/edgeError";
import { StockImportService } from "@/services/templates/StockImportService";
import {
  TEMPLATE_SOURCES,
  fetchWithProjectSecret,
  fetchWithSavedKey,
  forgetTemplateKey,
  importableTemplates,
  loadSavedTemplateKeys,
  saveTemplateKey,
  testSavedTemplateKey,
  type FetchedTemplate,
  type SavedTemplateKey,
  type TemplateSource,
} from "@/services/admin/templateSources";

type Notice = { ok: boolean; text: string };

export function TemplateSourcePanel() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState<SavedTemplateKey[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [project, setProject] = useState<Record<string, boolean>>({});
  const [projectError, setProjectError] = useState("");
  const [query, setQuery] = useState("skincare serum");
  const [busy, setBusy] = useState("");
  const [notices, setNotices] = useState<Record<string, Notice>>({});
  const [fetched, setFetched] = useState<FetchedTemplate[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const refreshSaved = async () => {
    setSaved(await loadSavedTemplateKeys());
  };

  useEffect(() => {
    let cancelled = false;
    refreshSaved().catch((error: Error) => {
      if (!cancelled) toast.error(error.message);
    });
    supabase.functions.invoke("provider-status", { body: { action: "list" } }).then(async ({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setProjectError(await readEdgeError(error, "Could not read which project secrets are set."));
        return;
      }
      const flags: Record<string, boolean> = {};
      for (const provider of data?.providers ?? []) {
        if (provider?.id) flags[provider.id] = !!provider.configured;
      }
      setProject(flags);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const savedFor = (id: string) => saved.find((row) => row.provider === id);

  const run = async (key: string, work: () => Promise<Notice>) => {
    setBusy(key);
    try {
      const notice = await work();
      setNotices((prev) => ({ ...prev, [key.split(":")[0]]: notice }));
      if (notice.ok) toast.success(notice.text);
      else toast.error(notice.text);
    } catch (error) {
      const text = error instanceof Error ? error.message : "The template source request failed.";
      setNotices((prev) => ({ ...prev, [key.split(":")[0]]: { ok: false, text } }));
      toast.error(text);
    } finally {
      setBusy("");
    }
  };

  const showFetched = (source: TemplateSource, items: FetchedTemplate[], via: string) => {
    setFetched(items);
    setPicked(new Set());
    if (source.id === "lovable") {
      const headline = items[0]?.name;
      if (!headline) throw new Error("Lovable did not return a headline.");
      return { ok: true, text: `${via} returned “${headline}”. Copy is not stored as a library template.` };
    }
    if (!items.length) return { ok: true, text: `${via} accepted the key and returned no templates for “${query.trim()}”.` };
    return { ok: true, text: `${via} returned ${items.length} template${items.length === 1 ? "" : "s"}.` };
  };

  const importPicked = () => run("import", async () => {
    const chosen = importableTemplates(fetched.filter((item) => picked.has(`${item.provider}:${item.source_id}`)));
    if (!chosen.length) throw new Error("Select a photo template. Lovable copy is not imported into the library.");
    const result = await StockImportService.importItems(chosen);
    await qc.invalidateQueries({ queryKey: ["admin-templates"] });
    await qc.invalidateQueries({ queryKey: ["templates-library"] });
    setPicked(new Set());
    const count = result.imported ?? 0;
    return {
      ok: true,
      text: count
        ? `Imported ${count} as pending. Approve them in this gallery and they appear on Templates.`
        : result.message || "Nothing new to import.",
    };
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="text-base font-semibold">Template sources</h2>
          <p className="text-sm text-muted-foreground">
            Pexels, Pixabay, Unsplash, and Lovable. A key saved here is tested and used to fetch from this browser. The project secret is the key already stored for the edge functions. Imported photos stay pending until you approve them, then they show on Templates.
          </p>
        </div>
        {projectError && <p className="text-sm text-destructive">{projectError}</p>}
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search term, for example skincare serum"
          aria-label="Template search"
        />
        <div className="space-y-3">
          {TEMPLATE_SOURCES.map((source) => {
            const row = savedFor(source.id);
            const known = project[source.id];
            const notice = notices[source.id];
            return (
              <div key={source.id} className="space-y-3 rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{source.label}</p>
                  <Badge variant={known ? "secondary" : "outline"}>
                    {known === undefined ? source.secret : known ? `${source.secret} is set` : `${source.secret} is not set`}
                  </Badge>
                  <Badge variant="outline">{row ? `Saved ${row.last4}` : "No key saved on this account"}</Badge>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="password"
                    autoComplete="off"
                    value={drafts[source.id] ?? ""}
                    onChange={(event) => setDrafts((prev) => ({ ...prev, [source.id]: event.target.value }))}
                    placeholder={`Paste ${source.secret}`}
                    aria-label={`${source.label} API key`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!!busy}
                    onClick={() => run(`${source.id}:save`, async () => {
                      const next = await saveTemplateKey(source, drafts[source.id] ?? "");
                      setSaved((prev) => [next, ...prev.filter((item) => item.provider !== source.id)]);
                      setDrafts((prev) => ({ ...prev, [source.id]: "" }));
                      return { ok: true, text: `Saved ${source.secret} as ${next.last4}.` };
                    })}
                  >
                    {busy === `${source.id}:save` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    Save key
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!!busy || !row}
                    onClick={() => run(`${source.id}:test`, async () => {
                      const text = await testSavedTemplateKey(source, row?.accessToken ?? "");
                      return { ok: true, text };
                    })}
                  >
                    {busy === `${source.id}:test` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Test saved key
                  </Button>
                  {source.kind !== "lovable" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!!busy || !row}
                      onClick={() => run(`${source.id}:fetch`, async () => {
                        const items = await fetchWithSavedKey(source, row?.accessToken ?? "", query);
                        return showFetched(source, items, "Saved key");
                      })}
                    >
                      {busy === `${source.id}:fetch` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Fetch with saved key
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={!!busy}
                    onClick={() => run(`${source.id}:project`, async () => {
                      const items = await fetchWithProjectSecret(source, query);
                      return showFetched(source, items, "Project secret");
                    })}
                  >
                    {busy === `${source.id}:project` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {source.kind === "lovable" ? "Test project secret" : "Fetch with project secret"}
                  </Button>
                  {row && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={!!busy}
                      onClick={() => run(`${source.id}:forget`, async () => {
                        await forgetTemplateKey(row.id);
                        setSaved((prev) => prev.filter((item) => item.id !== row.id));
                        return { ok: true, text: `Removed the saved ${source.secret}.` };
                      })}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                {notice && <p className={`text-sm ${notice.ok ? "text-muted-foreground" : "text-destructive"}`}>{notice.text}</p>}
              </div>
            );
          })}
        </div>
        {fetched.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Fetched templates</p>
              <Button type="button" size="sm" onClick={importPicked} disabled={!!busy || picked.size === 0}>
                {busy === "import" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Import selected ({picked.size})
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {fetched.map((item) => {
                const key = `${item.provider}:${item.source_id}`;
                const on = picked.has(key);
                const canImport = item.provider !== "lovable" && !!item.image_url;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!canImport}
                    onClick={() => setPicked((prev) => {
                      const next = new Set(prev);
                      next.has(key) ? next.delete(key) : next.add(key);
                      return next;
                    })}
                    className={`relative overflow-hidden rounded-lg border text-left ${on ? "border-primary ring-2 ring-primary" : "border-border"}`}
                  >
                    {item.thumbnail_url || item.image_url ? (
                      <img src={item.thumbnail_url || item.image_url} alt={item.name} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square items-center p-3 text-sm">{item.name}</div>
                    )}
                    <p className="truncate p-2 text-xs">{item.name}</p>
                    {on && <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground"><Check className="h-3 w-3" /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
