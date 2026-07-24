const INDUSTRY_BENCHMARKS: Record<string, { ctr: number; roas: number; cpc: number; conversion_rate: number }> = {
  beauty: { ctr: 3.4, roas: 3.8, cpc: 0.9, conversion_rate: 2.1 },
  fashion: { ctr: 2.8, roas: 3.2, cpc: 1.1, conversion_rate: 1.8 },
  real_estate: { ctr: 1.9, roas: 4.5, cpc: 1.8, conversion_rate: 1.2 },
  saas: { ctr: 2.2, roas: 3.5, cpc: 2.3, conversion_rate: 2.5 },
  ecommerce: { ctr: 3.1, roas: 4.0, cpc: 1.0, conversion_rate: 2.3 },
  default: { ctr: 2.5, roas: 3.5, cpc: 1.2, conversion_rate: 2.0 },
};

export const BenchmarkService = {
  compare(category: string | null | undefined, metric: 'ctr' | 'roas' | 'cpc' | 'conversion_rate', value: number) {
    const key = (category || 'default').toLowerCase().replace(/\s+/g, '_');
    const bench = INDUSTRY_BENCHMARKS[key] || INDUSTRY_BENCHMARKS.default;
    const target = bench[metric];
    const diff = ((value - target) / target) * 100;
    const better = metric === 'cpc' ? value < target : value > target;
    return { benchmark: target, diff: Math.round(diff), better };
  },
  get(category: string | null | undefined) {
    const key = (category || 'default').toLowerCase().replace(/\s+/g, '_');
    return INDUSTRY_BENCHMARKS[key] || INDUSTRY_BENCHMARKS.default;
  },
};
