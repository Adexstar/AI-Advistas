import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownRight, ArrowUpRight, Brain, CheckCircle2, Megaphone, Sparkles, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import {
  pctChange,
  useAdminActionTrends,
  useAdminDecisionStats,
  useAdminOverview,
  useAdminPlanDistribution,
  useAdminTopTemplates,
  useAdminUserGrowth,
} from '@/hooks/admin/useAdminData';

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
];

const Kpi = ({
  icon: Icon,
  label,
  value,
  change,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change?: number;
}) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        {typeof change === 'number' && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold ${
              change >= 0 ? 'text-emerald-500' : 'text-destructive'
            }`}
          >
            {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [range, setRange] = useState(30);
  const { data: stats, isLoading } = useAdminOverview();
  const { data: growth = [] } = useAdminUserGrowth(range);
  const { data: plans = [] } = useAdminPlanDistribution();
  const { data: top = [] } = useAdminTopTemplates();
  const { data: decisions } = useAdminDecisionStats();
  const { data: trends } = useAdminActionTrends();

  const totalPlanUsers = plans.reduce((s, p) => s + Number(p.users), 0) || 1;

  const alerts = [
    stats?.templates_pending
      ? {
          tone: 'destructive' as const,
          text: `${stats.templates_pending} template${stats.templates_pending === 1 ? '' : 's'} pending review`,
          action: { label: 'Review', to: '/admin/templates' },
        }
      : null,
    decisions?.pending
      ? {
          tone: 'warning' as const,
          text: `${decisions.pending} AI decisions awaiting resolution`,
          action: { label: 'View log', to: '/admin/decisions' },
        }
      : null,
    {
      tone: 'warning' as const,
      text: 'Check provider quotas and API health',
      action: { label: 'View details', to: '/admin/providers' },
    },
  ].filter(Boolean) as { tone: 'destructive' | 'warning'; text: string; action: { label: string; to: string } }[];

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          System overview — last 30 days
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            icon={Users}
            label="Users"
            value={(stats?.users_total ?? 0).toLocaleString()}
            change={pctChange(stats?.users_total ?? 0, stats?.users_prev ?? 0)}
          />
          <Kpi
            icon={Megaphone}
            label="Campaigns"
            value={(stats?.campaigns_total ?? 0).toLocaleString()}
            change={pctChange(stats?.campaigns_new_30d ?? 0, stats?.campaigns_prev_30d ?? 0)}
          />
          <Kpi
            icon={TrendingUp}
            label="Revenue (30d)"
            value={`$${Number(stats?.revenue_30d ?? 0).toLocaleString()}`}
            change={pctChange(Number(stats?.revenue_30d ?? 0), Number(stats?.revenue_prev_30d ?? 0))}
          />
          <Kpi icon={Sparkles} label="Active templates" value={(stats?.templates_active ?? 0).toLocaleString()} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Requires attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${a.tone === 'destructive' ? 'bg-destructive' : 'bg-amber-500'}`}
                  />
                  <p className="text-sm">{a.text}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={a.action.to}>{a.action.label}</Link>
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-lg border border-border/60 p-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> All other systems operational
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Usage by plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plans.length === 0 && <p className="text-sm text-muted-foreground">No accounts yet.</p>}
            {plans.map((p) => {
              const pct = Math.round((Number(p.users) / totalPlanUsers) * 100);
              return (
                <div key={p.plan}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize">{p.plan}</span>
                    <span className="text-muted-foreground">
                      {pct}% · {Number(p.users).toLocaleString()}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
            <p className="pt-2 text-sm font-semibold">MRR: ${Number(stats?.mrr ?? 0).toLocaleString()}/mo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">User growth</CardTitle>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Button
                key={r.label}
                size="sm"
                variant={range === r.days ? 'secondary' : 'ghost'}
                className="h-7 px-2 text-xs"
                onClick={() => setRange(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="adminGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <RTooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  color: 'hsl(var(--popover-foreground))',
                }}
              />
              <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#adminGrowth)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {top.length === 0 && <p className="text-sm text-muted-foreground">No templates yet.</p>}
            {top.map((t: any, i: number) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="w-4 text-sm text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {[t.category, t.platform].filter(Boolean).join(' · ') || 'Uncategorized'}
                  </p>
                </div>
                <Badge variant="secondary">{t.usage_count ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4" /> AI decisions summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total decisions</span>
              <span className="font-medium">{Number(decisions?.total ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approved</span>
              <span className="font-medium">{Number(decisions?.approved ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ignored</span>
              <span className="font-medium">{Number(decisions?.ignored ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium">{Number(decisions?.pending ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg confidence</span>
              <span className="font-medium">{Number(decisions?.avg_confidence ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Top action</span>
              <span className="font-medium">{decisions?.top_action ?? '—'}</span>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link to="/admin/decisions">View full decision log</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {trends?.trending?.length ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Trending AI actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {trends.trending.map((t: any) => (
              <div key={t.action} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <span className="truncate text-sm">{t.action}</span>
                <Badge variant="secondary">{t.recent}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
