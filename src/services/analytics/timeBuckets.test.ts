import { describe, expect, it } from "vitest";
import { analyticsBucketKey, groupMetricRows } from "./timeBuckets";

describe("analytics time buckets", () => {
  it("keeps separate Mondays, month-weeks, and Januarys apart", () => {
    const mondayA = new Date(2026, 0, 5);
    const mondayB = new Date(2026, 0, 12);
    const weekOneJan = new Date(2026, 0, 2);
    const weekOneFeb = new Date(2026, 1, 2);
    const januaryThisYear = new Date(2026, 0, 15);
    const januaryLastYear = new Date(2025, 0, 15);

    expect(analyticsBucketKey(mondayA, "daily").key).not.toBe(analyticsBucketKey(mondayB, "daily").key);
    expect(analyticsBucketKey(weekOneJan, "weekly").key).not.toBe(analyticsBucketKey(weekOneFeb, "weekly").key);
    expect(analyticsBucketKey(januaryThisYear, "monthly").key).not.toBe(analyticsBucketKey(januaryLastYear, "monthly").key);
  });

  it("sums only rows that share a unique bucket", () => {
    const rows = groupMetricRows(
      [
        { recorded_at: new Date(2026, 0, 5).toISOString(), impressions: 10, clicks: 1, conversions: 0, revenue: 2 },
        { recorded_at: new Date(2026, 0, 5, 18).toISOString(), impressions: 5, clicks: 2, conversions: 1, revenue: 3 },
        { recorded_at: new Date(2025, 0, 5).toISOString(), impressions: 100, clicks: 9, conversions: 4, revenue: 8 },
      ],
      "daily",
    );
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.key === "2026-01-05")).toMatchObject({ reach: 15, clicks: 3, conversions: 1, revenue: 5 });
    expect(rows.find((row) => row.key === "2025-01-05")?.reach).toBe(100);
  });
});
