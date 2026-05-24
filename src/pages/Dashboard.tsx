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

const Dashboard = () => {
  const navigate = useNavigate();
  const { state } = useApp();

  const campaigns = state.campaigns || [];
  const hasCampaigns = campaigns.length > 0;

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
    <div className="page-container space-y-8">
      <Card className="surface-outline relative overflow-hidden rounded-[36px] border-border/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] shadow-soft">
        <div className="pointer-events-none absolute -left-10 top-8 h-28 w-28 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-4 h-36 w-36 rounded-full bg-amber-400/20 blur-3xl" />
        <CardContent className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:p-8">
          <div className="space-y-5">
            <Badge variant="outline" className="rounded-full border-border/80 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
              Ad operations workspace
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-5xl">Run daily campaign moves from one command center.</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-base">
                Resume drafts, duplicate what is winning, fix underperforming campaigns, and move straight into the next launch without bouncing between views.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5">
                <Clock3 className="h-3.5 w-3.5 text-sky-600" />
                Pick up active drafts faster
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5">
                <LayoutTemplate className="h-3.5 w-3.5 text-amber-600" />
                Reuse proven creative systems
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                Surface issues before they spread
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border-border/70 bg-background/85 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active campaigns</p>
                <p className="mt-2 text-2xl font-semibold">{activeCampaigns}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/85 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Drafts waiting</p>
                <p className="mt-2 text-2xl font-semibold">{draftCampaign ? 1 : 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/85 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Healthy ROAS</p>
                <p className="mt-2 text-2xl font-semibold">{profitableCampaigns}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/85 shadow-none">
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Next launch</p>
                  <p className="mt-2 text-lg font-semibold">Build a fresh campaign</p>
                </div>
                <Button size="sm" onClick={() => navigate('/create')} className="w-full rounded-2xl shadow-soft">
                  <Plus className="mr-2 h-4 w-4" /> Create New Ad
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {actionBoard.map((item) => (
          <Card key={item.title} className="surface-panel surface-outline rounded-[28px] transition-transform duration-200 hover:-translate-y-1 hover:shadow-soft">
            <CardHeader className="space-y-4 pb-3 text-left">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-gradient-primary p-3 text-white shadow-glow">
                  <item.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6">{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-left">
              <Button variant="outline" className="w-full rounded-2xl border-border/80" onClick={item.onClick}>
                {item.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Performance snapshot</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Read the account before you make the next move.</h2>
          </div>
        </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SimpleSummaryCard
          title="Total Spend (Today)"
          value={`$${totalSpent.toFixed(2)}`}
          icon={DollarSign}
          trend="Live performance tracking"
        />
        <SimpleSummaryCard
          title="ROAS (Last 7 Days)"
          value={avgROAS}
          icon={TrendingUp}
          trend={parseFloat(avgROAS) > 2 ? 'Performing well' : 'Room for improvement'}
          variant={parseFloat(avgROAS) > 2 ? 'success' : 'default'}
        />
        <SimpleSummaryCard
          title="Critical Alerts"
          value={criticalActions}
          icon={AlertTriangle}
          trend="Check recommendations below"
          variant={criticalActions > 0 ? 'warning' : 'default'}
        />
      </div>
      </div>

      <NextBestActionWidget />

      <Card className="surface-panel surface-outline rounded-[28px] bg-secondary/55">
        <CardContent className="flex flex-col gap-3 p-5 text-left md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Looking for detailed charts or full campaign operations?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open Campaigns to pause, resume, review performance, and continue drafts without breaking your flow.
            </p>
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
