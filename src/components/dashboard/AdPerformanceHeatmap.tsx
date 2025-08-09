import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdPerformanceHeatmapProps { isLoading?: boolean }

type Metric = "ctr" | "clicks" | "impressions" | "conversions";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

export const AdPerformanceHeatmap = ({ isLoading }: AdPerformanceHeatmapProps) => {
  const [metric, setMetric] = useState<Metric>("ctr");

  // Generate demo matrix: 7 days x 24 hours
  const data = useMemo(() => {
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const genFor = (m: Metric) =>
      Array.from({ length: 7 }, () =>
        Array.from({ length: 24 }, () => {
          switch (m) {
            case "ctr": return rand(0.2, 4.2); // %
            case "clicks": return rand(10, 1200);
            case "impressions": return rand(200, 10000);
            case "conversions": return rand(0, 200);
          }
        })
      );
    return {
      ctr: genFor("ctr"),
      clicks: genFor("clicks"),
      impressions: genFor("impressions"),
      conversions: genFor("conversions"),
    };
  }, []);

  const maxByMetric = (m: Metric) => ({ ctr: 5, clicks: 1200, impressions: 10000, conversions: 200 })[m];
  const formatVal = (m: Metric, v: number) => (m === "ctr" ? `${v.toFixed(1)}%` : Math.round(v).toString());

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Ad Performance Heatmap</CardTitle>
        <CardDescription>Time-based performance across the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ctr">CTR</TabsTrigger>
            <TabsTrigger value="clicks">Clicks</TabsTrigger>
            <TabsTrigger value="impressions">Impressions</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
          </TabsList>
          <TabsContent value={metric} className="mt-4">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdPerformanceHeatmap;
