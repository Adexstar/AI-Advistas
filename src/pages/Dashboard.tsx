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
  Image as ImageIcon,
  Megaphone,
  MousePointerClick,
  Palette,
  PieChart as PieChartIcon,
  Plus,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ---------- demo data (replace with Supabase hooks later) ----------
const kpis = [
  { label: 'Campaigns', value: '48', change: '+12.5%', icon: Megaphone },
  { label: 'Reach', value: '2.4M', change: '+18.7%', icon: Users },
  { label: 'Clicks', value: '187K', change: '+15.3%', icon: MousePointerClick },
  { label: 'Conversions', value: '12,540', change: '+21.6%', icon: ShoppingCart },
  { label: 'Revenue', value: '$48,290', change: '+23.8%', icon: CircleDollarSign },
  { label: 'ROAS', value: '4.21x', change: '+20.4%', icon: TrendingUp },
];

const perfDaily = [
  { name: 'Mon', reach: 32000, clicks: 2800, conversions: 180, revenue: 4200 },
  { name: 'Tue', reach: 41000, clicks: 3400, conversions: 220, revenue: 5300 },
  { name: 'Wed', reach: 38000, clicks: 3100, conversions: 190, revenue: 4800 },
  { name: 'Thu', reach: 52000, clicks: 4200, conversions: 290, revenue: 6900 },
  { name: 'Fri', reach: 61000, clicks: 4900, conversions: 340, revenue: 8200 },
  { name: 'Sat', reach: 58000, clicks: 4600, conversions: 320, revenue: 7800 },
  { name: 'Sun', reach: 67000, clicks: 5300, conversions: 380, revenue: 9100 },
];

const topCampaigns = [
  { name: 'Summer Sale Campaign', status: 'Active', reach: '420K', ctr: 4.8, color: 'from-purple-500 to-pink-500' },
  { name: 'Black Friday Blast', status: 'Active', reach: '380K', ctr: 5.2, color: 'from-orange-500 to-red-500' },
  { name: 'Fitness Launch', status: 'Paused', reach: '210K', ctr: 3.1, color: 'from-emerald-500 to-teal-500' },
  { name: 'New Product Promo', status: 'Active', reach: '290K', ctr: 4.2, color: 'from-sky-500 to-indigo-500' },
];

const exportData = [
  { name: 'PNG', value: 980, color: 'hsl(252 83% 61%)' },
  { name: 'JPG', value: 620, color: 'hsl(278 94% 76%)' },
  { name: 'MP4', value: 510, color: 'hsl(43 96% 62%)' },
  { name: 'PDF', value: 230, color: 'hsl(142 71% 45%)' },
];

const integrations = [
  { name: 'Meta Ads', status: 'Connected', color: 'bg-blue-500' },
  { name: 'Google Ads', status: 'Connected', color: 'bg-red-500' },
  { name: 'TikTok Ads', status: 'Coming Soon', color: 'bg-black' },
];

const topTemplates = [
  { name: 'Real Estate Ad #1', usage: 248, ctr: 4.6 },
  { name: 'E-commerce Sale #4', usage: 192, ctr: 5.2 },
  { name: 'Agency Promo #2', usage: 168, ctr: 3.9 },
  { name: 'Product Launch #7', usage: 145, ctr: 4.1 },
];

const campaignRows = [
  { name: 'Summer Sale Campaign', status: 'Active', reach: '420K', ctr: '4.8%', conv: '1,240', roas: '5.24x' },
  { name: 'Black Friday Blast', status: 'Active', reach: '380K', ctr: '5.2%', conv: '1,180', roas: '4.92x' },
  { name: 'Fitness Launch', status: 'Paused', reach: '210K', ctr: '3.1%', conv: '540', roas: '2.85x' },
  { name: 'New Product Promo', status: 'Active', reach: '290K', ctr: '4.2%', conv: '880', roas: '4.15x' },
  { name: 'Spring Collection', status: 'Completed', reach: '510K', ctr: '4.7%', conv: '1,420', roas: '4.62x' },
];

const mediaAssets = [
  { name: 'Product Image 1', usage: 86, icon: ImageIcon },
  { name: 'Promo Video 2', usage: 72, icon: Video },
  { name: 'Brand Logo', usage: 94, icon: Sparkles },
  { name: 'Background 3', usage: 48, icon: FileImage },
];

const brandMetrics = [
  { label: 'Logo Usage', value: 88 },
  { label: 'Color Consistency', value: 92 },
  { label: 'Font Usage', value: 76 },
  { label: 'Brand Compliance', value: 82 },
];

const activity = [
  { icon: FileImage, text: 'Template "Summer Sale" imported', time: '2m ago' },
  { icon: Megaphone, text: 'Campaign "Black Friday" published', time: '1h ago' },
  { icon: Upload, text: 'Asset "hero-banner.png" uploaded', time: '3h ago' },
  { icon: Download, text: 'Ad "Promo May" exported as MP4', time: '6h ago' },
  { icon: Palette, text: 'Brand Kit colors updated', time: '1d ago' },
];

const statusColor = (s: string) =>
  s === 'Active'
    ? 'bg-success/15 text-success'
    : s === 'Paused'
    ? 'bg-accent/20 text-accent-foreground'
    : 'bg-muted text-muted-foreground';

// ---------- component ----------
const Dashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const totalExports = useMemo(
    () => exportData.reduce((acc, d) => acc + d.value, 0),
    [],
  );

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage campaigns, templates, assets and performance from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns, templates..."
              className="h-10 w-64 rounded-2xl border-border/70 bg-card/80 pl-9"
            />
          </div>
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
          <Card
            key={k.label}
            className="group rounded-2xl border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <k.icon className="h-4 w-4" />
                </div>
                <Badge className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success hover:bg-success/15">
                  {k.change}
                </Badge>
              </div>
              <p className="mt-3 text-xl font-semibold text-foreground md:text-2xl">{k.value}</p>
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
            <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <TabsList className="rounded-xl bg-muted">
                <TabsTrigger value="daily" className="rounded-lg text-xs">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="rounded-lg text-xs">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="rounded-lg text-xs">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfDaily} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="reach" stroke="hsl(252 83% 61%)" strokeWidth={2.5} fill="url(#reachGrad)" />
                  <Area type="monotone" dataKey="conversions" stroke="hsl(142 71% 45%)" strokeWidth={2.5} fill="url(#convGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Export Statistics
            </CardTitle>
            <p className="text-xs text-muted-foreground">Asset exports this month</p>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exportData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {exportData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-semibold text-foreground">{totalExports.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Exports</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {exportData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-medium text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
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
            {topCampaigns.map((c) => (
              <button
                key={c.name}
                onClick={() => navigate('/campaigns')}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-all hover:border-border hover:bg-muted/50"
              >
                <div className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${c.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                    <Badge className={`shrink-0 rounded-full px-2 py-0 text-[10px] ${statusColor(c.status)}`}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Reach {c.reach}</span>
                    <span>CTR {c.ctr}%</span>
                  </div>
                  <Progress value={c.ctr * 18} className="mt-1.5 h-1" />
                </div>
              </button>
            ))}
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
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs">
                  {p.status === 'Connected' ? 'Manage' : 'Connect'}
                </Button>
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
            {topTemplates.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-foreground">{t.name}</p>
                    <span className="text-xs text-muted-foreground">CTR {t.ctr}%</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={(t.usage / 248) * 100} className="h-1 flex-1" />
                    <span className="text-xs text-muted-foreground">{t.usage} uses</span>
                  </div>
                </div>
              </div>
            ))}
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
            <Button variant="outline" size="sm" className="h-9 rounded-xl">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reach</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignRows.map((c) => (
                  <TableRow key={c.name} className="cursor-pointer" onClick={() => navigate('/campaigns')}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge className={`rounded-full px-2 py-0 text-[10px] ${statusColor(c.status)}`}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{c.reach}</TableCell>
                    <TableCell>{c.ctr}</TableCell>
                    <TableCell>{c.conv}</TableCell>
                    <TableCell className="font-semibold text-primary">{c.roas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {campaignRows.map((c) => (
              <div key={c.name} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <Badge className={`rounded-full px-2 py-0 text-[10px] ${statusColor(c.status)}`}>{c.status}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div><p className="text-foreground font-medium">{c.reach}</p>Reach</div>
                  <div><p className="text-foreground font-medium">{c.ctr}</p>CTR</div>
                  <div><p className="text-foreground font-medium">{c.conv}</p>Conv.</div>
                  <div><p className="text-primary font-semibold">{c.roas}</p>ROAS</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Media + Brand + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Media Asset Usage</CardTitle>
            <p className="text-xs text-muted-foreground">Most-used assets across campaigns.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {mediaAssets.map((a) => (
              <div key={a.name} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <a.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <span className="text-xs text-muted-foreground">{a.usage}%</span>
                  </div>
                  <Progress value={a.usage} className="mt-1.5 h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Brand Kit Performance</CardTitle>
            <p className="text-xs text-muted-foreground">How consistently you use your brand.</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="hsl(var(--primary))"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - 0.82)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-semibold">82</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {brandMetrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium">{m.value}%</span>
                    </div>
                    <Progress value={m.value} className="mt-1 h-1" />
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
            <ol className="relative space-y-4 border-l border-border/70 pl-4">
              {activity.map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[22px] flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-card">
                    <a.icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </li>
              ))}
            </ol>
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
            <p className="mt-3 text-2xl font-semibold">+18.7%</p>
            <p className="text-xs text-muted-foreground">Reach increased this week</p>
            <div className="mt-3 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perfDaily}>
                  <Line type="monotone" dataKey="reach" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/60 bg-gradient-to-br from-accent/15 via-card to-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/15">Top Performer</Badge>
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 truncate text-base font-semibold">Summer Sale Campaign</p>
            <p className="text-xs text-muted-foreground">ROAS 4.32x · 420K reach</p>
            <div className="mt-3 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perfDaily}>
                  <Line type="monotone" dataKey="revenue" stroke="hsl(252 83% 61%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
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
              Use more video assets to boost engagement by an estimated +24%.
            </p>
            <Button size="sm" className="mt-4 h-9 w-full rounded-xl">
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
              <p className="text-xs text-muted-foreground">No issues detected across your campaigns and integrations.</p>
            </div>
          </div>
          <Button variant="outline" className="h-9 rounded-xl" onClick={() => navigate('/campaigns')}>
            Open Campaigns <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
