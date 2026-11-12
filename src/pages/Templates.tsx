/**
 * /templates — template library.
 * Reads active, approved rows from `templates` and renders them in the
 * library layout. Counts, names, and previews come from those rows.
 */
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAIContext } from "@/contexts/AIContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { setPendingEditorTemplate } from "@/lib/templateEditorSession";
import { withStockStarter } from "@/services/templates/stockStarter";
import type { TemplateRecord } from "@/services/templates/types";
import { normalizeTemplateCategory } from "@/utils/templateCategories";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_PLATFORMS,
  FORMAT_FILTERS,
  categoryCounts,
  matchesFormat,
  matchesPlatform,
  relativeUpdated,
} from "./templatesLibrary";
import {
  Search, Sparkles, Heart, X, AlertTriangle, RefreshCw, Bell,
  Facebook, Instagram, Linkedin, Youtube, LayoutGrid, SlidersHorizontal,
  ShoppingBag, Shirt, UtensilsCrossed, Home, Dumbbell, Laptop, ChevronDown,
} from "lucide-react";

const PAGE_SIZE = 6;
const FAV_KEY = "advista_template_favorites";
const RECENT_KEY = "advista.editor.recentTemplateIds";

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  ecommerce: ShoppingBag,
  beauty: Sparkles,
  fashion: Shirt,
  food: UtensilsCrossed,
  real_estate: Home,
  fitness: Dumbbell,
  saas: Laptop,
};

const POSTER_TONE: Record<string, string> = {
  ecommerce: "bg-[#3C2F5A]",
  beauty: "bg-[#3E5348]",
  fashion: "bg-[#4A3B32]",
  food: "bg-[#4A3428]",
  real_estate: "bg-[#2C3E4E]",
  fitness: "bg-[#2A2E33]",
  saas: "bg-[#243044]",
};

type Row = TemplateRecord & { format: string | null };

interface Scored { t: Row; score: number; brandReady: boolean }

const readIds = (key: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const useFavorites = () => {
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); } catch { return new Set(); }
  });
  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); }, [favs]);
  const toggle = (id: string) => setFavs((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  return [favs, toggle] as const;
};

function PlatformMark({ name, className = "h-3.5 w-3.5" }: { name: string; className?: string }) {
  const key = name.toLowerCase();
  if (key.includes("facebook")) return <Facebook className={className} />;
  if (key.includes("instagram")) return <Instagram className={className} />;
  if (key.includes("linkedin")) return <Linkedin className={className} />;
  if (key.includes("youtube")) return <Youtube className={className} />;
  if (key.includes("tiktok")) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="currentColor" d="M14.5 3c.4 2.4 1.8 4 4.2 4.3v2.4c-1.5 0-2.9-.5-4.1-1.3v6.7c0 3.3-2.6 5.9-6 5.9S2.6 18.4 2.6 15.1c0-3.2 2.5-5.8 5.7-5.9v2.5c-1.8.1-3.2 1.6-3.2 3.4 0 1.9 1.5 3.4 3.4 3.4s3.4-1.5 3.4-3.4V3h2.6Z" />
      </svg>
    );
  }
  return <LayoutGrid className={className} />;
}

function TemplatePoster({ t, compact = false, className = "" }: { t: Row; compact?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = t.preview_url || t.thumbnail_url;
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  const tone = POSTER_TONE[normalizeTemplateCategory(t.category)] || "bg-[#2C3140]";
  if (compact) {
    return <div className={`h-full w-full ${tone} ${className}`} />;
  }
  return (
    <div className={`flex h-full w-full flex-col justify-end bg-gradient-to-b from-white/10 to-black/20 p-3 text-white ${tone} ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">{t.platform || "Template"}</p>
      <p className="mt-1 line-clamp-3 text-sm font-semibold leading-snug">{t.name}</p>
    </div>
  );
}

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [ctxDismissed, setCtxDismissed] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [recentIds] = useState<string[]>(() => readIds(RECENT_KEY));

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
        .eq("is_active", true)
        .eq("review_status", "approved")
        .order("popularity_score", { ascending: false });
      if (error) return withStockStarter<Row>([], true);
      return withStockStarter((data ?? []) as unknown as Row[]);
    },
    staleTime: 60_000,
  });

  const ctxCategory = effectiveContext?.active_category ?? null;
  const ctxGoal = effectiveContext?.current_goal ?? effectiveContext?.active_objective ?? null;
  const ctxPlatform = (effectiveContext as { active_platform?: string } | null)?.active_platform ?? null;
  const ctxActive = !ctxDismissed && Boolean(ctxCategory || ctxGoal);

  const scored = useMemo<Scored[]>(() => {
    const rows = data ?? [];
    return rows
      .map((t) => {
        let score = t.popularity_score ?? 0;
        if (ctxCategory && normalizeTemplateCategory(t.category) === normalizeTemplateCategory(String(ctxCategory))) score += 30;
        if (ctxGoal && t.objective?.toLowerCase() === String(ctxGoal).toLowerCase()) score += 25;
        if (ctxPlatform && t.platform?.toLowerCase() === String(ctxPlatform).toLowerCase()) score += 20;
        const brandReady = t.brand_compatible === true;
        if (brandReady) score += 5;
        return { t, score, brandReady };
      })
      .sort((a, b) => b.score - a.score);
  }, [data, ctxCategory, ctxGoal, ctxPlatform]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scored.filter(({ t }) => {
      if (ctxActive && ctxCategory && normalizeTemplateCategory(t.category) !== normalizeTemplateCategory(String(ctxCategory))) return false;
      if (ctxActive && ctxGoal && t.objective?.toLowerCase() !== String(ctxGoal).toLowerCase()) return false;
      if (category !== "All" && normalizeTemplateCategory(t.category) !== category) return false;
      if (!matchesPlatform(t.platform, platform)) return false;
      if (!matchesFormat(t.format, format)) return false;
      if (!q) return true;
      const haystack = [t.name, t.description, t.category, t.platform, t.objective, ...(t.ai_tags ?? []), ...(t.industry_tags ?? [])]
        .filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [scored, search, category, platform, format, ctxActive, ctxCategory, ctxGoal]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [search, category, platform, format, ctxActive]);

  const counts = useMemo(() => categoryCounts((data ?? []).map((t) => t.category)), [data]);
  const extraPlatforms = useMemo(() => {
    const known = new Set(LIBRARY_PLATFORMS.map((item) => item.toLowerCase()));
    const extra = new Set<string>();
    for (const row of data ?? []) {
      const name = row.platform?.trim();
      if (name && !known.has(name.toLowerCase())) extra.add(name);
    }
    return [...extra];
  }, [data]);

  const featured = filtered.slice(0, 3);
  const popular = filtered.slice(0, visible);
  const recent = useMemo(() => {
    const byId = new Map((data ?? []).map((t) => [t.id, t]));
    const opened = recentIds.map((id) => byId.get(id)).filter((t): t is Row => Boolean(t));
    if (opened.length) return { items: opened.slice(0, 4), fromEditor: true };
    const updated = [...(data ?? [])].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
    return { items: updated.slice(0, 4), fromEditor: false };
  }, [data, recentIds]);

  const useTemplate = (t: Row) => {
    setPendingEditorTemplate(t as unknown as TemplateRecord, "originals");
    toast({ title: "Opening in editor", description: t.name });
    navigate("/visual-editor");
  };

  const clearFilters = () => {
    setRawSearch("");
    setSearch("");
    setCategory("All");
    setPlatform("All");
    setFormat("All");
    setCtxDismissed(true);
  };

  return (
    <div className="template-library min-h-full overflow-x-hidden bg-background px-4 pb-28 pt-4 text-foreground sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="hidden text-[26px] font-semibold tracking-[-0.03em] text-foreground lg:block">Templates</h1>
          <p className="mt-1 hidden text-sm text-muted-foreground lg:block">Choose from professionally designed templates or create your own.</p>
        </div>
        <div className="flex w-full items-center gap-2 lg:w-auto">
          <div className="relative min-w-0 flex-1 lg:w-[280px] lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="Search templates..."
              aria-label="Search templates"
              className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setFilterOpen((open) => !open); setMoreOpen(false); }}
              className={`inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium ${format !== "All" ? "border-primary text-primary" : "border-border text-foreground"}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
            {filterOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-border bg-card p-1 shadow-lg">
                {FORMAT_FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setFormat(item.id); setFilterOpen(false); }}
                    className={`flex w-full rounded-lg px-3 py-2 text-left text-sm ${format === item.id ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <label className="relative hidden h-10 items-center sm:flex">
            <span className="sr-only">Platform</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="h-10 appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="All">All Platforms</option>
              {LIBRARY_PLATFORMS.filter((item) => item !== "All").map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
              {extraPlatforms.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-muted-foreground" />
          </label>
          <NavLink
            to="/notifications"
            aria-label="Notifications"
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground lg:grid"
          >
            <Bell className="h-4 w-4" />
          </NavLink>
        </div>
      </header>

      {ctxActive && (
        <div className="mt-4 flex w-fit items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">
          Filtered by {[ctxCategory, ctxGoal].filter(Boolean).join(" · ")}
          <button type="button" aria-label="Clear context filter" onClick={() => setCtxDismissed(true)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="chip-row mt-5 flex w-full max-w-full gap-2 overflow-x-auto pb-1">
        {LIBRARY_PLATFORMS.map((item) => {
          const active = platform === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setPlatform(item)}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${active ? "border-primary/40 bg-primary/15 text-primary" : "border-border bg-card text-foreground"}`}
            >
              {item === "All" ? <LayoutGrid className="h-3.5 w-3.5" /> : <PlatformMark name={item} />}
              {item}
            </button>
          );
        })}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => { setMoreOpen((open) => !open); setFilterOpen(false); }}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground"
          >
            More
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {moreOpen && (
            <div className="absolute left-0 z-20 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg">
              {extraPlatforms.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No other platforms in the library.</p>
              ) : extraPlatforms.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setPlatform(item); setMoreOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <PlatformMark name={item} />
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="mt-4 grid items-center gap-5 overflow-hidden rounded-2xl border border-border/60 bg-card px-5 py-5 lg:grid-cols-[minmax(240px,0.85fr)_minmax(320px,1.15fr)] lg:px-8 lg:py-7">
        <div>
          <h2 className="max-w-sm text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground">
            Stand out with stunning templates
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            High-performing, customizable templates designed to get you more results.
          </p>
          <button
            type="button"
            onClick={() => navigate("/templates/generate")}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Create with AI
          </button>
        </div>
        <div className={`flex items-end justify-center gap-3 sm:justify-end ${featured.length ? "h-[168px] lg:h-[210px]" : ""}`}>
          {featured.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">Featured templates appear here once the library has a match.</p>
          ) : featured.map(({ t }, index) => (
            <button
              key={t.id}
              type="button"
              onClick={() => useTemplate(t)}
              className="h-[150px] w-[108px] overflow-hidden rounded-2xl border border-border shadow-md lg:h-[190px] lg:w-[132px]"
              style={{ transform: `rotate(${[-7, 0, 7][index] || 0}deg) translateY(${index === 1 ? "-12px" : "0"})` }}
              aria-label={`Open ${t.name}`}
            >
              <TemplatePoster t={t} />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Categories</h2>
          <button type="button" onClick={() => setCategory("All")} className="text-sm font-medium text-primary">View all</button>
        </div>
        <div className="chip-row flex w-full max-w-full gap-2 overflow-x-auto pb-1">
          {LIBRARY_CATEGORIES.map((item) => {
            const Icon = CATEGORY_ICON[item.id] || LayoutGrid;
            const count = counts.get(item.id) || 0;
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(active ? "All" : item.id)}
                className={`flex h-[68px] min-w-[148px] shrink-0 items-center gap-3 rounded-xl border bg-card px-3 text-left ${active ? "border-primary" : "border-border"}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">{data ? `${count} ${count === 1 ? "template" : "templates"}` : "—"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Popular Templates</h2>
          {filtered.length > PAGE_SIZE && (
            <button
              type="button"
              onClick={() => setVisible((count) => count >= filtered.length ? PAGE_SIZE : filtered.length)}
              className="text-sm font-medium text-primary"
            >
              {visible >= filtered.length ? "Show less" : "View all"}
            </button>
          )}
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">Couldn’t load templates. {error.message}</p>
            <button type="button" onClick={() => refetch()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border bg-card p-2">
                <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                <Skeleton className="mt-3 h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : popular.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {(data?.length ?? 0) === 0
                ? "No templates yet. Create one with AI or add templates from the admin library."
                : "No templates match these filters."}
            </p>
            {(data?.length ?? 0) > 0 && (
              <button type="button" onClick={clearFilters} className="h-9 rounded-lg border border-border px-3 text-sm text-foreground">
                Browse all templates
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {popular.map(({ t }) => (
              <article key={t.id} className="group rounded-2xl border border-border bg-card p-2">
                <button type="button" onClick={() => useTemplate(t)} className="relative block w-full overflow-hidden rounded-xl text-left" aria-label={`Use ${t.name}`}>
                  <div className="aspect-[4/5] w-full">
                    <TemplatePoster t={t} />
                  </div>
                  {t.platform && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-medium text-foreground shadow-sm">
                      <PlatformMark name={t.platform} className="h-3 w-3" />
                      {t.platform}
                    </span>
                  )}
                </button>
                <div className="flex items-start justify-between gap-2 px-1 pb-1 pt-2.5">
                  <p className="line-clamp-2 text-sm font-medium text-foreground">{t.name}</p>
                  <button
                    type="button"
                    aria-label={favs.has(t.id) ? "Remove favorite" : "Save template"}
                    aria-pressed={favs.has(t.id)}
                    onClick={() => toggleFav(t.id)}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  >
                    <Heart className={`h-4 w-4 ${favs.has(t.id) ? "fill-primary text-primary" : ""}`} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{recent.fromEditor ? "Recently used" : "Recently updated"}</h2>
        </div>
        {recent.items.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            Templates you open in the editor show up here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recent.items.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => useTemplate(t)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left"
              >
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <TemplatePoster t={t} compact />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{t.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {t.platform && <PlatformMark name={t.platform} className="h-3 w-3" />}
                    {recent.fromEditor ? "Opened in the editor" : relativeUpdated(t.updated_at)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
