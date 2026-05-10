import { Button } from '@/components/ui/button';
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
        <Card className="surface-outline overflow-hidden rounded-[32px] border-0 bg-gradient-hero text-primary-foreground shadow-soft">
          <CardContent className="flex min-h-[420px] flex-col justify-between p-8 text-left md:p-10">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white">
                <Wand2 className="h-4 w-4" />
                Workspace ready
              </div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Build your first ad in one guided workflow.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-white/72">
                Start from AI, pick a template, or build from scratch. The app will keep the next step obvious the whole way through.
              </p>
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
      <div className="surface-panel surface-outline flex flex-col gap-4 rounded-[32px] p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Home</p>
          <h1 className="text-3xl font-semibold tracking-tight">Command Center</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Work from the next best move, not from a maze of pages. Resume what is open, fix what is underperforming, and launch the next ad fast.
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/create')} className="w-full rounded-2xl shadow-soft sm:w-auto sm:min-w-[200px]">
          <Plus className="h-5 w-5 mr-2" /> Create New Ad
        </Button>
      </div>

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
