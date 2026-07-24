import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  CalendarDays,
  Download,
  Filter,
  Eye,
  TrendingUp,
  Sparkles,
  Play,
  Video,
  Image as ImgIcon,
  CheckCircle2,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAnalytics, type AnalyticsRange } from "@/hooks/useAnalytics";

const statusTone = (s: string) =>
  s === "Active"
    ? "bg-emerald-100 text-emerald-700"
    : s === "Paused"
    ? "bg-amber-100 text-amber-700"
    : "bg-sky-100 text-sky-700";

// ---------- Page ----------
const Analytics = () => {
  const [range, setRange] = useState<AnalyticsRange>("daily");
  const {
    loading, kpis, performanceSeries, topCampaigns, campaignRows,
    bestTemplates, mediaAssets, brandScores, brandScore, brandLabel,
    activityItems, insights, exportStats, integrations,
  } = useAnalytics(range);

  const totalExports = useMemo(() => exportStats.reduce((a, b) => a + b.value, 0), [exportStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Analytics &amp; Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track performance, analyze results, and grow your advertising impact.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-10 gap-2 rounded-xl border-border bg-card">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden capitalize sm:inline">{range} view</span>
            <span className="sm:hidden">Range</span>
          </Button>
          <Button variant="outline" className="h-10 gap-2 rounded-xl border-border bg-card">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button className="h-10 gap-2 rounded-xl bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] shadow-md hover:opacity-90">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.label === 'Campaigns' ? ImgIcon : k.label === 'Reach' ? Eye : k.label === 'Clicks' ? TrendingUp : k.label === 'Conversions' ? Sparkles : k.label === 'Revenue' ? ImgIcon : TrendingUp;
          return (
            <Card key={k.label} className="rounded-2xl border-border p-4 shadow-sm">
              {loading ? (
                <div className="space-y-2"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-16" /><Skeleton className="h-3 w-24" /></div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", k.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                    <p className="mt-0.5 truncate text-xl font-bold text-foreground">{k.value}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <ArrowUpRight className="h-3 w-3" />
                      {k.delta} <span className="text-muted-foreground">vs last period</span>
                    </p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Performance + Top Campaigns + Exports */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Performance chart */}
        <Card className="rounded-2xl border-border p-5 shadow-sm xl:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Performance Overview</h3>
            </div>
            <Select value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
              <SelectTrigger className="h-9 w-28 rounded-lg border-border bg-card text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-2 flex flex-wrap gap-4 text-xs">
            {[
              { l: "Reach", c: "#8b5cf6" },
              { l: "Clicks", c: "#10b981" },
              { l: "Conversions", c: "#3b82f6" },
              { l: "Revenue", c: "#f43f5e" },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: s.c }} />
                <span className="text-muted-foreground">{s.l}</span>
              </div>
            ))}
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="reach" stroke="#8b5cf6" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="conversions" stroke="#3b82f6" strokeWidth={2} fill="url(#g2)" />
                <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} fill="url(#g3)" />
                <Area type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2} fill="url(#g4)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Campaigns */}
        <Card className="rounded-2xl border-border p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Top Campaigns</h3>
            <button className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {topCampaigns.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <img src={c.img} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge className={cn("h-4 rounded-full px-1.5 text-[10px] font-medium", statusTone(c.status))}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>Reach <b className="text-foreground">{c.reach}</b></span>
                    <span>CTR <b className="text-foreground">{c.ctr}</b></span>
                  </div>
                  <Progress value={c.pct} className="mt-1 h-1" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Export stats + integrations */}
        <div className="space-y-4 xl:col-span-3">
          <Card className="rounded-2xl border-border p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-foreground">Export Statistics</h3>
            <div className="flex items-center gap-3">
              <div className="relative h-[140px] w-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={exportStats} innerRadius={45} outerRadius={65} dataKey="value" stroke="none">
                      {exportStats.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{totalExports.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Total Exports</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 text-xs">
                {exportStats.map((e) => (
                  <div key={e.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                    <span className="text-foreground">{e.name}</span>
                    <span className="ml-auto text-muted-foreground">
                      {e.value.toLocaleString()} ({Math.round((e.value / totalExports) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Platform Integrations</h3>
              <button className="text-xs font-medium text-primary hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {integrations.map((i) => (
                <div key={i.name} className="flex items-center gap-3">
                  <div className={cn("grid h-9 w-9 place-items-center rounded-lg text-sm font-bold", i.color)}>
                    {i.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{i.name}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-muted text-[10px] text-muted-foreground">
                    Coming Soon
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Templates + Campaign Table + Media Asset Usage */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="rounded-2xl border-border p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Best Performing Templates</h3>
            <button className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {bestTemplates.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <img src={t.img} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>Usage <b className="text-foreground">{t.usage}</b></span>
                    <span>CTR <b className="text-foreground">{t.ctr}</b></span>
                  </div>
                  <Progress value={t.pct} className="mt-1 h-1" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border-border p-5 shadow-sm xl:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Campaign Performance</h3>
            <button className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 pb-2 font-medium">Campaign</th>
                  <th className="px-2 pb-2 font-medium">Status</th>
                  <th className="px-2 pb-2 font-medium">Reach</th>
                  <th className="px-2 pb-2 font-medium">CTR</th>
                  <th className="px-2 pb-2 font-medium">Conversions</th>
                  <th className="px-2 pb-2 font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {campaignRows.map((r) => (
                  <tr key={r.name} className="border-t border-border/60">
                    <td className="px-2 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-2 py-3">
                      <Badge className={cn("rounded-full text-[10px]", statusTone(r.status))}>{r.status}</Badge>
                    </td>
                    <td className="px-2 py-3 text-foreground">{r.reach}</td>
                    <td className="px-2 py-3 text-foreground">{r.ctr}</td>
                    <td className="px-2 py-3 text-foreground">{r.conv}</td>
                    <td className="px-2 py-3 font-semibold text-foreground">{r.roas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="rounded-2xl border-border p-5 shadow-sm xl:col-span-3">
          <h3 className="mb-4 text-base font-semibold text-foreground">Media Asset Usage</h3>
          <div className="space-y-3">
            {mediaAssets.map((a) => {
              const MediaIcon = a.icon === 'Video' ? Video : ImgIcon;
              return (
              <div key={a.name} className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <MediaIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.usage}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={a.pct} className="h-1 flex-1" />
                    <span className="text-[10px] font-medium text-muted-foreground">{a.pct}%</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Brand Kit + Recent Activity + Insights */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="rounded-2xl border-border p-5 shadow-sm xl:col-span-3">
          <h3 className="mb-4 text-base font-semibold text-foreground">Brand Kit Performance</h3>
          <div className="flex items-center gap-4">
            <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-card">
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">{brandScore}</p>
                  <p className="text-[9px] text-muted-foreground">Brand Score</p>
                </div>
              </div>
            </div>
              <div className="min-w-0 flex-1 space-y-2 text-xs">
                {brandScores.map((b) => (
                  <div key={b.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="truncate text-foreground">{b.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{b.value}</span>
                      <span className="font-semibold text-foreground">{b.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-xs font-medium text-emerald-600">{brandLabel}</p>
        </Card>

        <Card className="rounded-2xl border-border p-5 shadow-sm xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
            <button className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {activityItems.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{a.text}</p>
                </div>
                <p className="shrink-0 text-[11px] text-muted-foreground">{a.time}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-4">
          <Card className="rounded-2xl border-border p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Insights</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {insights.length > 0 ? insights.map((ins: any, i: number) => {
                const colors = ins.type === 'Growth' ? { bg: 'bg-emerald-50', title: 'text-emerald-700', desc: 'text-emerald-800/80', value: 'text-emerald-700', sub: 'text-emerald-700/70' }
                  : ins.type === 'Top Performer' ? { bg: 'bg-teal-50', title: 'text-teal-700', desc: 'text-teal-800/80', value: 'text-teal-700', sub: 'text-teal-700/70' }
                  : { bg: 'bg-rose-50', title: 'text-rose-700', desc: 'text-rose-800/80', value: 'text-rose-700', sub: 'text-rose-700/70' };
                return (
                  <div key={i} className={`rounded-xl ${colors.bg} p-3`}>
                    <p className={`text-xs font-semibold ${colors.title}`}>{ins.type}</p>
                    <p className={`mt-1 text-[11px] ${colors.desc}`}>{ins.title}</p>
                    <p className={`mt-1 text-xs font-bold ${colors.value}`}>{ins.description}</p>
                  </div>
                );
              }) : (
                <div className="col-span-3 rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
                  <Sparkles className="mx-auto mb-2 h-5 w-5 opacity-60" />
                  Insights will appear once your campaigns have enough data.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
