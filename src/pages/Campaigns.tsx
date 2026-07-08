import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Archive, Copy, Edit, Eye, Filter, MoreVertical, Pause,
  Play, Plus, Search, ShoppingCart, Target, Trash2, TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  CampaignRow, useCampaigns, useDeleteCampaign, useDuplicateCampaign, useUpdateCampaign,
} from '@/hooks/useCampaigns';
import { CampaignFormDialog } from '@/components/campaigns/CampaignFormDialog';
import { useContextOverride } from '@/contexts/AIContext';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  draft: 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  archived: 'bg-muted text-muted-foreground',
};

function StatusBadge({ status }: { status: string }) {
  return <Badge className={cn('capitalize border-0', STATUS_STYLES[status] || STATUS_STYLES.draft)}>{status}</Badge>;
}

function KpiCard({ icon: Icon, label, value, iconBg }: { icon: any; label: string; value: string | number; iconBg: string }) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const Campaigns = () => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'draft' | 'paused' | 'completed'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignRow | null>(null);

  const { data: campaigns = [], isLoading, isError, refetch } = useCampaigns({ includeArchived: showArchived });
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

  // While editing an existing campaign, override the global AI context with its metadata.
  useContextOverride(
    formOpen && editing
      ? {
          source: "campaign",
          label: editing.name,
          patch: {
            current_campaign_id: editing.id,
            current_goal: editing.objective ?? null,
            active_platform: editing.platform ?? null,
          },
        }
      : null
  );


  const togglePauseResume = (c: CampaignRow) => {
    const next = c.status === 'active' ? 'paused' : 'active';
    updateMut.mutate({ id: c.id, updates: { status: next } });
  };

  const archive = (c: CampaignRow) => updateMut.mutate({ id: c.id, updates: { archived: true, status: 'archived' } });
  const unarchive = (c: CampaignRow) => updateMut.mutate({ id: c.id, updates: { archived: false, status: 'draft' } });

  const handleDelete = (c: CampaignRow) => {
    if (confirm(`Delete "${c.name}"? This cannot be undone.`)) {
      deleteMut.mutate(c);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all advertising campaigns from one place.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" className="hidden sm:inline-flex" aria-label="Filter">
            <Filter className="w-4 h-4" />
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Create Campaign
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="Total Campaigns" value={counts.total} iconBg="bg-violet-100 text-violet-600" />
        <KpiCard icon={ShoppingCart} label="Active" value={counts.active} iconBg="bg-emerald-100 text-emerald-600" />
        <KpiCard icon={Pause} label="Paused" value={counts.paused} iconBg="bg-amber-100 text-amber-600" />
        <KpiCard icon={Target} label="Completed" value={counts.completed} iconBg="bg-blue-100 text-blue-600" />
      </div>

      {/* Filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full sm:w-auto">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">All <span className="ml-1.5 text-xs text-muted-foreground">{counts.total}</span></TabsTrigger>
            <TabsTrigger value="active">Active <span className="ml-1.5 text-xs text-muted-foreground">{counts.active}</span></TabsTrigger>
            <TabsTrigger value="draft">Draft <span className="ml-1.5 text-xs text-muted-foreground">{counts.draft}</span></TabsTrigger>
            <TabsTrigger value="paused">Paused <span className="ml-1.5 text-xs text-muted-foreground">{counts.paused}</span></TabsTrigger>
            <TabsTrigger value="completed">Completed <span className="ml-1.5 text-xs text-muted-foreground">{counts.completed}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Switch id="archived" checked={showArchived} onCheckedChange={setShowArchived} />
          <Label htmlFor="archived" className="text-sm text-muted-foreground cursor-pointer">Show archived</Label>
        </div>
      </div>

      {/* Content */}
      {isError ? (
        <Card className="rounded-2xl">
          <CardContent className="p-10 text-center space-y-3">
            <p className="text-destructive">Failed to load campaigns.</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No campaigns yet</h3>
              <p className="text-sm text-muted-foreground">Get started by creating your first campaign.</p>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Create First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="rounded-2xl hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Reach</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b last:border-b-0 hover:bg-muted/40"
                    >
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{c.objective}</div>
                      </TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-sm">{c.platform || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">${Number(c.budget).toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.reach.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(c.ctr).toFixed(2)}%</TableCell>
                      <TableCell className="text-right tabular-nums">{c.conversions.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(c.roas).toFixed(2)}x</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <CampaignActions
                          c={c}
                          onView={() => openEdit(c)}
                          onEdit={() => openEdit(c)}
                          onDuplicate={() => duplicateMut.mutate(c)}
                          onTogglePause={() => togglePauseResume(c)}
                          onArchive={() => archive(c)}
                          onUnarchive={() => unarchive(c)}
                          onDelete={() => handleDelete(c)}
                        />
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <Card key={c.id} className="rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold truncate">{c.name}</h4>
                      <p className="text-xs text-muted-foreground capitalize">{c.objective} • {c.platform || '—'}</p>
                    </div>
                    <CampaignActions
                      c={c}
                      onView={() => openEdit(c)}
                      onEdit={() => openEdit(c)}
                      onDuplicate={() => duplicateMut.mutate(c)}
                      onTogglePause={() => togglePauseResume(c)}
                      onArchive={() => archive(c)}
                      onUnarchive={() => unarchive(c)}
                      onDelete={() => handleDelete(c)}
                    />
                  </div>
                  <StatusBadge status={c.status} />
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Budget</p>
                      <p className="text-sm font-semibold">${Number(c.budget).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Reach</p>
                      <p className="text-sm font-semibold">{c.reach.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">ROAS</p>
                      <p className="text-sm font-semibold">{Number(c.roas).toFixed(2)}x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <CampaignFormDialog open={formOpen} onOpenChange={setFormOpen} campaign={editing} />
    </div>
  );
};

function CampaignActions({
  c, onView, onEdit, onDuplicate, onTogglePause, onArchive, onUnarchive, onDelete,
}: {
  c: CampaignRow;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onTogglePause: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Actions">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onView}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
        {c.status === 'active' ? (
          <DropdownMenuItem onClick={onTogglePause}><Pause className="w-4 h-4 mr-2" /> Pause</DropdownMenuItem>
        ) : c.status === 'paused' ? (
          <DropdownMenuItem onClick={onTogglePause}><Play className="w-4 h-4 mr-2" /> Resume</DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {c.archived ? (
          <DropdownMenuItem onClick={onUnarchive}><Activity className="w-4 h-4 mr-2" /> Unarchive</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onArchive}><Archive className="w-4 h-4 mr-2" /> Archive</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Campaigns;
