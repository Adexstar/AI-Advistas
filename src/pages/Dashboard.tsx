import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Megaphone, DollarSign, ShoppingCart, TrendingUp, Calendar, Settings2,
  MoreHorizontal, ChevronRight,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData, type Range } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";

import { AIAssistantPanel } from "@/components/dashboard/AIAssistantPanel";
import { AIActionsQueue } from "@/components/dashboard/AIActionsQueue";
import { AIRecommendationBanner } from "@/components/dashboard/AIRecommendationBanner";

// ---- helpers ----
const compact = (n: number) =>
  Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);
const money = (n: number) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const statusColor = (s: string) => {
  const v = (s || "").toLowerCase();
  if (v === "active") return "bg-emerald-500/15 text-emerald-600";
  if (v === "paused") return "bg-amber-500/15 text-amber-600";
  return "bg-muted text-muted-foreground";
};

const PLATFORM_COLORS: Record<string, string> = {
  Facebook: "hsl(220 89% 56%)",
  Instagram: "hsl(320 78% 58%)",
  TikTok: "hsl(0 0% 12%)",
  Google: "hsl(142 71% 45%)",
  "Google Ads": "hsl(142 71% 45%)",
};

interface KPIProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  delta?: number;
  positive?: boolean;
  spark: { x: number; v: number }[];
  color: string;
  loading?: boolean;
}

const KpiCard = ({ icon: Icon, label, value, delta, positive = true, spark, color, loading }: KPIProps) => (
  <Card className="min-w-[220px] shrink-0 snap-start rounded-2xl border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        {delta !== undefined && (
          <span className={cn("text-[11px] font-semibold", positive ? "text-emerald-600" : "text-rose-600")}>
            {positive ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-7 w-24" />
      ) : (
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      )}
      <div className="mt-2 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spark}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">vs last 7 days</p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("daily");

  const {
    loading, totals, performanceSeries, campaigns, topCampaigns,
  } = useDashboardData(range);

  // Platform spend from campaigns table (has spend + platform columns)
  const { data: platformRows = [] } = useQuery({
    queryKey: ["dash-platform-spend", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("platform, spend");
      if (error) throw error;
      return data ?? [];
    },
  });

  const platformSpend = useMemo(() => {
    const map = new Map<string, number>();
    platformRows.forEach((r) => {
      const p = r.platform || "Other";
      map.set(p, (map.get(p) || 0) + Number(r.spend || 0));
    });
    const arr = Array.from(map.entries()).map(([name, value]) => ({
      name, value, color: PLATFORM_COLORS[name] || "hsl(252 83% 61%)",
    }));
    return arr.sort((a, b) => b.value - a.value);
  }, [platformRows]);

  const totalSpend = useMemo(
    () => platformSpend.reduce((a, b) => a + b.value, 0),
    [platformSpend]
  );

  // Sparkline seeds from performance series
  const spark = (key: "reach" | "clicks" | "conversions" | "revenue") =>
    performanceSeries.length
      ? performanceSeries.map((p, i) => ({ x: i, v: (p as any)[key] || 0 }))
      : Array.from({ length: 7 }, (_, i) => ({ x: i, v: 0 }));

  const perfSeries = useMemo(() => {
    // Ensure clicks + conversions + spend visible in chart
    return performanceSeries.map((p, i) => ({
      name: p.name,
      Clicks: p.clicks,
      Conversions: p.conversions,
      Spend: Math.round((p as any).revenue / 2) || 0, // proxy for spend if no field
    }));
  }, [performanceSeries]);

  return (
    <div className="w-full min-w-0 space-y-5 pb-32 lg:pb-6">

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening with your campaigns today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-xl">
            <Calendar className="h-3.5 w-3.5" /> Last 7 days
          </Button>
          <Button variant="outline" size="sm" className="h-9 rounded-xl">
            <Settings2 className="h-3.5 w-3.5" /> Customize
          </Button>
        </div>
      </div>

      {/* 2. KPI cards — horizontal scroll on mobile, grid on desktop */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        <KpiCard icon={Megaphone} label="Total Campaigns" value={compact(totals.campaigns)} delta={12} positive spark={spark("clicks")} color="hsl(252 83% 61%)" loading={loading} />
        <KpiCard icon={DollarSign} label="Total Spend" value={money(totalSpend)} delta={8} positive={false} spark={spark("revenue")} color="hsl(320 78% 58%)" loading={loading} />
        <KpiCard icon={ShoppingCart} label="Conversions" value={compact(totals.conversions)} delta={16} positive spark={spark("conversions")} color="hsl(142 71% 45%)" loading={loading} />
        <KpiCard icon={TrendingUp} label="ROAS" value={`${totals.roas.toFixed(2)}x`} delta={12} positive spark={spark("revenue")} color="hsl(30 95% 55%)" loading={loading} />
      </div>

      {/* 3 + 4 + right column */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Left column: Performance + Recent */}
        <div className="space-y-4 lg:col-span-3">
          {/* Performance + Platform Spend */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl border-border/60 bg-card shadow-sm md:col-span-2">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Performance Overview</p>
                    <p className="text-[11px] text-muted-foreground">Clicks · Conversions · Spend</p>
                  </div>
                  <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
                    <TabsList className="h-8 rounded-lg bg-muted">
                      <TabsTrigger value="daily" className="h-7 rounded-md text-[11px]">7d</TabsTrigger>
                      <TabsTrigger value="weekly" className="h-7 rounded-md text-[11px]">30d</TabsTrigger>
                      <TabsTrigger value="monthly" className="h-7 rounded-md text-[11px]">90d</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="h-[240px] w-full">
                  {loading ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : perfSeries.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No performance data yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={perfSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(252 83% 61%)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="hsl(252 83% 61%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(30 95% 55%)" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="hsl(30 95% 55%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                        <Area type="monotone" dataKey="Clicks" stroke="hsl(252 83% 61%)" strokeWidth={2} fill="url(#gClicks)" />
                        <Area type="monotone" dataKey="Conversions" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#gConv)" />
                        <Area type="monotone" dataKey="Spend" stroke="hsl(30 95% 55%)" strokeWidth={2} fill="url(#gSpend)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="text-sm font-semibold">Spend by Platform</p>
                  <p className="text-[11px] text-muted-foreground">Distribution across channels</p>
                </div>
                <div className="relative mx-auto h-[160px] w-full">
                  {platformSpend.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No platform data yet
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={platformSpend} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                            {platformSpend.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-lg font-bold">{money(totalSpend)}</p>
                        <p className="text-[10px] text-muted-foreground">Total Spend</p>
                      </div>
                    </>
                  )}
                </div>
                {platformSpend.length > 0 && (
                  <div className="space-y-1.5">
                    {platformSpend.slice(0, 4).map((p) => {
                      const pct = totalSpend > 0 ? Math.round((p.value / totalSpend) * 100) : 0;
                      return (
                        <div key={p.name} className="flex items-center gap-2 text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                          <span className="text-muted-foreground">{p.name}</span>
                          <span className="ml-auto font-medium">{pct}%</span>
                          <span className="w-14 text-right text-muted-foreground">{money(p.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 5. Recent Campaigns */}
          <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Recent Campaigns</p>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/campaigns")}>
                  View all <ChevronRight className="h-3 w-3" />
                </Button>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : campaigns.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No campaigns yet.</p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Spend</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Conversions</TableHead>
                          <TableHead className="text-right">ROAS</TableHead>
                          <TableHead>Trend</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.slice(0, 6).map((c) => (
                          <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate("/campaigns")}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>
                              <Badge className={cn("rounded-full px-2 py-0 text-[10px]", statusColor(c.status))}>{c.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{money((c as any).spend || 0)}</TableCell>
                            <TableCell className="text-right">{Number(c.ctr).toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{compact((c as any).conversions || 0)}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">{Number(c.roas).toFixed(2)}x</TableCell>
                            <TableCell>
                              <div className="h-6 w-20">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={spark("conversions")}>
                                    <Line type="monotone" dataKey="v" stroke="hsl(252 83% 61%)" strokeWidth={1.5} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </TableCell>
                            <TableCell><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-2 md:hidden">
                    {campaigns.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate("/campaigns")}
                        className="w-full rounded-xl border border-border/60 p-3 text-left transition hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{c.name}</p>
                          <Badge className={cn("shrink-0 rounded-full px-2 py-0 text-[10px]", statusColor(c.status))}>{c.status}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                          <div>
                            <p className="font-semibold text-foreground">{money((c as any).spend || 0)}</p>
                            Spend
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{Number(c.ctr).toFixed(1)}%</p>
                            CTR
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{compact((c as any).conversions || 0)}</p>
                            Conv
                          </div>
                          <div>
                            <p className="font-semibold text-primary">{Number(c.roas).toFixed(2)}x</p>
                            ROAS
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: AI Assistant + AI Actions Queue */}
        <div className="space-y-4 lg:col-span-1">
          <AIAssistantPanel />
          <AIActionsQueue />
        </div>
      </div>

      {/* 8. Sticky AI recommendation banner */}
      <AIRecommendationBanner />
    </div>
  );
};

export default Dashboard;
