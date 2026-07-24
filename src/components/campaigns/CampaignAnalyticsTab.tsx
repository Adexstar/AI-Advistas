import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  AnalyticsService,
  AnalyticsSyncService,
  RecommendationService,
  BenchmarkService,
  ForecastService,
  BudgetOptimizerService,
  CreativePerformanceService,
  AudienceInsightsService,
  type AIRecommendation,
} from '@/services/analytics';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import {
  RefreshCw, Sparkles, TrendingUp, TrendingDown, Target, DollarSign,
  MousePointerClick, ShoppingCart, Eye, CheckCircle2, XCircle, Lightbulb,
} from 'lucide-react';

interface Props {
  campaignId: string;
  campaign: { platform?: string | null; campaign_category?: string | null; budget?: number };
}

const PLATFORM_COLORS: Record<string, string> = {
  meta: '#1877F2', facebook: '#1877F2', instagram: '#E4405F',
  tiktok: '#000000', google: '#EA4335', linkedin: '#0A66C2', unknown: '#94A3B8',
};

export function CampaignAnalyticsTab({ campaignId, campaign }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');

  const metricsQ = useQuery({
    queryKey: ['analytics-metrics', campaignId],
    queryFn: () => AnalyticsService.getMetrics(campaignId, 30),
  });
  const creativesQ = useQuery({
    queryKey: ['analytics-creatives', campaignId],
    queryFn: () => CreativePerformanceService.list(campaignId),
  });
  const audienceQ = useQuery({
    queryKey: ['analytics-audience', campaignId],
    queryFn: () => AudienceInsightsService.list(campaignId),
  });
  const recsQ = useQuery({
    queryKey: ['analytics-recs', campaignId, user?.id],
    queryFn: () => RecommendationService.list(user!.id, campaignId),
    enabled: !!user?.id,
  });

  const unified = useMemo(
    () => AnalyticsService.unify(metricsQ.data ?? []),
    [metricsQ.data],
  );
  const forecast = useMemo(
    () => ForecastService.project(metricsQ.data ?? [], 7, campaign.budget),
    [metricsQ.data, campaign.budget],
  );
  const budgetShifts = useMemo(() => BudgetOptimizerService.suggestShifts(unified), [unified]);

  const sync = useMutation({
    mutationFn: () => AnalyticsSyncService.sync(campaignId, ['meta', 'google', 'tiktok']),
    onSuccess: (r) => {
      toast({ title: 'Analytics synced', description: `${r.synced} rows across ${r.platforms.length} platforms.` });
      qc.invalidateQueries({ queryKey: ['analytics-metrics', campaignId] });
    },
    onError: (e: any) => toast({ title: 'Sync failed', description: e.message, variant: 'destructive' }),
  });

  const generateRecs = useMutation({
    mutationFn: async () => {
      const drafts = RecommendationService.synthesize({
        userId: user!.id,
        campaignId,
        category: campaign.campaign_category ?? null,
        unified,
      });
      for (const d of drafts) await RecommendationService.create(d);
      return drafts.length;
    },
    onSuccess: (n) => {
      toast({ title: 'AI insights generated', description: `${n} recommendations ready to review.` });
      qc.invalidateQueries({ queryKey: ['analytics-recs', campaignId, user?.id] });
    },
  });

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AIRecommendation['status'] }) =>
      RecommendationService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['analytics-recs', campaignId, user?.id] }),
  });

  const kpis = [
    { label: 'Reach', value: unified.totals.reach.toLocaleString(), icon: Eye },
    { label: 'Impressions', value: unified.totals.impressions.toLocaleString(), icon: Eye },
    { label: 'Clicks', value: unified.totals.clicks.toLocaleString(), icon: MousePointerClick },
    { label: 'CTR', value: `${unified.totals.ctr.toFixed(2)}%`, icon: TrendingUp },
    { label: 'Conversions', value: unified.totals.conversions.toLocaleString(), icon: ShoppingCart },
    { label: 'Spend', value: `$${unified.totals.spend.toFixed(0)}`, icon: DollarSign },
    { label: 'Revenue', value: `$${unified.totals.revenue.toFixed(0)}`, icon: DollarSign },
    { label: 'ROAS', value: `${unified.totals.roas.toFixed(2)}x`, icon: Target },
  ];

  const ctrBench = BenchmarkService.compare(campaign.campaign_category, 'ctr', unified.totals.ctr);
  const roasBench = BenchmarkService.compare(campaign.campaign_category, 'roas', unified.totals.roas);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Campaign Intelligence
          </h3>
          <p className="text-sm text-muted-foreground">Unified analytics across every connected platform.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${sync.isPending ? 'animate-spin' : ''}`} />
            Sync platforms
          </Button>
          <Button size="sm" onClick={() => generateRecs.mutate()} disabled={generateRecs.isPending || !unified.totals.impressions}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate AI insights
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold mt-1 tabular-nums">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="creatives">Creatives</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-3">Performance timeline</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={unified.timeline}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <RTooltip />
                    <Area type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="conversions" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-medium">Benchmark vs {campaign.campaign_category || 'industry'}</div>
                <BenchRow label="CTR" value={`${unified.totals.ctr.toFixed(2)}%`} bench={`${ctrBench.benchmark}%`} better={ctrBench.better} diff={ctrBench.diff} />
                <BenchRow label="ROAS" value={`${unified.totals.roas.toFixed(2)}x`} bench={`${roasBench.benchmark}x`} better={roasBench.better} diff={roasBench.diff} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="text-sm font-medium flex items-center gap-2"><Target className="h-3.5 w-3.5 text-primary" /> 7-day forecast</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <ForecastRow label="Reach" value={forecast.estimated_reach.toLocaleString()} />
                  <ForecastRow label="Clicks" value={forecast.estimated_clicks.toLocaleString()} />
                  <ForecastRow label="Conversions" value={forecast.estimated_conversions.toLocaleString()} />
                  <ForecastRow label="Revenue" value={`$${forecast.estimated_revenue.toLocaleString()}`} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Confidence</span>
                  <span className="font-medium text-foreground">{forecast.confidence}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms">
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={unified.byPlatform} dataKey="revenue" nameKey="platform" innerRadius={40} outerRadius={80}>
                        {unified.byPlatform.map((p) => (
                          <Cell key={p.platform} fill={PLATFORM_COLORS[p.platform] || '#94A3B8'} />
                        ))}
                      </Pie>
                      <RTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {unified.byPlatform.map((p) => (
                    <div key={p.platform} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="text-sm font-medium capitalize">{p.platform}</div>
                        <div className="text-xs text-muted-foreground">CTR {p.ctr.toFixed(2)}% • ROAS {p.roas.toFixed(2)}x</div>
                      </div>
                      <Badge variant={p.roas >= 3 ? 'default' : 'secondary'}>${p.revenue.toFixed(0)}</Badge>
                    </div>
                  ))}
                  {!unified.byPlatform.length && <p className="text-sm text-muted-foreground">No platform data yet. Sync to populate.</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creatives">
          <div className="space-y-2">
            {(creativesQ.data ?? []).map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.creative_name || c.creative_type || 'Creative'}</div>
                    <div className="text-xs text-muted-foreground">CTR {c.ctr.toFixed(2)}% • {c.conversions} conversions</div>
                  </div>
                  <Badge>{c.score}/100</Badge>
                </CardContent>
              </Card>
            ))}
            {!creativesQ.data?.length && <p className="text-sm text-muted-foreground">Creative performance appears after your first sync.</p>}
          </div>
        </TabsContent>

        <TabsContent value="audience">
          <Card>
            <CardContent className="p-4">
              {audienceQ.data?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={audienceQ.data.map((a) => ({ name: a.segment_value, revenue: Number(a.revenue), ctr: Number(a.ctr) }))}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <RTooltip />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Audience insights populate after external sync.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-3">
          {budgetShifts.length > 0 && (
            <Card className="border-primary/40">
              <CardContent className="p-4">
                <div className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" /> Budget optimizer
                </div>
                {budgetShifts.map((s, i) => (
                  <div key={i} className="text-sm text-muted-foreground">
                    Shift <span className="font-medium text-foreground">${s.amount}</span> from {s.from} → {s.to} (+{s.expectedLift}% expected)
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(recsQ.data ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.priority === 'high' ? 'default' : 'secondary'} className="text-[10px] capitalize">{r.priority}</Badge>
                      <span className="text-xs text-muted-foreground capitalize">{r.category}</span>
                    </div>
                    <h4 className="font-medium mt-1">{r.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                    {r.reasoning && <p className="text-xs text-muted-foreground mt-2 italic">Why: {r.reasoning}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className="text-sm font-semibold">{r.confidence}%</div>
                    <Progress value={r.confidence} className="h-1 w-16 mt-1" />
                  </div>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respond.mutate({ id: r.id, status: 'accepted' })}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respond.mutate({ id: r.id, status: 'rejected' })}>
                      <XCircle className="h-3.5 w-3.5 mr-1.5" /> Dismiss
                    </Button>
                  </div>
                )}
                {r.status !== 'pending' && (
                  <Badge variant="outline" className="capitalize">{r.status}</Badge>
                )}
              </CardContent>
            </Card>
          ))}

          {!recsQ.data?.length && !budgetShifts.length && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No insights yet. Click <span className="font-medium">Generate AI insights</span> above to analyze this campaign.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BenchRow({ label, value, bench, better, diff }: { label: string; value: string; bench: string; better: boolean; diff: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div>
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
      <div className="text-right">
        <div className="text-muted-foreground text-xs">Benchmark {bench}</div>
        <div className={`text-xs flex items-center gap-1 justify-end ${better ? 'text-emerald-600' : 'text-red-600'}`}>
          {better ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(diff)}% {better ? 'above' : 'below'}
        </div>
      </div>
    </div>
  );
}

function ForecastRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-semibold text-sm tabular-nums">{value}</div>
    </div>
  );
}
