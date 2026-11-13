import { useApp } from '@/contexts/AppContext';

export const TopCampaignsWidget = () => {
  const { state } = useApp();

  const topCampaigns = state.campaigns
    .slice(0, 3)
    .map(campaign => ({
      name: campaign.name,
      spend: `$${campaign.budget.toLocaleString()}`,
      performance: campaign.status || 'No results yet'
    }));

  if (topCampaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No campaigns yet
      </div>
    );
  }

  return (
    <div className="space-y-2 h-full overflow-auto">
      {topCampaigns.map((campaign, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{campaign.name}</div>
            <div className="text-xs text-muted-foreground">{campaign.spend}</div>
          </div>
          <div className="text-sm text-muted-foreground">{campaign.performance}</div>
        </div>
      ))}
    </div>
  );
};