import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import {
  formatBytes,
  pctChange,
  useAdminActionTrends,
  useAdminDecisionStats,
  useAdminOverview,
} from '@/hooks/admin/useAdminData';

const Stat = ({ label, value, change }: { label: string; value: string; change?: number }) => (
  <Card>
    <CardContent className="p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {typeof change === 'number' && (
        <p className={`text-xs font-semibold ${change >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </p>
      )}
    </CardContent>
  </Card>
);

export default function AdminAnalytics() {
  const { data: stats, isLoading } = useAdminOverview();
  const { data: decisions } = useAdminDecisionStats();
  const { data: trends } = useAdminActionTrends();

  const categories: { category: string; uses: number }[] = trends?.categories ?? [];
  const categoryTotal = categories.reduce((s, c) => s + Number(c.uses), 0) || 1;

  const exportCsv = () => {
    const rows: string[][] = [
      ['metric', 'value'],
      ['users_total', String(stats?.users_total ?? 0)],
      ['campaigns_total', String(stats?.campaigns_total ?? 0)],
      ['revenue_30d', String(stats?.revenue_30d ?? 0)],
      ['decisions_total', String(decisions?.total ?? 0)],
      ...categories.map((c) => [`category_${c.category}`, String(c.uses)]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'advista-system-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 p-6 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="New users (30d)"
          value={Number(stats?.users_new_30d ?? 0).toLocaleString()}
          change={pctChange(stats?.users_total ?? 0, stats?.users_prev ?? 0)}
        />
        <Stat
          label="Campaigns (30d)"
          value={Number(stats?.campaigns_new_30d ?? 0).toLocaleString()}
          change={pctChange(stats?.campaigns_new_30d ?? 0, stats?.campaigns_prev_30d ?? 0)}
        />
        <Stat
          label="AI decisions"
          value={Number(decisions?.total ?? 0).toLocaleString()}
          change={pctChange(Number(decisions?.last_30d ?? 0), Number(decisions?.prev_30d ?? 0))}
        />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Usage by category</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {categories.length === 0 && <p className="text-sm text-muted-foreground">No category data yet.</p>}
          {categories.map((c) => {
            const pct = Math.round((Number(c.uses) / categoryTotal) * 100);
            return (
              <div key={c.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize">{c.category}</span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Trending AI actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(trends?.trending ?? []).length === 0 && <p className="text-sm text-muted-foreground">No decisions recorded yet.</p>}
            {(trends?.trending ?? []).map((t: any) => (
              <div key={t.action} className="flex justify-between text-sm">
                <span className="truncate">{t.action}</span>
                <span className="text-muted-foreground">{t.recent} in 30d</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top ignored decisions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(trends?.ignored ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nothing ignored yet.</p>}
            {(trends?.ignored ?? []).map((t: any) => (
              <div key={t.action} className="flex justify-between text-sm">
                <span className="truncate">{t.action}</span>
                <span className="text-muted-foreground">{t.ignored_pct}% ignored</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Storage usage</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(trends?.storage_users ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No media stored yet.</p>
          ) : (
            (trends?.storage_users ?? []).map((u: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="truncate">{i + 1}. {u.name}</span>
                <span className="text-muted-foreground">{formatBytes(Number(u.bytes))}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
