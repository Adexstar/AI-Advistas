import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AIContextService, BrandService, CategoryService } from "@/services/ai";
import type { AIContextRow, BrandIdentity, CategoryPlaybook } from "@/services/ai/types";

interface AIContextValue {
  loading: boolean;
  context: AIContextRow | null;
  brand: BrandIdentity | null;
  playbook: CategoryPlaybook | null;
  brands: BrandIdentity[];
  categories: CategoryPlaybook[];
  update: (patch: Partial<AIContextRow>) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AIContextValue | null>(null);

export const AIContextProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<AIContextRow | null>(null);
  const [brand, setBrand] = useState<BrandIdentity | null>(null);
  const [playbook, setPlaybook] = useState<CategoryPlaybook | null>(null);
  const [brands, setBrands] = useState<BrandIdentity[]>([]);
  const [categories, setCategories] = useState<CategoryPlaybook[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setContext(null); setBrand(null); setPlaybook(null); setBrands([]); setCategories([]);
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
      setBrand(ctx?.brand_id ? userBrands.find((b) => b.id === ctx.brand_id) ?? null : null);
      setPlaybook(ctx?.active_category ? cats.find((c) => c.category === ctx.active_category) ?? null : null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<AIContextRow>) => {
    if (!user) return;
    const next = await AIContextService.upsert(user.id, patch);
    setContext(next);
    if ("brand_id" in patch) setBrand(brands.find((b) => b.id === next.brand_id) ?? null);
    if ("active_category" in patch) setPlaybook(categories.find((c) => c.category === next.active_category) ?? null);
  }, [user, brands, categories]);

  const value = useMemo<AIContextValue>(() => ({
    loading, context, brand, playbook, brands, categories, update, refresh: load,
  }), [loading, context, brand, playbook, brands, categories, update, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAIContext = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAIContext must be used inside AIContextProvider");
  return v;
};
