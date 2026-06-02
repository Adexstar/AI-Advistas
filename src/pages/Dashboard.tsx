import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  Eye,
  FileImage,
  Filter,
  HardDrive,
  Image as ImageIcon,
  Megaphone,
  MousePointerClick,
  Palette,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDashboardData, STORAGE_CAP_BYTES, type Range } from '@/hooks/useDashboardData';

// ---------- helpers ----------
const compact = (n: number) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const money = (n: number) => `$${compact(n)}`;
const statusColor = (s: string) => {
  const v = s.toLowerCase();
  if (v === 'active') return 'bg-success/15 text-success';
  if (v === 'paused') return 'bg-accent/20 text-accent-foreground';
  return 'bg-muted text-muted-foreground';
};
const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const activityIcon = (entity: string | null) => {
  switch ((entity || '').toLowerCase()) {
    case 'campaign': return Megaphone;
    case 'template': return FileImage;
    case 'asset':
    case 'media': return Upload;
    case 'export': return Download;
    case 'brand_kit':
    case 'brand': return Palette;
    default: return Activity;
  }
};
const gradients = [
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-indigo-500',
  'from-amber-500 to-rose-500',
];

const exportColors = ['hsl(252 83% 61%)', 'hsl(278 94% 76%)', 'hsl(43 96% 62%)', 'hsl(142 71% 45%)'];

const integrations = [
  { name: 'Meta Ads', status: 'Coming Soon', color: 'bg-blue-500' },
  { name: 'Google Ads', status: 'Coming Soon', color: 'bg-red-500' },
  { name: 'TikTok Ads', status: 'Coming Soon', color: 'bg-black' },
];

// ---------- empty / skeleton helpers ----------
const Empty = ({ text, action }: { text: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
    <p className="text-sm text-muted-foreground">{text}</p>
    {action}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('daily');
  const {
    loading,
    error,
    refetchAll,
    totals,
    performanceSeries,
    campaigns,
    topCampaigns,
    templates,
    media,
    imageCount,
    videoCount,
    storageUsed,
    brandCounts,
    activity,
  } = useDashboardData(range);

  const kpis = [
    { label: 'Campaigns', value: compact(totals.campaigns), icon: Megaphone },
    { label: 'Reach', value: compact(totals.reach), icon: Users },
    { label: 'Clicks', value: compact(totals.clicks), icon: MousePointerClick },
    { label: 'Conversions', value: compact(totals.conversions), icon: ShoppingCart },
    { label: 'Revenue', value: money(totals.revenue), icon: CircleDollarSign },
    { label: 'ROAS', value: `${totals.roas.toFixed(2)}x`, icon: TrendingUp },
  ];

  const exportData = useMemo(() => {
    const byType = new Map<string, number>();
    media.forEach((m) => {
      const ext = (m.name.split('.').pop() || m.type || 'file').toUpperCase().slice(0, 4);
      byType.set(ext, (byType.get(ext) || 0) + 1);
    });
    return Array.from(byType.entries())
      .slice(0, 4)
      .map(([name, value], i) => ({ name, value, color: exportColors[i % exportColors.length] }));
  }, [media]);

  const totalExports = exportData.reduce((acc, d) => acc + d.value, 0);
  const storagePct = Math.min(100, (storageUsed / STORAGE_CAP_BYTES) * 100);

  const brandScore = useMemo(() => {
    const filled = [brandCounts.logos > 0, brandCounts.colors > 0, brandCounts.fonts > 0].filter(Boolean).length;
    return Math.round((filled / 3) * 100);
  }, [brandCounts]);

  const insightGrowth = useMemo(() => {
    if (performanceSeries.length < 2) return 0;
    const prev = performanceSeries[performanceSeries.length - 2].reach || 1;
    const curr = performanceSeries[performanceSeries.length - 1].reach || 0;
    return ((curr - prev) / prev) * 100;
  }, [performanceSeries]);

  if (error) {
    return (
      <div className="w-full min-w-0">
        <Card className="rounded-2xl border-destructive/50">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-destructive">Failed to load dashboard data.</p>
            <Button size="sm" onClick={refetchAll} className="rounded-xl">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage campaigns, templates, assets and performance from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search campaigns, templates..." className="h-10 w-64 rounded-2xl border-border/70 bg-card/80 pl-9" />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl" onClick={refetchAll}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl">
            <Bell className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate('/create')} className="h-10 rounded-2xl">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Campaign</span>
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="group rounded-2xl border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <k.icon className="h-4 w-4" />
                </div>
              </div>
              {loading ? (
                <Skeleton className="mt-3 h-6 w-16" />
              ) : (
                <p className="mt-3 text-xl font-semibold text-foreground md:text-2xl">{k.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance + Export breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Performance Overview</CardTitle>
              <p className="text-xs text-muted-foreground">Track reach, clicks, conversions and revenue.</p>
            </div>
            <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
              <TabsList className="rounded-xl bg-muted">
                <TabsTrigger value="daily" className="rounded-lg text-xs">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="rounded-lg text-xs">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="rounded-lg text-xs">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : performanceSeries.length === 0 ? (
                <Empty text="No analytics yet — performance will appear here once your campaigns run." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(252 83% 61%)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(252 83% 61%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                    <Area type="monotone" dataKey="reach" stroke="hsl(252 83% 61%)" strokeWidth={2.5} fill="url(#reachGrad)" />
                    <Area type="monotone" dataKey="conversions" stroke="hsl(142 71% 45%)" strokeWidth={2.5} fill="url(#convGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Asset Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">Media types in your library</p>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto h-[180px] w-full">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : exportData.length === 0 ? (
                <Empty text="Upload assets to see breakdown." />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={exportData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {exportData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-semibold text-foreground">{totalExports.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Assets</p>
                  </div>
                </>
              )}
            </div>
            {exportData.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {exportData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto font-medium text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns + Integrations + Templates */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Top Campaigns</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate('/campaigns')}>
              View all <ChevronRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
            ) : topCampaigns.length === 0 ? (
              <Empty text="No campaigns yet." action={<Button size="sm" className="rounded-xl" onClick={() => navigate('/create')}><Plus className="h-3.5 w-3.5" />Create one</Button>} />
            ) : (
              topCampaigns.map((c, i) => (
                <button key={c.id} onClick={() => navigate('/campaigns')} className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-all hover:border-border hover:bg-muted/50">
                  <div className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                      <Badge className={`shrink-0 rounded-full px-2 py-0 text-[10px] ${statusColor(c.status)}`}>{c.status}</Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Reach {compact(c.reach)}</span>
                      <span>CTR {Number(c.ctr).toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(100, Number(c.ctr) * 18)} className="mt-1.5 h-1" />
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Platform Integrations</CardTitle>
            <p className="text-xs text-muted-foreground">Connect ad platforms in one click.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${p.color} text-white`}>
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.status}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs">Connect</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Best Performing Templates</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate('/template-library')}>
              View all <ChevronRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
            ) : templates.length === 0 ? (
              <Empty text="No templates yet." />
            ) : (
              templates.slice(0, 5).map((t) => {
                const maxUsage = templates[0]?.usage_count || 1;
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-foreground">{t.name}</p>
                        <span className="text-xs text-muted-foreground">{t.usage_count} uses</span>
                      </div>
                      <Progress value={(t.usage_count / maxUsage) * 100} className="mt-1.5 h-1" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Campaign Performance</CardTitle>
            <p className="text-xs text-muted-foreground">Live status across all your active campaigns.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl"><Filter className="h-3.5 w-3.5" />Filter</Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl"><Download className="h-3.5 w-3.5" />Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : campaigns.length === 0 ? (
            <Empty text="No campaigns to display." action={<Button size="sm" className="rounded-xl" onClick={() => navigate('/create')}><Plus className="h-3.5 w-3.5" />Create your first campaign</Button>} />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reach</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.slice(0, 10).map((c) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate('/campaigns')}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell><Badge className={`rounded-full px-2 py-0 text-[10px] ${statusColor(c.status)}`}>{c.status}</Badge></TableCell>
                        <TableCell>{compact(c.reach)}</TableCell>
                        <TableCell>{Number(c.ctr).toFixed(1)}%</TableCell>
                        <TableCell>{compact(c.clicks)}</TableCell>
                        <TableCell className="font-semibold text-primary">{Number(c.roas).toFixed(2)}x</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-2 md:hidden">
                {campaigns.slice(0, 10).map((c) => (
                  <div key={c.id} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <Badge className={`rounded-full px-2 py-0 text-[10px] ${statusColor(c.status)}`}>{c.status}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div><p className="text-foreground font-medium">{compact(c.reach)}</p>Reach</div>
                      <div><p className="text-foreground font-medium">{Number(c.ctr).toFixed(1)}%</p>CTR</div>
                      <div><p className="text-foreground font-medium">{compact(c.clicks)}</p>Clicks</div>
                      <div><p className="text-primary font-semibold">{Number(c.roas).toFixed(2)}x</p>ROAS</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Media + Brand + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <HardDrive className="h-4 w-4 text-primary" />
              Storage Usage
            </CardTitle>
            <p className="text-xs text-muted-foreground">{(storageUsed / 1024 / 1024).toFixed(1)} MB of {(STORAGE_CAP_BYTES / 1024 / 1024 / 1024).toFixed(0)} GB used</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={storagePct} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border/60 p-3">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><ImageIcon className="h-4 w-4" /></div>
                <p className="mt-2 text-sm font-semibold">{imageCount}</p>
                <p className="text-[10px] text-muted-foreground">Images</p>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Video className="h-4 w-4" /></div>
                <p className="mt-2 text-sm font-semibold">{videoCount}</p>
                <p className="text-[10px] text-muted-foreground">Videos</p>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileImage className="h-4 w-4" /></div>
                <p className="mt-2 text-sm font-semibold">{media.length}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Brand Kit Performance</CardTitle>
            <p className="text-xs text-muted-foreground">How complete your brand kit is.</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
                  <circle cx="50" cy="50" r="42" stroke="hsl(var(--primary))" strokeWidth="10" fill="none"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - brandScore / 100)}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-semibold">{brandScore}</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  { label: 'Logos', value: brandCounts.logos, max: 5 },
                  { label: 'Colors', value: brandCounts.colors, max: 10 },
                  { label: 'Fonts', value: brandCounts.fonts, max: 5 },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium">{m.value}</span>
                    </div>
                    <Progress value={Math.min(100, (m.value / m.max) * 100)} className="mt-1 h-1" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : activity.length === 0 ? (
              <Empty text="No activity yet." />
            ) : (
              <ol className="relative space-y-4 border-l border-border/70 pl-4">
                {activity.slice(0, 6).map((a) => {
                  const Icon = activityIcon(a.entity_type);
                  return (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-[22px] flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-card">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-sm text-foreground">{a.description || a.action}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border-border/60 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full bg-success/15 text-success hover:bg-success/15">Growth</Badge>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{insightGrowth >= 0 ? '+' : ''}{insightGrowth.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Reach trend vs. previous period</p>
            <div className="mt-3 h-12">
              {performanceSeries.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceSeries}>
                    <Line type="monotone" dataKey="reach" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/60 bg-gradient-to-br from-accent/15 via-card to-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/15">Top Performer</Badge>
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 truncate text-base font-semibold">{topCampaigns[0]?.name || 'No campaign yet'}</p>
            <p className="text-xs text-muted-foreground">
              {topCampaigns[0] ? `ROAS ${Number(topCampaigns[0].roas).toFixed(2)}x · ${compact(topCampaigns[0].reach)} reach` : 'Launch a campaign to see results'}
            </p>
            <div className="mt-3 h-12">
              {performanceSeries.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceSeries}>
                    <Line type="monotone" dataKey="revenue" stroke="hsl(252 83% 61%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/60 bg-gradient-to-br from-primary-glow/15 via-card to-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full bg-accent/20 text-accent-foreground hover:bg-accent/20">Recommendation</Badge>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-sm font-semibold leading-snug">
              {videoCount < imageCount
                ? 'Use more video assets to boost engagement by an estimated +24%.'
                : 'Your asset mix looks balanced — try A/B testing CTAs to push CTR.'}
            </p>
            <Button size="sm" className="mt-4 h-9 w-full rounded-xl" onClick={() => navigate('/create')}>
              Try suggestion <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Health footer */}
      <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
        <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">All systems healthy</p>
              <p className="text-xs text-muted-foreground">Live data syncing in real time from Supabase.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={refetchAll}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
