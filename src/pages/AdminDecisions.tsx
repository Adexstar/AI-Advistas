import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useAdminDecisions } from '@/hooks/admin/useAdminData';

const PAGE_SIZE = 50;

const statusTone = (status: string) => {
  if (['approved', 'accepted', 'applied'].includes(status)) return 'text-emerald-500';
  if (['ignored', 'rejected', 'dismissed'].includes(status)) return 'text-destructive';
  return 'text-amber-500';
};

const rangeToDate = (value: string) => {
  if (value === 'all') return null;
  const days = Number(value);
  return new Date(Date.now() - days * 86400000).toISOString();
};

export default function AdminDecisions() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState('30');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useAdminDecisions({
    search,
    status: status === 'all' ? null : status,
    since: rangeToDate(range),
    page,
    pageSize: PAGE_SIZE,
  });

  const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search actions, signals, reasoning..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="ignored">Ignored</SelectItem>
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(v) => { setRange(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No AI decisions recorded for this filter.</p>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((d) => {
                const open = expanded === d.id;
                return (
                  <div key={d.id}>
                    <button
                      className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 text-left hover:bg-muted/40"
                      onClick={() => setExpanded(open ? null : d.id)}
                    >
                      {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.action || 'unknown_action'}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {new Date(d.created_at).toLocaleString()} · {d.user_name} · {d.category || 'general'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-semibold capitalize ${statusTone(d.status)}`}>{d.status}</p>
                        <p className="text-xs text-muted-foreground">conf {Number(d.confidence ?? 0).toFixed(2)}</p>
                      </div>
                    </button>
                    {open && (
                      <div className="space-y-1 border-t border-border/60 bg-muted/30 p-4 text-sm">
                        <p><span className="text-muted-foreground">Action:</span> {d.action || '—'}</p>
                        <p><span className="text-muted-foreground">Signal:</span> {d.signal || '—'}</p>
                        <p><span className="text-muted-foreground">Reasoning:</span> {d.reasoning || '—'}</p>
                        <p><span className="text-muted-foreground">Page:</span> {d.page || '—'}</p>
                        <p><span className="text-muted-foreground">Trigger:</span> {d.trigger_source || '—'}</p>
                        <p><span className="text-muted-foreground">Campaign:</span> {d.campaign_name || '—'}</p>
                        <p><span className="text-muted-foreground">Category:</span> {d.category || '—'}</p>
                        <div className="pt-1">
                          <Badge variant="secondary" className="capitalize">{d.status}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total.toLocaleString()} decisions</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="px-2 py-1">{page} / {pages}</span>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
