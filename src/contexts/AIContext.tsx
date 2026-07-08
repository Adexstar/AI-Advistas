/**
 * Global AI Context — single source of truth for AdVista.
 *
 * Every page reads `effectiveContext` (override ?? persisted context) via
 * `useAIContext()` and passes it into AI service calls. No page should
 * query the `ai_context` table directly.
 *
 * Temporary overrides:
 *   - Campaigns can push a "campaign" override while editing a campaign.
 *   - Brand Kit can push a "brand" override while editing a brand.
 * Overrides live in memory only and are cleared automatically.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AIContextService, BrandService, CategoryService } from "@/services/ai";
import type { AIContextRow, CategoryPlaybook } from "@/services/ai/types";
import type { BrandIdentity } from "@/services/ai/BrandService";

export type OverrideSource = "campaign" | "brand";

export interface ContextOverride {
  source: OverrideSource;
  label?: string;
  patch: Partial<AIContextRow>;
}

interface AIContextValue {
  loading: boolean;
  context: AIContextRow | null;
  /** Effective context = override.patch merged over persisted context. Use this for AI calls. */
  effectiveContext: AIContextRow | null;
  override: ContextOverride | null;
  brand: BrandIdentity | null;
  playbook: CategoryPlaybook | null;
  brands: BrandIdentity[];
  categories: CategoryPlaybook[];
  update: (patch: Partial<AIContextRow>) => Promise<void>;
  pushOverride: (o: ContextOverride) => void;
  clearOverride: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AIContextValue | null>(null);

export const AIContextProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<AIContextRow | null>(null);
  const [override, setOverride] = useState<ContextOverride | null>(null);
  const [brands, setBrands] = useState<BrandIdentity[]>([]);
  const [categories, setCategories] = useState<CategoryPlaybook[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setContext(null); setBrands([]); setCategories([]); setOverride(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [ctx, cats, userBrands] = await Promise.all([
        AIContextService.get(user.id).catch(() => null),
        CategoryService.list().catch(() => []),
        BrandService.listForUser(user.id).catch(() => []),
      ]);
      setContext(ctx);
      setCategories(cats);
      setBrands(userBrands);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<AIContextRow>) => {
    if (!user) return;
    const next = await AIContextService.upsert(user.id, patch);
    setContext(next);
  }, [user]);

  const pushOverride = useCallback((o: ContextOverride) => setOverride(o), []);
  const clearOverride = useCallback(() => setOverride(null), []);

  const effectiveContext = useMemo<AIContextRow | null>(() => {
    if (!context && !override) return null;
    if (!override) return context;
    return { ...(context ?? ({} as AIContextRow)), ...override.patch };
  }, [context, override]);

  const brand = useMemo(() => {
    const id = effectiveContext?.brand_id;
    return id ? brands.find((b) => b.id === id) ?? null : null;
  }, [brands, effectiveContext?.brand_id]);

  const playbook = useMemo(() => {
    const cat = effectiveContext?.active_category;
    return cat ? categories.find((c) => c.category === cat) ?? null : null;
  }, [categories, effectiveContext?.active_category]);

  const value = useMemo<AIContextValue>(() => ({
    loading, context, effectiveContext, override, brand, playbook,
    brands, categories, update, pushOverride, clearOverride, refresh: load,
  }), [loading, context, effectiveContext, override, brand, playbook, brands, categories, update, pushOverride, clearOverride, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAIContext = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAIContext must be used inside AIContextProvider");
  return v;
};

/**
 * Convenience hook — pushes an override on mount and clears it on unmount.
 * Use in campaign detail views and brand kit editors.
 */
export const useContextOverride = (override: ContextOverride | null) => {
  const { pushOverride, clearOverride } = useAIContext();
  useEffect(() => {
    if (!override) return;
    pushOverride(override);
    return () => clearOverride();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override?.source, JSON.stringify(override?.patch)]);
};
