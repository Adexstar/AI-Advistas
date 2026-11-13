import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdPerformanceHeatmapProps { isLoading?: boolean }

type Metric = "ctr" | "clicks" | "impressions" | "conversions";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

export const AdPerformanceHeatmap = ({ isLoading }: AdPerformanceHeatmapProps) => {
  const [metric, setMetric] = useState<Metric>("ctr");

  const data = useMemo(() => ({ ctr: [] as number[][], clicks: [] as number[][], impressions: [] as number[][], conversions: [] as number[][] }), []);

  const maxByMetric = (m: Metric) => ({ ctr: 5, clicks: 1200, impressions: 10000, conversions: 200 })[m];
  const formatVal = (m: Metric, v: number) => (m === "ctr" ? `${v.toFixed(1)}%` : Math.round(v).toString());

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Ad Performance Heatmap</CardTitle>
        <CardDescription>Hourly results appear after a connected platform syncs real metrics.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger value="ctr" className="min-w-0 whitespace-normal">CTR</TabsTrigger>
            <TabsTrigger value="clicks" className="min-w-0 whitespace-normal">Clicks</TabsTrigger>
            <TabsTrigger value="impressions" className="min-w-0 whitespace-normal">Impressions</TabsTrigger>
            <TabsTrigger value="conversions" className="min-w-0 whitespace-normal">Conversions</TabsTrigger>
          </TabsList>
          <TabsContent value={metric} className="mt-4">
            {data[metric].length === 0 ? (
              <p className="text-sm text-muted-foreground">No hourly metrics yet.</p>
            ) : (
            <div className="space-y-3">
              {/* Header with hour labels */}
              <div className="overflow-x-auto">
                <div className="min-w-[960px]">
                  <div className="grid" style={{ gridTemplateColumns: `80px repeat(24, minmax(32px, 1fr))` }}>
                    <div />
                    {hours.map((h) => (
                      <div key={h} className="text-xs text-muted-foreground px-1 text-center">{h}</div>
                    ))}
                  </div>
                  {/* Heat rows */}
                  {data[metric].map((row, dayIdx) => (
                    <div key={dayIdx} className="grid items-center" style={{ gridTemplateColumns: `80px repeat(24, minmax(32px, 1fr))` }}>
                      <div className="text-xs font-medium text-foreground py-1 pr-2">{days[dayIdx]}</div>
                      {row.map((val, hourIdx) => {
                        const max = maxByMetric(metric);
                        const intensity = Math.max(0.08, Math.min(1, val / max));
                        const bg = `hsl(var(--primary) / ${intensity})`;
                        const color = intensity > 0.5 ? "var(--background)" : "var(--foreground)";
                        return (
                          <div
                            key={`${dayIdx}-${hourIdx}`}
                            className="h-7 m-[2px] rounded-sm flex items-center justify-center transition-opacity hover:opacity-80"
                            style={{ backgroundColor: bg, color }}
                            title={`${days[dayIdx]} ${hours[hourIdx]} — ${formatVal(metric, val)}`}
                          >
                            <span className="text-[10px]">{metric === "ctr" ? `${Math.round((val as number))}%` : ""}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Low</span>
                <div className="h-2 w-24 rounded" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.1), hsl(var(--primary))), hsl(var(--muted))" }} />
                <span>High</span>
              </div>
            </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdPerformanceHeatmap;
