import { useState, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateCampaign, useDuplicateCampaign, useDeleteCampaign, type CampaignRow } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignHealthDashboard } from '@/components/campaigns/CampaignHealthDashboard';
import { CampaignAIBrain } from '@/components/campaigns/CampaignAIBrain';
import { CampaignTimeline } from '@/components/campaigns/CampaignTimeline';
import { CampaignRecommendations } from '@/components/campaigns/CampaignRecommendations';
import { CampaignVersionsTab } from '@/components/campaigns/CampaignVersionsTab';
import { CampaignFilesTab } from '@/components/campaigns/CampaignFilesTab';
import { CampaignCreativesTab } from '@/components/campaigns/CampaignCreativesTab';
import { useContextOverride } from '@/contexts/AIContext';
import { CampaignNotesTab } from '@/components/campaigns/CampaignNotesTab';
import { CampaignAutomationRules } from '@/components/campaigns/CampaignAutomationRules';
import { CampaignPublishingTab } from '@/components/campaigns/CampaignPublishingTab';
import { CampaignAnalyticsTab } from '@/components/campaigns/CampaignAnalyticsTab';
import { CampaignHealthService } from '@/services/campaign/CampaignHealthService';
import { CampaignVersionService } from '@/services/campaign/CampaignVersionService';
import { CampaignEventService } from '@/services/campaign/CampaignEventService';
import { useToast } from '@/hooks/use-toast';
import { createAdPath, isDraftStatus, isPausedStatus, isRunningStatus, pauseResumePatch } from '@/lib/campaignStatus';
import {
  ArrowLeft, MoreHorizontal, Edit3, Copy, PauseCircle, PlayCircle,
  Archive, Trash2, BarChart3, LayoutTemplate, Users, Wallet, Send,
  ChartLine, Sparkles, GitBranch, FileText, StickyNote, Clock,
  TrendingUp, DollarSign, Target, Eye, RotateCcw,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: '#9CA3AF', planning: '#9CA3AF', creative_ready: '#F47B35',
  publishing: '#3B82F6', active: '#22C55E', running: '#22C55E', paused: '#F59E0B', optimizing: '#F59E0B',
  completed: '#3B82F6', archived: '#6B7280',
};

const CAMPAIGN_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'creatives', label: 'Creatives', icon: LayoutTemplate },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'publishing', label: 'Publishing', icon: Send },
  { id: 'analytics', label: 'Analytics', icon: ChartLine },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { id: 'versions', label: 'Versions', icon: GitBranch },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'history', label: 'History', icon: Clock },
] as const;

const CampaignWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateCampaign = useUpdateCampaign();
  const duplicateCampaign = useDuplicateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: rawCampaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Campaign not specified');
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single();
      if (error) throw error;
      return data as any;
    },
  });
  const campaign = rawCampaign as any;
  useContextOverride(campaign ? { source: 'campaign', label: campaign.name, patch: { current_campaign_id: campaign.id, current_goal: campaign.objective } } : null);

  const health = useMemo(() => {
    if (!campaign) return { overall: 0, creative_quality: 0, audience_match: 0, budget_efficiency: 0, optimization_level: 0 };
    return CampaignHealthService.calculate(campaign);
  }, [campaign]);

  const handlePauseResume = () => {
    if (!campaign) return;
    const patch = pauseResumePatch(campaign.status, campaign.settings);
    updateCampaign.mutate(
      { id: campaign.id, updates: patch },
      { onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign', campaign.id] }) },
    );
  };

  const handleArchive = () => {
    if (!campaign) return;
    updateCampaign.mutate(
      { id: campaign.id, updates: { archived: true, status: 'archived' } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign', campaign.id] }) },
    );
  };

  const handleUnarchive = () => {
    if (!campaign) return;
    updateCampaign.mutate(
      { id: campaign.id, updates: { archived: false, status: 'draft' } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign', campaign.id] }) },
    );
  };

  const handleDelete = () => {
    if (!campaign) return;
    if (!confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
    deleteCampaign.mutate(campaign, { onSuccess: () => navigate('/campaigns') });
  };

  const handleCreateVersion = async () => {
    if (!campaign || !user) return;
    try {
      await CampaignVersionService.create(campaign.id, user.id, 'Manual save', 'Saved from workspace');
      qc.invalidateQueries({ queryKey: ['campaign-versions', campaign.id] });
      toast({ title: 'Version saved' });
    } catch {
      toast({ title: 'Failed to save version', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container py-6 lg:py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="text-xl font-bold">Campaign not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This campaign doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/campaigns')} className="mt-4">Back to Campaigns</Button>
      </div>
    );
  }

  if (isDraftStatus(campaign.status)) {
    return <Navigate to={createAdPath(campaign.id)} replace />;
  }

  const statusColor = STATUS_COLORS[campaign.status] || '#9CA3AF';
  const budgetUtilization = campaign.budget > 0 ? Math.round((campaign.spend / campaign.budget) * 100) : 0;

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="page-container py-6 lg:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')} className="mt-1 h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="min-w-0 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">{campaign.name}</h1>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize"
                  style={{ background: `${statusColor}18`, color: statusColor }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: statusColor }} />
                  {campaign.status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1"><Target className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{campaign.objective || 'No objective'}</span></span>
                <span className="flex min-w-0 items-center gap-1"><LayoutTemplate className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{campaign.platform || 'No platform'}</span></span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={handleCreateVersion}>
              <RotateCcw className="h-3.5 w-3.5" /> Save Version
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => duplicateCampaign.mutate(campaign)}>
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
            {isRunningStatus(campaign.status) ? (
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={handlePauseResume}>
                <PauseCircle className="h-3.5 w-3.5" /> Pause
              </Button>
            ) : isPausedStatus(campaign.status) ? (
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={handlePauseResume}>
                <PlayCircle className="h-3.5 w-3.5" /> Resume
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {campaign.archived ? (
                  <DropdownMenuItem onClick={handleUnarchive}><Archive className="mr-2 h-4 w-4" /> Unarchive</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleArchive}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard icon={DollarSign} label="Budget" value={`$${campaign.budget?.toLocaleString() || '0'}`} />
          <MetricCard icon={TrendingUp} label="Spend" value={`$${campaign.spend?.toLocaleString() || '0'}`} sub={`${budgetUtilization}% used`} />
          <MetricCard icon={Eye} label="CTR" value={`${(campaign.ctr || 0).toFixed(1)}%`} />
          <MetricCard icon={BarChart3} label="ROAS" value={`${(campaign.roas || 0).toFixed(1)}x`} />
          <MetricCard icon={Target} label="Conversions" value={(campaign.conversions || 0).toLocaleString()} />
          <MetricCard icon={Sparkles} label="Health" value={`${health.overall}%`} sub="From campaign health" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0 space-y-6">
          <div className="tabs-scroll-shell sticky top-0 z-10 -mx-4 w-[calc(100%+2rem)] bg-background/95 px-4 py-2 shadow-sm backdrop-blur">
            <TabsList className="tabs-scroll-list inline-flex h-auto gap-1 rounded-xl border bg-card p-1">
              {CAMPAIGN_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            <CampaignHealthDashboard health={health} />
            <CampaignAIBrain campaign={campaign} />
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickMetric label="Reach" value={(campaign.reach || 0).toLocaleString()} />
              <QuickMetric label="Impressions" value={(campaign.impressions || 0).toLocaleString()} />
              <QuickMetric label="Clicks" value={(campaign.clicks || 0).toLocaleString()} />
              <QuickMetric label="Revenue" value={`$${(campaign.revenue || 0).toLocaleString()}`} />
            </section>
            <section>
              <h3 className="text-lg font-bold mb-4">Campaign Timeline</h3>
              <CampaignTimeline campaignId={campaign.id} limit={5} />
            </section>
          </TabsContent>

          {/* CREATIVES */}
          <TabsContent value="creatives" className="space-y-6 mt-0">
            <CampaignCreativesTab campaignId={campaign.id} />
          </TabsContent>

          {/* AUDIENCE */}
          <TabsContent value="audience" className="space-y-6 mt-0">
            <section>
              <h3 className="text-lg font-bold mb-1">Target Audience</h3>
              <p className="text-sm text-muted-foreground mb-4">Define who your campaign reaches.</p>
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  {(campaign as any).target_audience && Object.keys((campaign as any).target_audience || {}).length > 0 ? (
                    <pre className="text-sm">{JSON.stringify((campaign as any).target_audience, null, 2)}</pre>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-3 font-semibold">No audience defined</p>
                      <p className="text-sm text-muted-foreground">Set targeting criteria for your campaign.</p>
                      <Button variant="outline" className="mt-4 rounded-xl">Define Audience</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* BUDGET */}
          <TabsContent value="budget" className="space-y-6 mt-0">
            <section>
              <h3 className="text-lg font-bold mb-4">Budget Overview</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="rounded-2xl">
                  <CardContent className="p-5 space-y-2">
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-3xl font-bold">${campaign.budget?.toLocaleString() || '0'}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardContent className="p-5 space-y-2">
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className="text-3xl font-bold">${campaign.spend?.toLocaleString() || '0'}</p>
                    <Progress value={budgetUtilization} className="h-2" />
                    <p className="text-xs text-muted-foreground">{budgetUtilization}% of budget used</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardContent className="p-5 space-y-2">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-3xl font-bold">${((campaign.budget || 0) - (campaign.spend || 0)).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.end_date ? `Until ${new Date(campaign.end_date).toLocaleDateString()}` : 'No end date'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
            <section>
              <h3 className="text-lg font-bold mb-4">Automation Rules</h3>
              <CampaignAutomationRules campaignId={campaign.id} />
            </section>
          </TabsContent>

          {/* PUBLISHING */}
          <TabsContent value="publishing" className="space-y-6 mt-0">
            <section>
              <h3 className="text-lg font-bold mb-1">Publishing & Distribution</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose platforms and schedule. AdVista's Publishing Engine validates, dispatches, and tracks every job.
              </p>
              <CampaignPublishingTab campaign={campaign} />
            </section>
          </TabsContent>

          {/* ANALYTICS */}
          <TabsContent value="analytics" className="space-y-6 mt-0">
            <CampaignAnalyticsTab campaignId={campaign.id} campaign={campaign as any} />
          </TabsContent>

          {/* AI ASSISTANT */}
          <TabsContent value="ai-assistant" className="space-y-6 mt-0">
            <section>
              <h3 className="text-lg font-bold mb-1">AI Recommendations</h3>
              <p className="text-sm text-muted-foreground mb-4">Continuous evaluation of your campaign performance.</p>
              <CampaignRecommendations campaignId={campaign.id} />
            </section>
          </TabsContent>

          {/* VERSIONS */}
          <TabsContent value="versions" className="space-y-6 mt-0">
            <CampaignVersionsTab campaignId={campaign.id} />
          </TabsContent>

          {/* FILES */}
          <TabsContent value="files" className="space-y-6 mt-0">
            <CampaignFilesTab campaignId={campaign.id} />
          </TabsContent>

          {/* NOTES */}
          <TabsContent value="notes" className="space-y-6 mt-0">
            <CampaignNotesTab campaignId={campaign.id} initialNotes={(campaign as any).notes} />
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history" className="space-y-6 mt-0">
            <section>
              <h3 className="text-lg font-bold mb-1">Campaign Timeline</h3>
              <p className="text-sm text-muted-foreground mb-4">Every event recorded since creation.</p>
              <CampaignTimeline campaignId={campaign.id} />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) => (
  <Card className="min-w-0 rounded-2xl border border-border/60">
    <CardContent className="p-3 sm:p-4">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{label}</span></div>
      <p className="break-words text-base font-bold tabular-nums sm:text-xl">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);

const QuickMetric = ({ label, value }: { label: string; value: string }) => (
  <Card className="min-w-0 rounded-2xl border border-border/60">
    <CardContent className="p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-base font-bold tabular-nums sm:text-xl">{value}</p>
    </CardContent>
  </Card>
);

export default CampaignWorkspace;
