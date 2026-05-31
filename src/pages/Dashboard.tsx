import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  CopyPlus,
  DollarSign,
  LayoutTemplate,
  Plus,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { NextBestActionWidget } from '@/components/dashboard/NextBestActionWidget';
import { SimpleSummaryCard } from '@/components/dashboard/SimpleSummaryCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { PlatformPerformance } from '@/components/dashboard/PlatformPerformance';
import { RecentCampaigns } from '@/components/dashboard/RecentCampaigns';
import { TopCampaignsWidget } from '@/components/dashboard/widgets/TopCampaignsWidget';
import { useState } from 'react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { state } = useApp();

  const campaigns = state.campaigns || [];
  const hasCampaigns = campaigns.length > 0;

  const [timeRange, setTimeRange] = useState('7');

  const platforms = Array.from(new Set(campaigns.map((c) => c.platform || 'Unknown'))).slice(0, 3).map((p, i) => ({
    platform: p,
    icon: [Clock3, LayoutTemplate, TrendingUp][i] || Clock3,
    color: ['text-sky-600', 'text-amber-600', 'text-emerald-600'][i] || 'text-sky-600',
    performance: Math.min(95, Math.max(20, Math.round((Math.random() * 50) + 50))),
    revenue: `$${Math.round(Math.random() * 10000)}`,
    ctr: `${(Math.random() * 3 + 0.5).toFixed(2)}%`,
  }));

  const recentCampaignsData = campaigns.slice(0, 6).map((c) => ({
    id: c.id || c.name,
    name: c.name,
    status: c.status || 'Active',
    platform: c.platform || 'Unknown',
    ctr: c.ctr ? `${c.ctr}%` : '1.2%',
    impressions: c.impressions ? String(c.impressions) : '0',
    budget: c.budget ? `$${c.budget.toLocaleString()}` : '$0',
    spent: c.spent ? `$${c.spent.toLocaleString()}` : '$0',
    thumbnail: c.adContent?.mediaUrl ? '🖼️' : '🎯',
  }));

  const totalSpent = campaigns.reduce((accumulator, campaign) => accumulator + campaign.spent, 0);
  const totalRevenue = campaigns.reduce((accumulator, campaign) => accumulator + (campaign.revenue || 0), 0);
  const avgROAS = totalSpent > 0 ? (totalRevenue / totalSpent).toFixed(2) : '0.00';
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length;
  const profitableCampaigns = campaigns.filter((campaign) => (campaign.roas || 0) >= 2).length;
  const draftCampaign = campaigns.find((campaign) => campaign.status === 'draft');
  const issueCampaigns = campaigns.filter(
    (campaign) => campaign.status === 'paused' || (campaign.status === 'active' && campaign.ctr < 2.2)
  );
  const bestPerformer = [...campaigns].sort((left, right) => {
    const leftScore = left.roas || left.revenue || left.ctr || 0;
    const rightScore = right.roas || right.revenue || right.ctr || 0;

    return rightScore - leftScore;
  })[0];
  const criticalActions = issueCampaigns.length;

  const createInitialDataFromCampaign = (campaign: (typeof campaigns)[number]) => ({
    product: campaign.adContent?.product || campaign.name,
    details: campaign.adContent?.details || `${campaign.name} campaign ready for refinement.`,
    websiteUrl: campaign.adContent?.websiteUrl || '',
    adType: campaign.adContent?.adType || 'image',
    platforms: campaign.adContent?.platforms || campaign.platform,
    audience: campaign.adContent?.audience || '',
    mediaUrl: campaign.adContent?.mediaUrl || '',
    mediaType: campaign.adContent?.mediaType || 'image',
    placementOptions: campaign.adContent?.placementOptions || {},
    simpleAudience: campaign.adContent?.simpleAudience || '',
    aiGenerated: campaign.adContent?.aiGenerated || false,
    aiMetadata: campaign.adContent?.aiMetadata,
  });

  const handleContinueDraft = () => {
    if (!draftCampaign) {
      navigate('/create');
      return;
    }

    navigate('/ad-editor', {
      state: {
        initialData: createInitialDataFromCampaign(draftCampaign),
        isScratch: !draftCampaign.adContent,
      },
    });
  };

  const handleDuplicateBestPerformer = () => {
    if (!bestPerformer) {
      navigate('/create');
      return;
    }

    navigate('/ad-editor', {
      state: {
        initialData: createInitialDataFromCampaign(bestPerformer),
        isTemplate: true,
      },
    });
  };

  const actionBoard = [
    {
      title: 'Continue Draft',
      description: draftCampaign
        ? `${draftCampaign.name} is waiting for a final review before launch.`
        : 'Start a new guided draft and pick up exactly where the workflow begins.',
      icon: Clock3,
      cta: draftCampaign ? 'Open Draft' : 'Start Draft',
      onClick: handleContinueDraft,
    },
    {
      title: 'Launch Recommended Template',
      description: 'Move straight into a proven layout built for your platform and goal.',
      icon: LayoutTemplate,
      cta: 'Browse Library',
      onClick: () => navigate('/template-library'),
    },
    {
      title: `Fix ${criticalActions || 0} Campaign Issue${criticalActions === 1 ? '' : 's'}`,
      description: criticalActions
        ? 'Review paused campaigns and low-performing creatives that need attention.'
        : 'Your campaigns are stable. Open operations view to check performance health.',
      icon: AlertTriangle,
      cta: 'Open Campaigns',
      onClick: () => navigate('/campaigns'),
    },
    {
      title: 'Duplicate Best Performer',
      description: bestPerformer
        ? `Use ${bestPerformer.name} as a head start for your next launch.`
        : 'Once campaigns are running, you will be able to clone your top performer here.',
      icon: CopyPlus,
      cta: bestPerformer ? 'Create Variation' : 'Create Ad',
      onClick: handleDuplicateBestPerformer,
    },
  ];

  if (!hasCampaigns) {
    return (
      <div className="page-container grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="surface-outline relative overflow-hidden rounded-[36px] border-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.22),_transparent_34%),linear-gradient(135deg,rgba(17,24,39,0.96),rgba(37,99,235,0.88))] text-primary-foreground shadow-soft">
          <CardContent className="flex min-h-[420px] flex-col justify-between p-8 text-left md:p-10">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white">
                <Wand2 className="h-4 w-4" />
                Ad command room
              </div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Build your first campaign system without leaving the workspace.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-white/72">
                Start with AI, move into a launch-ready template, and keep campaign operations in the same environment once ads go live.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/75">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  AI brief to draft
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Template-led creative setup
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Campaign ops when ready
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="h-12 rounded-2xl bg-white px-6 text-primary-800 hover:bg-white/92" onClick={() => navigate('/create')}>
                <Plus className="h-5 w-5" />
                Create Ad
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-2xl border-white/30 px-6 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('/template-library')}>
                <LayoutTemplate className="h-5 w-5" />
                Browse Templates
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {actionBoard.map((item) => (
            <Card key={item.title} className="surface-panel surface-outline rounded-[28px]">
              <CardContent className="flex items-start gap-4 p-5 text-left">
                <div className="rounded-2xl bg-gradient-primary p-3 text-white shadow-glow">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  <Button variant="link" className="mt-2 h-auto px-0 text-sm" onClick={item.onClick}>
                    {item.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Top hero + KPI row */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="surface-outline relative overflow-hidden rounded-[28px] shadow-soft">
          <CardContent className="p-6">
            <Badge variant="outline" className="mb-3 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
              Ad operations workspace
            </Badge>
            <h1 className="text-2xl font-semibold lg:text-4xl">Run daily campaign moves from one command center.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Resume drafts, duplicate winners, and act on recommendations without leaving the workspace.</p>

            {/* KPI row: Total Spend, Conversions, Reach, Avg CTR, Avg ROAS */}
            {(() => {
              const totalConversions = campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);
              const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
              const avgCtrVal = campaigns.length
                ? campaigns.reduce((acc, c) => {
                    const raw = c.ctr;
                    const num = typeof raw === 'number' ? raw : (typeof raw === 'string' ? parseFloat(String(raw).replace('%', '')) || 0 : 0);
                    return acc + num;
                  }, 0) / campaigns.length
                : 0;
              const avgCtr = `${avgCtrVal.toFixed(2)}%`;

              return (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  <SimpleSummaryCard title="Total spend" value={`$${totalSpent.toLocaleString()}`} icon={DollarSign} />
                  <SimpleSummaryCard title="Conversions" value={`${totalConversions.toLocaleString()}`} icon={CopyPlus} />
                  <SimpleSummaryCard title="Reach" value={`${totalImpressions.toLocaleString()}`} icon={LayoutTemplate} />
                  <SimpleSummaryCard title="Avg CTR" value={avgCtr} icon={Clock3} />
                  <SimpleSummaryCard title="Avg ROAS" value={`${avgROAS}`} icon={TrendingUp} />
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="surface-panel surface-outline rounded-[20px]">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Next launch</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Build a fresh campaign</p>
                  <p className="text-sm text-muted-foreground">Guided steps to launch faster.</p>
                </div>
                <Button size="sm" onClick={() => navigate('/create')} className="rounded-2xl">
                  <Plus className="mr-2 h-4 w-4" /> Create
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel surface-outline rounded-[20px]">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Account health</p>
              <p className="mt-2 text-2xl font-semibold">ROAS {avgROAS}</p>
              <p className="mt-1 text-sm text-muted-foreground">{criticalActions} issues flagged</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main grid: Performance chart + right column widgets */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="surface-panel surface-outline rounded-[28px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Performance snapshot</p>
                <h2 className="mt-1 text-xl font-semibold">Read the account before you make the next move.</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">Last 7 days</Button>
                <Button variant="ghost" size="sm">Last 30 days</Button>
              </div>
            </div>
          </CardHeader>
            <CardContent>
            <PerformanceChart timeRange={timeRange} onTimeRangeChange={setTimeRange} campaigns={campaigns} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <TopCampaignsWidget />
          <PlatformPerformance platforms={platforms} />
        </div>
      </div>

      {/* Lower row: Recent campaigns + recommendations */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="surface-panel surface-outline rounded-[28px]">
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Campaigns</h3>
            </CardHeader>
            <CardContent>
              <RecentCampaigns campaigns={recentCampaignsData} />
            </CardContent>
          </Card>
        </div>

        <div>
          <NextBestActionWidget />
        </div>
      </div>

      <Card className="surface-panel surface-outline rounded-[20px]">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold">Looking for detailed charts or full campaign operations?</p>
            <p className="text-sm text-muted-foreground">Open Campaigns to pause, resume, and review performance in depth.</p>
          </div>
          <Button variant="link" onClick={() => navigate('/campaigns')} className="px-0">
            Open Campaigns
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
