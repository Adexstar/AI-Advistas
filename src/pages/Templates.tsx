/**
 * /templates — user-facing Template Library.
 * Reads the SAME `templates` table the admin page uses, applies AI Context
 * filtering (dismissible), computes an explainable score, and renders cards.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAIContext } from "@/contexts/AIContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { setPendingEditorTemplate } from "@/lib/templateEditorSession";
import type { TemplateRecord } from "@/services/templates/types";
import {
  Search, Sparkles, Heart, Eye, Pencil, X, AlertTriangle, RefreshCw,
  Facebook, Instagram, Linkedin, Youtube, LayoutGrid, ImageIcon,
} from "lucide-react";

const PAGE_SIZE = 12;
const FAV_KEY = "advista_template_favorites";

const CATEGORY_CHIPS = ["All", "Beauty", "Fashion", "Real Estate", "SaaS & Technology", "Restaurant & Food", "Fitness", "E-commerce"];
const PLATFORM_CHIPS = ["All", "Instagram", "Instagram Story", "Facebook", "TikTok", "LinkedIn", "Google Display"];
const FORMAT_CHIPS = ["All", "square", "story", "portrait", "landscape"];
const FORMAT_LABEL: Record<string, string> = { square: "Post", story: "Story", portrait: "Portrait", landscape: "Landscape" };

const PLATFORM_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Facebook, Instagram, "Instagram Story": Instagram, LinkedIn: Linkedin, YouTube: Youtube, TikTok: Sparkles,
};

type Row = TemplateRecord & { format: string | null };

const hasBrandVars = (t: Row) => {
  try {
    return JSON.stringify(t.template_json ?? {}).includes("{{brand.");
  } catch {
    return false;
  }
};

interface Scored { t: Row; score: number; confidence: number; brandReady: boolean }

const useFavorites = () => {
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); } catch { return new Set(); }
  });
  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); }, [favs]);
  const toggle = (id: string) => setFavs((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  return [favs, toggle] as const;
};

const TemplateThumb = ({ t }: { t: Row }) => {
  const [failed, setFailed] = useState(false);
  const src = t.preview_url || t.thumbnail_url;
  if (!src || failed) {
    return (
      <div className="flex h-44 w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
        <ImageIcon className="h-6 w-6" />
        <span className="px-3 text-center text-xs font-medium">{t.name}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${t.name} template preview`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-44 w-full object-cover"
    />
  );
};

export default function Templates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { effectiveContext } = useAIContext();
  const [favs, toggleFav] = useFavorites();

  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [format, setFormat] = useState("All");
  const [ctxDismissed, setCtxDismissed] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    const id = setTimeout(() => setSearch(rawSearch.trim()), 300);
    return () => clearTimeout(id);
  }, [rawSearch]);

  const { data, isLoading, error, refetch, isFetching } = useQuery<Row[], Error>({
    queryKey: ["templates-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("popularity_score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
    staleTime: 60_000,
  });

  const ctxCategory = effectiveContext?.active_category ?? null;
  const ctxGoal = (effectiveContext as any)?.active_objective ?? (effectiveContext as any)?.current_goal ?? null;
  const ctxPlatform = (effectiveContext as any)?.active_platform ?? null;
  const ctxActive = !ctxDismissed && Boolean(ctxCategory || ctxGoal);

  const scored = useMemo<Scored[]>(() => {
    const rows = data ?? [];
    return rows
      .map((t) => {
        let score = 0;
        if (ctxCategory && t.category?.toLowerCase() === String(ctxCategory).toLowerCase()) score += 30;
        if (ctxGoal && t.objective?.toLowerCase() === String(ctxGoal).toLowerCase()) score += 25;
        if (ctxPlatform && t.platform?.toLowerCase() === String(ctxPlatform).toLowerCase()) score += 20;
        const brandReady = hasBrandVars(t);
        if (brandReady) score += 15;
        score += Number((t as any).performance_score ?? 0);
        score += (t.popularity_score ?? 0) / 100;
        return { t, score, confidence: Math.max(0, Math.min(100, Math.round(score))), brandReady };
      })
      .sort((a, b) => b.score - a.score);
  }, [data, ctxCategory, ctxGoal, ctxPlatform]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scored.filter(({ t }) => {
      if (ctxActive && ctxCategory && t.category?.toLowerCase() !== String(ctxCategory).toLowerCase()) return false;
      if (ctxActive && ctxGoal && t.objective?.toLowerCase() !== String(ctxGoal).toLowerCase()) return false;
      if (category !== "All" && t.category !== category) return false;
      if (platform !== "All" && t.platform !== platform) return false;
      if (format !== "All" && t.format !== format) return false;
      if (!q) return true;
      const haystack = [t.name, t.category, t.objective, ...(t.ai_tags ?? []), ...(t.industry_tags ?? [])]
        .filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [scored, search, category, platform, format, ctxActive, ctxCategory, ctxGoal]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [search, category, platform, format, ctxActive]);

  const useTemplate = (t: Row) => {
    setPendingEditorTemplate(t as unknown as TemplateRecord, "originals");
    toast({ title: "Opening in editor", description: t.name });
    navigate("/visual-editor");
  };

  const chip = (label: string, active: boolean, onClick: () => void, key?: string) => (
    <button
      key={key ?? label}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Template Library</h1>
          <p className="text-sm text-muted-foreground">Brand-ready ad templates, ranked for your context.</p>
        </div>
        <Button onClick={() => navigate("/templates/generate")} className="gap-2">
          <Sparkles className="h-4 w-4" /> Create with AI
        </Button>
      </header>

      {ctxActive && (
        <div className="flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          Filtered by: {[ctxCategory, ctxGoal].filter(Boolean).join(" · ")}
          <button aria-label="Clear context filter" onClick={() => setCtxDismissed(true)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={rawSearch}
          onChange={(e) => setRawSearch(e.target.value)}
          placeholder="Search templates by name, category, tag or goal…"
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_CHIPS.map((c) => chip(c, category === c, () => setCategory(c), `c-${c}`))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_CHIPS.map((p) => chip(p, platform === p, () => setPlatform(p), `p-${p}`))}
        </div>
        <div className="flex flex-wrap gap-2">
          {FORMAT_CHIPS.map((f) => chip(FORMAT_LABEL[f] ?? f, format === f, () => setFormat(f), `f-${f}`))}
        </div>
      </div>

      {error ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Couldn’t load templates: {error.message}</p>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-44 w-full" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {(data?.length ?? 0) === 0
              ? "No templates yet. Create your first template or browse the marketplace."
              : search
              ? `No templates found for “${search}”. Try a different search.`
              : "No templates match these filters. Try adjusting your filters."}
          </p>
          {(data?.length ?? 0) > 0 && (
            <Button variant="outline" onClick={() => { setRawSearch(""); setCategory("All"); setPlatform("All"); setFormat("All"); setCtxDismissed(true); }}>
              Browse all templates
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, visible).map(({ t, score, confidence, brandReady }) => {
              const PIcon = (t.platform && PLATFORM_ICON[t.platform]) || LayoutGrid;
              return (
                <Card key={t.id} className="group flex flex-col overflow-hidden">
                  <div className="relative">
                    <TemplateThumb t={t} />
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      {score > 70 && <Badge className="text-[10px]">Recommended</Badge>}
                      {brandReady && <Badge variant="secondary" className="text-[10px]">Brand Ready</Badge>}
                    </div>
                    <button
                      aria-label={favs.has(t.id) ? "Remove favorite" : "Add favorite"}
                      onClick={() => toggleFav(t.id)}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur"
                    >
                      <Heart className={`h-4 w-4 ${favs.has(t.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold">{t.name}</p>
                      <PIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {t.category && <Badge variant="outline" className="text-[10px]">{t.category}</Badge>}
                      <span className="text-[10px] text-muted-foreground">Confidence: {confidence}%</span>
                    </div>
                    <div className="mt-auto grid grid-cols-2 gap-1.5 pt-1">
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => navigate(`/templates/${t.id}`)}>
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => useTemplate(t)}>
                        <Pencil className="h-3.5 w-3.5" /> Customize
                      </Button>
                      <Button size="sm" className="col-span-2 h-8 text-xs" onClick={() => useTemplate(t)}>
                        Use Template
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          {visible < filtered.length && (
            <div className="flex justify-center">
              <Button variant="outline" disabled={isFetching} onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load More ({filtered.length - visible} left)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
