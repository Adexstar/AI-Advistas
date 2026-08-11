import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Settings2 } from 'lucide-react';
import { formatBytes, useAdminUserDetail, useAdminUsers, type AdminUserRow } from '@/hooks/admin/useAdminData';
import { toast } from 'sonner';

const PAGE_SIZE = 25;

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const { data: rows = [], isLoading } = useAdminUsers({
    search,
    plan: plan === 'all' ? null : plan,
    status: status === 'all' ? null : status,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: detail } = useAdminUserDetail(selected?.user_id ?? null);

  const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1), [page, total]);

  const notAvailable = () => toast.info('This action is not wired up yet.');

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search users..."
            className="pl-9"
          />
        </div>
        <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All plans" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="agency">Agency</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="past_due">Past due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No users match these filters.</p>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((u) => (
                <div key={u.user_id} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[2fr_repeat(4,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.display_name || 'Unnamed user'}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(u.joined_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <Badge variant="secondary" className="capitalize">{u.plan}</Badge>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">{u.status}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-muted-foreground">Campaigns</p>
                    <p className="font-medium">{Number(u.campaigns)}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-muted-foreground">Storage</p>
                    <p className="font-medium">{formatBytes(Number(u.storage_bytes))}</p>
                    <Progress value={Math.min(100, Number(u.storage_bytes) / (5 * 1024 ** 3) * 100)} className="mt-1 h-1.5" />
                  </div>
                  <div className="text-xs">
                    <p className="text-muted-foreground">AI usage</p>
                    <p className="font-medium">{Number(u.ai_credits)}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="User actions" onClick={() => setSelected(u)}>
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {start}-{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()} users
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="px-2 py-1">{page} / {pages}</span>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected?.display_name || 'User'}</SheetTitle>
            <SheetDescription>{selected?.email}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
              <div className="grid gap-2">
                {['View Workspace', 'View Campaigns', 'View Decision Log', 'Reset AI Credits', 'Add Storage', 'Change Plan'].map((a) => (
                  <Button key={a} variant="outline" size="sm" className="justify-start" onClick={notAvailable}>
                    {a}
                  </Button>
                ))}
                <Button variant="destructive" size="sm" className="justify-start" onClick={notAvailable}>
                  Suspend Account
                </Button>
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</p>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Plan</dt><dd className="capitalize">{selected?.plan}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Next billing</dt><dd>{detail?.subscription?.current_period_end ? new Date(detail.subscription.current_period_end).toLocaleDateString() : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Brands</dt><dd>{detail?.brands ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Campaigns</dt><dd>{detail?.campaigns ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Templates created</dt><dd>{detail?.templates_created ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Exports</dt><dd>{detail?.exports ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Storage</dt><dd>{formatBytes(Number(detail?.storage_bytes ?? 0))}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Last active</dt><dd>{selected?.last_active ? new Date(selected.last_active).toLocaleString() : '—'}</dd></div>
              </dl>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</p>
              {(detail?.activity ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No recorded activity.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {detail.activity.map((a: any, i: number) => (
                    <li key={i} className="rounded-lg border border-border/60 p-2">
                      <p className="font-medium">{a.description || a.action}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
