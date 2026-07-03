import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Download,
  Filter,
  ImageIcon as ImageLucide,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Eye,
  TrendingUp,
  Sparkles,
  Play,
  FileText,
  Video,
  Image as ImgIcon,
  FileType,
  Upload,
  CheckCircle2,
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
import { cn } from "@/lib/utils";

// ---------- Demo data ----------
const kpis = [
  { label: "Campaigns", value: "48", delta: "+12.5%", icon: ImgIcon, tone: "bg-violet-50 text-violet-600" },
  { label: "Reach", value: "2.4M", delta: "+18.7%", icon: Eye, tone: "bg-sky-50 text-sky-600" },
  { label: "Clicks", value: "187K", delta: "+15.3%", icon: MousePointerClick, tone: "bg-emerald-50 text-emerald-600" },
  { label: "Conversions", value: "12,540", delta: "+21.6%", icon: ShoppingCart, tone: "bg-amber-50 text-amber-600" },
  { label: "Revenue", value: "$48,290", delta: "+21.6%", icon: DollarSign, tone: "bg-teal-50 text-teal-600" },
  { label: "ROAS", value: "4.21x", delta: "+20.4%", icon: TrendingUp, tone: "bg-rose-50 text-rose-600" },
];

const perfSeries = [
  { day: "May 12", reach: 900000, clicks: 60000, conversions: 30000, revenue: 12000 },
  { day: "May 13", reach: 1200000, clicks: 80000, conversions: 40000, revenue: 15000 },
  { day: "May 14", reach: 800000, clicks: 55000, conversions: 25000, revenue: 11000 },
  { day: "May 15", reach: 1600000, clicks: 110000, conversions: 55000, revenue: 22000 },
  { day: "May 16", reach: 1300000, clicks: 95000, conversions: 42000, revenue: 18000 },
  { day: "May 17", reach: 2000000, clicks: 130000, conversions: 68000, revenue: 30000 },
  { day: "May 18", reach: 1700000, clicks: 120000, conversions: 60000, revenue: 26000 },
];

const topCampaigns = [
  { name: "Summer Sale Campaign", status: "Active", reach: "125K", ctr: "6.4%", pct: 92, img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop" },
  { name: "Black Friday Blast", status: "Active", reach: "98K", ctr: "5.2%", pct: 78, img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&h=200&fit=crop" },
  { name: "Fitness Launch", status: "Active", reach: "76K", ctr: "4.8%", pct: 68, img: "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=200&h=200&fit=crop" },
  { name: "New Product Promo", status: "Paused", reach: "43K", ctr: "3.8%", pct: 42, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop" },
];

const bestTemplates = [
  { name: "Real Estate Ad #1", usage: "5.2K", ctr: "7.6%", pct: 88, img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop" },
  { name: "E-commerce Sale #4", usage: "—", ctr: "6.2%", pct: 74, img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&h=200&fit=crop" },
  { name: "Agency Promo #2", usage: "—", ctr: "5.8%", pct: 62, img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop" },
  { name: "Product Launch #7", usage: "—", ctr: "5.1%", pct: 55, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop" },
];

const campaignRows = [
  { name: "Summer Sale Campaign", status: "Active", reach: "125K", ctr: "6.4%", conv: "2,450", roas: "4.32x" },
  { name: "Agency Promo", status: "Active", reach: "87K", ctr: "5.2%", conv: "1,680", roas: "3.21x" },
  { name: "New Product Launch", status: "Paused", reach: "43K", ctr: "3.8%", conv: "870", roas: "2.11x" },
  { name: "Fitness Challenge", status: "Completed", reach: "65K", ctr: "4.9%", conv: "1,250", roas: "3.78x" },
  { name: "Black Friday Blast", status: "Completed", reach: "98K", ctr: "6.1%", conv: "1,940", roas: "4.10x" },
];

const exportsData = [
  { name: "PNG", value: 1245, color: "#8b5cf6" },
  { name: "JPG", value: 645, color: "#6366f1" },
  { name: "MP4", value: 280, color: "#a78bfa" },
  { name: "PDF", value: 170, color: "#f472b6" },
];

const mediaAssets = [
  { name: "Product Image 1", usage: "Used in 56 ads", pct: 56, icon: ImgIcon },
  { name: "Promo Video 2", usage: "Used in 32 ads", pct: 32, icon: Video },
  { name: "Brand Logo", usage: "Used in 28 ads", pct: 28, icon: ImgIcon },
  { name: "Background 3", usage: "Used in 21 ads", pct: 21, icon: ImgIcon },
];

const brandScores = [
  { label: "Logo Usage", value: "High", pct: 92 },
  { label: "Color Consistency", value: "Good", pct: 78 },
  { label: "Font Usage", value: "Good", pct: 75 },
  { label: "Brand Compliance", value: "Great", pct: 86 },
];

const activities = [
  { text: 'Template "Real Estate Ad #1" was used in a campaign', time: "2 min ago" },
  { text: 'Campaign "Summer Sale Campaign" was published', time: "15 min ago" },
  { text: 'New media "Product Image 1" uploaded', time: "1 hour ago" },
  { text: "Ad exported as PNG", time: "2 hours ago" },
  { text: 'Brand Kit "AdVista Agency" updated', time: "3 hours ago" },
];

const integrations = [
  { name: "Meta Ads", desc: "Reach • Spend • CTR", logo: "M", color: "bg-blue-100 text-blue-600" },
  { name: "Google Ads", desc: "Clicks • CPC • Conversions", logo: "G", color: "bg-red-100 text-red-600" },
  { name: "TikTok Ads", desc: "Views • Engagement • CTR", logo: "T", color: "bg-neutral-900 text-white" },
];

const statusTone = (s: string) =>
  s === "Active"
    ? "bg-emerald-100 text-emerald-700"
    : s === "Paused"
    ? "bg-amber-100 text-amber-700"
    : "bg-sky-100 text-sky-700";

// ---------- Page ----------
const Analytics = () => {
  const [range, setRange] = useState("daily");

  const totalExports = useMemo(() => exportsData.reduce((a, b) => a + b.value, 0), []);

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
            <span className="hidden sm:inline">May 12 – May 18, 2025</span>
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
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-2xl border-border p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", k.tone)}>
                <k.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                <p className="mt-0.5 truncate text-xl font-bold text-foreground">{k.value}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" />
                  {k.delta} <span className="text-muted-foreground">vs last 7 days</span>
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance + Top Campaigns + Exports */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Performance chart */}
        <Card className="rounded-2xl border-border p-5 shadow-sm xl:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Performance Overview</h3>
            </div>
            <Select value={range} onValueChange={setRange}>
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
              <AreaChart data={perfSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
                    <Pie data={exportsData} innerRadius={45} outerRadius={65} dataKey="value" stroke="none">
                      {exportsData.map((e) => (
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
                {exportsData.map((e) => (
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
            {mediaAssets.map((a) => (
              <div key={a.name} className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <a.icon className="h-5 w-5" />
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
            ))}
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
                  <p className="text-xl font-bold text-foreground">82</p>
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
          <p className="mt-3 text-center text-xs font-medium text-emerald-600">Great</p>
        </Card>

        <Card className="rounded-2xl border-border p-5 shadow-sm xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
            <button className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {activities.map((a, i) => (
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
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-700">Growth</p>
                <p className="mt-1 text-[11px] text-emerald-800/80">Reach increased by</p>
                <p className="mt-1 text-lg font-bold text-emerald-700">18.7%</p>
                <p className="text-[10px] text-emerald-700/70">compared to last week</p>
              </div>
              <div className="rounded-xl bg-teal-50 p-3">
                <p className="text-xs font-semibold text-teal-700">Top Performer</p>
                <p className="mt-1 text-[11px] text-teal-800/80">Summer Sale Campaign has the highest ROAS</p>
                <p className="mt-1 text-lg font-bold text-teal-700">4.32x</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3">
                <p className="text-xs font-semibold text-rose-700">Recommendation</p>
                <p className="mt-1 text-[11px] text-rose-800/80">Try using more video assets in your ads</p>
                <div className="mt-2 grid h-8 w-8 place-items-center rounded-full bg-white text-rose-500 shadow-sm">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
