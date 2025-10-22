import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Edit, Play, Pause, RefreshCw, Plus, AlertTriangle } from 'lucide-react';
import { usePauseCampaign, useResumeCampaign } from '@/hooks/useCampaignActions';
import { toast } from 'sonner';

const Campaigns = () => {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();

  const campaigns = state.campaigns || [];
  
  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.platform.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleEdit = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      actions.selectCampaign(campaign);
      navigate('/ad-editor', { 
        state: { 
          campaignId, 
          isEdit: true 
        } 
      });
    }
  };
  
  const handlePause = (campaignId: string) => {
    pauseMutation.mutate(campaignId);
  };

  const handleResume = (campaignId: string) => {
    resumeMutation.mutate(campaignId);
  };

  const handleMoreInfo = (campaignId: string) => {
    toast.info('Campaign Details', {
      description: 'Detailed analytics coming soon!'
    });
  };

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-4xl font-bold mb-2">No Campaigns Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Start your first campaign to see it tracked here.
        </p>
        <Button size="lg" onClick={() => navigate('/create')} className="text-lg">
          <Plus className="h-6 w-6 mr-2" /> Create Your First Ad
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns & Ads Management</h1>
          <p className="text-muted-foreground mt-1">View status and take action on your campaigns</p>
        </div>
        <Button size="lg" onClick={() => navigate('/create')} className="min-w-[200px]">
          <Plus className="h-5 w-5 mr-2" /> Create New Ad
        </Button>
      </div>

      {/* Simplified Search Bar */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by campaign name or platform..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              
              {/* Campaign Name and Status */}
              <div className="flex flex-col space-y-1 md:w-1/3 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <CardTitle className="text-lg font-semibold line-clamp-1">{campaign.name}</CardTitle>
                  {getStatusBadge(campaign.status)}
                </div>
                <p className="text-xs text-muted-foreground">{campaign.platform.join(', ')}</p>
              </div>

              <Separator className="block md:hidden" />

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4 text-center md:text-left md:w-1/3">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Spend</p>
                  <p className="font-semibold">${campaign.spent.toFixed(2)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Clicks</p>
                  <p className="font-semibold">{campaign.clicks?.toLocaleString() || 0}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">CPA</p>
                  <p className="font-semibold">
                    {campaign.cpa ? `$${campaign.cpa.toFixed(2)}` : '--'}
                  </p>
                </div>
              </div>
              
              <Separator className="block md:hidden" />

              {/* Action Buttons */}
              <div className="flex space-x-2 w-full md:w-auto justify-end">
                {campaign.status === 'active' ? (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handlePause(campaign.id)}
                    disabled={pauseMutation.isPending}
                  >
                    <Pause className="h-4 w-4 mr-1" /> Pause
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleResume(campaign.id)}
                    disabled={resumeMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-1" /> Resume
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(campaign.id)}
                  title="Edit Campaign"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleMoreInfo(campaign.id)}
                  title="More Info / Analytics"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredCampaigns.length === 0 && searchTerm.length > 0 && (
          <div className="text-center text-muted-foreground p-8">
            <p>No campaigns match "{searchTerm}".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;
