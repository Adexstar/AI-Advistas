import type { CampaignMetric } from './types';

export interface Forecast {
  estimated_reach: number;
  estimated_clicks: number;
  estimated_conversions: number;
  estimated_revenue: number;
  confidence: number;
}

export const ForecastService = {
  project(metrics: CampaignMetric[], days = 7, budget?: number): Forecast {
    if (!metrics.length) {
      return { estimated_reach: 0, estimated_clicks: 0, estimated_conversions: 0, estimated_revenue: 0, confidence: 30 };
    }
    const daily = metrics.slice(-14);
    const avg = (fn: (m: CampaignMetric) => number) => daily.reduce((s, m) => s + fn(m), 0) / daily.length;
    const scale = budget ? budget / Math.max(avg((m) => Number(m.spend)) * days, 1) : 1;
    return {
      estimated_reach: Math.round(avg((m) => m.reach) * days * scale),
      estimated_clicks: Math.round(avg((m) => m.clicks) * days * scale),
      estimated_conversions: Math.round(avg((m) => m.conversions) * days * scale),
      estimated_revenue: Math.round(avg((m) => Number(m.revenue)) * days * scale),
      confidence: Math.min(60 + daily.length * 3, 95),
    };
  },
};
