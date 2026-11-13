export type AnalyticsRange = "daily" | "weekly" | "monthly";

export type BucketKey = { key: string; label: string };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** ISO week in the local calendar, so a week that crosses a month stays one bucket. */
function isoWeek(date: Date): { year: number; week: number } {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: utc.getUTCFullYear(), week };
}

export function analyticsBucketKey(date: Date, range: AnalyticsRange): BucketKey {
  if (Number.isNaN(date.getTime())) return { key: "invalid", label: "Unknown" };
  if (range === "daily") {
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { key, label };
  }
  if (range === "weekly") {
    const { year, week } = isoWeek(date);
    return { key: `${year}-W${pad(week)}`, label: `${year} W${week}` };
  }
  const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return { key, label };
}

export type MetricPoint = {
  recorded_at: string;
  impressions?: number | null;
  clicks?: number | null;
  conversions?: number | null;
  revenue?: number | null;
};

export type MetricBucket = {
  key: string;
  name: string;
  reach: number;
  clicks: number;
  conversions: number;
  revenue: number;
  order: number;
};

export function groupMetricRows(rows: MetricPoint[], range: AnalyticsRange): MetricBucket[] {
  const buckets = new Map<string, MetricBucket>();
  for (const row of rows) {
    const date = new Date(row.recorded_at);
    const { key, label } = analyticsBucketKey(date, range);
    const order = date.getTime();
    const existing = buckets.get(key);
    if (existing) {
      existing.reach += Number(row.impressions) || 0;
      existing.clicks += Number(row.clicks) || 0;
      existing.conversions += Number(row.conversions) || 0;
      existing.revenue += Number(row.revenue) || 0;
      existing.order = Math.min(existing.order, order);
    } else {
      buckets.set(key, {
        key,
        name: label,
        reach: Number(row.impressions) || 0,
        clicks: Number(row.clicks) || 0,
        conversions: Number(row.conversions) || 0,
        revenue: Number(row.revenue) || 0,
        order,
      });
    }
  }
  return Array.from(buckets.values()).sort((a, b) => a.order - b.order);
}
