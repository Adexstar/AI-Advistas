import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Archive, ChevronDown, Copy, DollarSign, Edit, Eye, Facebook, Filter,
  Globe, Instagram, Layers, MoreVertical, Pause, Play, Plus, Search, ShoppingCart,
  Sparkles, Target, Trash2, TrendingUp, Video, Wand2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CampaignRow, useCampaigns, useDeleteCampaign, useDuplicateCampaign, useUpdateCampaign,
} from '@/hooks/useCampaigns';
import { CampaignFormDialog } from '@/components/campaigns/CampaignFormDialog';
import { AIContextBar } from '@/components/dashboard/AIContextBar';
import { AIAssistantPanel } from '@/components/dashboard/AIAssistantPanel';
import { AIRecommendationBanner } from '@/components/dashboard/AIRecommendationBanner';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-100 text-amber-700 border-amber-200',
  draft: 'bg-slate-200 text-slate-700 border-slate-300',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  archived: 'bg-muted text-muted-foreground border-border',
};

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn('capitalize', STATUS_STYLES[status] || STATUS_STYLES.draft)}>{status}</Badge>;
}

function platformIcon(p: string | null) {
  const key = (p || '').toLowerCase();
  if (key.includes('facebook') || key.includes('meta')) return Facebook;
  if (key.includes('instagram')) return Instagram;
  if (key.includes('tiktok')) return Video;
  if (key.includes('google')) return Globe;
  return Layers;
}

/* ---------- Sparkline ---------- */
function Sparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const w = 90, h = 28, max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1 || 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full">
      <polyline fill="none" stroke={color} strokeWidth="1.75" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function makeTrend(seed: number) {
  return Array.from({ length: 10 }).map((_, i) => 40 + Math.round(Math.sin((seed + i) * 0.7) * 15 + i * 1.5));
}

/* ---------- KPI ---------- */
interface KpiProps {
  icon: any; label: string; value: string; delta?: string;
  deltaTone?: 'up' | 'down'; iconClass: string; sparkColor?: string; seed: number;
}
function Kpi({ icon: Icon, label, value, delta, deltaTone = 'up', iconClass, sparkColor, seed }: KpiProps) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="space-y-2 p-3 sm:space-y-3 sm:p-5">
        <div className="flex items-center gap-2">
          <div className={cn('grid h-7 w-7 place-items-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl', iconClass)}>
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <p className="truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]">{label}</p>
        </div>
        <p className="text-lg font-bold tracking-tight sm:text-2xl">{value}</p>
        <div className="flex items-center justify-between gap-2">
          {delta && (
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold sm:text-[11px]',
              deltaTone === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
              {deltaTone === 'up' ? '↑' : '↓'} {delta}
              <span className="hidden text-muted-foreground font-normal sm:inline">vs last 7d</span>
              <span className="text-muted-foreground font-normal sm:hidden">7d</span>
            </span>
          )}
          <div className="ml-auto hidden w-24 sm:block">
            <Sparkline data={makeTrend(seed)} color={sparkColor} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


/* ---------- AI Recommendation Sidebar Cards ---------- */
interface RecCardProps {
  icon: any; title: string; description: string; confidence?: number;
  impact?: string; priority?: 'High' | 'Medium' | 'Low';
  primaryLabel: string; secondaryLabel?: string;
  onPrimary?: () => void; onSecondary?: () => void; tone?: 'rose' | 'amber' | 'sky' | 'primary';
}
const TONE: Record<string, { pill: string; ring: string; icon: string }> = {
  rose:    { pill: 'bg-rose-500/10 text-rose-600',    ring: 'border-rose-500/25',    icon: 'bg-rose-500/15 text-rose-600' },
  amber:   { pill: 'bg-amber-500/10 text-amber-600',  ring: 'border-amber-500/25',   icon: 'bg-amber-500/15 text-amber-600' },
  sky:     { pill: 'bg-sky-500/10 text-sky-600',      ring: 'border-sky-500/25',     icon: 'bg-sky-500/15 text-sky-600' },
  primary: { pill: 'bg-primary/10 text-primary',      ring: 'border-primary/25',     icon: 'bg-primary/15 text-primary' },
};
function RecCard(p: RecCardProps) {
  const t = TONE[p.tone || 'primary'];
  return (
    <div className={cn('rounded-xl border bg-background/60 p-3', t.ring)}>
      <div className="flex items-start gap-3">
        <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', t.icon)}>
          <p.icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{p.title}</p>
            {p.priority && (
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', t.pill)}>
                {p.priority}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.description}</p>
          {(p.confidence != null || p.impact) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {p.confidence != null && <span className="text-muted-foreground">Confidence <b className="text-foreground">{p.confidence}%</b></span>}
              {p.impact && <span className="text-emerald-600 font-semibold">Impact {p.impact}</span>}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" className="h-7 rounded-lg text-xs" onClick={p.onPrimary}>{p.primaryLabel}</Button>
            {p.secondaryLabel && (
              <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={p.onSecondary}>{p.secondaryLabel}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
const Campaigns = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'draft' | 'paused' | 'completed'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignRow | null>(null);

  const { data: campaigns = [], isLoading, isError, refetch } = useCampaigns();
  const updateMut = useUpdateCampaign();
  const duplicateMut = useDuplicateCampaign();
  const deleteMut = useDeleteCampaign();

  const counts = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    paused: campaigns.filter((c) => c.status === 'paused').length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
  }), [campaigns]);

  const totals = useMemo(() => {
    const spend = campaigns.reduce((a, c) => a + Number(c.spend || 0), 0);
    const conversions = campaigns.reduce((a, c) => a + Number(c.conversions || 0), 0);
    const roas = campaigns.length
      ? campaigns.reduce((a, c) => a + Number(c.roas || 0), 0) / campaigns.length
      : 0;
    return { spend, conversions, roas };
  }, [campaigns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      const matchesTab = tab === 'all' || c.status === tab;
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.platform || '').toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [campaigns, search, tab]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: CampaignRow) => { setEditing(c); setFormOpen(true); };
  const togglePauseResume = (c: CampaignRow) => {
    const next = c.status === 'active' ? 'paused' : 'active';
    updateMut.mutate({ id: c.id, updates: { status: next } });
  };
  const archive = (c: CampaignRow) => updateMut.mutate({ id: c.id, updates: { archived: true, status: 'archived' } });
  const unarchive = (c: CampaignRow) => updateMut.mutate({ id: c.id, updates: { archived: false, status: 'draft' } });
  const handleDelete = (c: CampaignRow) => {
    if (confirm(`Delete "${c.name}"? This cannot be undone.`)) deleteMut.mutate(c);
  };

  return (
    <div className="container mx-auto space-y-5 p-4 pb-32 md:p-6 md:pb-24 max-w-[1600px]">
      {/* Global AI Context */}
      <AIContextBar />

      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage, analyze and optimize all campaigns in one place.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start lg:self-auto">
          <Plus className="h-4 w-4" /> Create Campaign
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* LEFT COLUMN */}
        <div className="min-w-0 space-y-5">
          {/* Mobile AI Assistant hero card (matches mockup) */}
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-b from-primary/[0.05] to-primary/[0.02] shadow-sm xl:hidden">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-primary">AI Campaign Assistant</p>
                <Badge variant="secondary" className="ml-1 rounded-full bg-primary/15 text-[10px] text-primary">Beta</Badge>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-rose-200/70 bg-white/70 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-600">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Creative fatigue detected</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    3 campaigns are showing signs of fatigue. AI recommends refreshing creatives.
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Confidence: <b className="text-foreground">91%</b></p>
                </div>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Button className="w-full rounded-xl">View Affected Campaigns →</Button>
            </CardContent>
          </Card>

          {/* KPI cards - compact 3-col mobile / grid desktop */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <Kpi icon={Layers} label="Total Campaigns" value={String(counts.total)}
              delta="14%" iconClass="bg-violet-100 text-violet-600"
              sparkColor="hsl(var(--primary))" seed={1} />
            <Kpi icon={DollarSign} label="Total Spend" value={`$${totals.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              delta="6%" deltaTone="down" iconClass="bg-emerald-100 text-emerald-600"
              sparkColor="hsl(var(--primary))" seed={4} />
            <Kpi icon={TrendingUp} label="Avg. ROAS" value={`${totals.roas.toFixed(2)}x`}
              delta="11%" iconClass="bg-amber-100 text-amber-600"
              sparkColor="#f59e0b" seed={11} />
            <div className="hidden sm:block">
              <Kpi icon={ShoppingCart} label="Conversions" value={totals.conversions.toLocaleString()}
                delta="18%" iconClass="bg-blue-100 text-blue-600"
                sparkColor="#10b981" seed={7} />
            </div>
          </div>


          {/* Tabs + Toolbar */}
          <div className="flex flex-col gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1 sm:w-auto">
                <TabsTrigger value="all" className="gap-1.5 rounded-lg text-xs sm:text-sm">
                  All Campaigns <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{counts.total}</span>
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-1.5 rounded-lg text-xs sm:text-sm">
                  Active <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">{counts.active}</span>
                </TabsTrigger>
                <TabsTrigger value="paused" className="gap-1.5 rounded-lg text-xs sm:text-sm">
                  Paused <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">{counts.paused}</span>
                </TabsTrigger>
                <TabsTrigger value="draft" className="gap-1.5 rounded-lg text-xs sm:text-sm">
                  Draft <span className="rounded-full bg-slate-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{counts.draft}</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-1.5 rounded-lg text-xs sm:text-sm">
                  Completed <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">{counts.completed}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search campaigns…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                <Filter className="h-3.5 w-3.5" /> Filters <ChevronDown className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="hidden gap-1.5 rounded-xl sm:inline-flex">
                <Layers className="h-3.5 w-3.5" /> Columns
              </Button>
            </div>
          </div>

          {/* Table / Cards */}
          {isError ? (
            <Card className="rounded-2xl">
              <CardContent className="space-y-3 p-10 text-center">
                <p className="text-destructive">Failed to load campaigns.</p>
                <Button onClick={() => refetch()}>Retry</Button>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card className="rounded-2xl"><CardContent className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="space-y-4 p-12 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-100 text-violet-600">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No campaigns yet</h3>
                  <p className="text-sm text-muted-foreground">Start your first campaign to see AI insights here.</p>
                </div>
                <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Create First Campaign</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden overflow-hidden rounded-2xl md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Objective</TableHead>
                        <TableHead className="text-right">Spend</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">Conv.</TableHead>
                        <TableHead className="text-right">ROAS</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c, i) => {
                        const PIcon = platformIcon(c.platform);
                        const daily = Math.max(1, Math.round(Number(c.budget) / 30));
                        return (
                          <motion.tr key={c.id}
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }} className="border-b last:border-b-0 hover:bg-muted/40">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                                  <PIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold">{c.name}</div>
                                  <div className="truncate text-[11px] text-muted-foreground capitalize">
                                    {(c.platform || '—')} • {c.objective}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><StatusBadge status={c.status} /></TableCell>
                            <TableCell className="text-sm capitalize">{c.objective}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              <div className="text-sm font-semibold">${Number(c.spend).toLocaleString()}</div>
                              <div className="text-[10px] text-muted-foreground">Daily: ${daily}</div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{Number(c.ctr).toFixed(2)}%</TableCell>
                            <TableCell className="text-right tabular-nums">{c.conversions.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">{Number(c.roas).toFixed(2)}x</TableCell>
                            <TableCell className="text-right">
                              <CampaignActions c={c}
                                onView={() => openEdit(c)} onEdit={() => openEdit(c)}
                                onDuplicate={() => duplicateMut.mutate(c)}
                                onTogglePause={() => togglePauseResume(c)}
                                onArchive={() => archive(c)} onUnarchive={() => unarchive(c)}
                                onDelete={() => handleDelete(c)} />
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Mobile stacked cards - matches mockup */}
              <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card md:hidden">
                {filtered.map((c) => {
                  const PIcon = platformIcon(c.platform);
                  return (
                    <button key={c.id} type="button" onClick={() => openEdit(c)}
                      className="flex w-full items-start gap-3 p-3 text-left transition active:bg-muted/40">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                        <div className="grid h-full w-full place-items-center text-primary">
                          <PIcon className="h-6 w-6" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-background shadow ring-1 ring-border">
                          <PIcon className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-sm font-semibold">{c.name}</h4>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground capitalize">
                          {c.objective} • {c.platform || '—'}
                        </p>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Spend</p>
                            <p className="text-xs font-semibold">${Number(c.spend).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">ROAS</p>
                            <p className="text-xs font-semibold text-emerald-600">{Number(c.roas).toFixed(2)}x</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Conv.</p>
                            <p className="text-xs font-semibold">{c.conversions}</p>
                          </div>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <CampaignActions c={c}
                          onView={() => openEdit(c)} onEdit={() => openEdit(c)}
                          onDuplicate={() => duplicateMut.mutate(c)}
                          onTogglePause={() => togglePauseResume(c)}
                          onArchive={() => archive(c)} onUnarchive={() => unarchive(c)}
                          onDelete={() => handleDelete(c)} />
                      </div>
                    </button>
                  );
                })}
              </div>

            </>
          )}
        </div>

        {/* RIGHT COLUMN - AI Sidebar */}
        <aside className="space-y-4">
          {/* AI Campaign Assistant static insight cards */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Campaign Assistant</p>
                    <p className="text-[11px] text-muted-foreground">Live optimization insights</p>
                  </div>
                </div>
              </div>

              {/* Horizontal swipe on mobile, stack on desktop */}
              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 xl:mx-0 xl:block xl:space-y-3 xl:overflow-visible xl:px-0">
                <div className="min-w-[85%] shrink-0 snap-start xl:min-w-0">
                  <RecCard icon={Activity} tone="rose" priority="High"
                    title="Creative Fatigue Detected"
                    description="3 campaigns are showing declining CTR. AI recommends refreshing creatives."
                    confidence={91} primaryLabel="View Campaigns" secondaryLabel="Generate Variants" />
                </div>
                <div className="min-w-[85%] shrink-0 snap-start xl:min-w-0">
                  <RecCard icon={DollarSign} tone="amber" priority="High"
                    title="Budget Opportunity"
                    description="Top campaign outperforming category avg. Consider increasing budget."
                    confidence={87} impact="+18%" primaryLabel="Apply" secondaryLabel="Review" />
                </div>
                <div className="min-w-[85%] shrink-0 snap-start xl:min-w-0">
                  <RecCard icon={Copy} tone="primary" priority="Medium"
                    title="Duplicate Winner"
                    description="Your best campaign could be duplicated into a new audience segment."
                    confidence={82} primaryLabel="Duplicate" secondaryLabel="Preview" />
                </div>
                <div className="min-w-[85%] shrink-0 snap-start xl:min-w-0">
                  <RecCard icon={Target} tone="sky" priority="Medium"
                    title="Audience Expansion"
                    description="High-performing audience detected. Create a lookalike to expand reach."
                    confidence={79} impact="+43% reach" primaryLabel="Create" secondaryLabel="Preview" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live decisions from DecisionService */}
          <AIAssistantPanel />

          {/* Top AI Recommendations quick list */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Top AI Recommendations</p>
                <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => navigate('/dashboard')}>View all</Button>
              </div>
              {[
                { t: 'Increase Budget', d: '"Summer Glow Serum" is performing well.', p: 'High' },
                { t: 'Refresh Creative', d: '"Hydrate & Shine" showing fatigue.', p: 'Medium' },
                { t: 'Audience Expansion', d: 'Expand lookalike audience for more reach.', p: 'High' },
              ].map((r) => (
                <div key={r.t} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{r.t}</p>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        r.p === 'High' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600')}>
                        {r.p} Impact
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{r.d}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 rounded-lg text-[11px]">Review</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      <CampaignFormDialog open={formOpen} onOpenChange={setFormOpen} campaign={editing} />

      {/* Sticky AI banner */}
      <AIRecommendationBanner />
    </div>
  );
};

function CampaignActions({
  c, onView, onEdit, onDuplicate, onTogglePause, onArchive, onUnarchive, onDelete,
}: {
  c: CampaignRow;
  onView: () => void; onEdit: () => void; onDuplicate: () => void;
  onTogglePause: () => void; onArchive: () => void; onUnarchive: () => void; onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Actions">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onView}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
        <DropdownMenuItem><Wand2 className="mr-2 h-4 w-4" /> AI Review</DropdownMenuItem>
        {c.status === 'active' ? (
          <DropdownMenuItem onClick={onTogglePause}><Pause className="mr-2 h-4 w-4" /> Pause</DropdownMenuItem>
        ) : c.status === 'paused' ? (
          <DropdownMenuItem onClick={onTogglePause}><Play className="mr-2 h-4 w-4" /> Resume</DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {c.archived ? (
          <DropdownMenuItem onClick={onUnarchive}><Activity className="mr-2 h-4 w-4" /> Unarchive</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onArchive}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Campaigns;
