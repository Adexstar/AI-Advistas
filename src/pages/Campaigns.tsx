import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { BulkActions } from '@/components/BulkActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Copy, Download, Edit, Pause, Play, Plus, Search, Trash2 } from 'lucide-react';
import { usePauseCampaign, useResumeCampaign } from '@/hooks/useCampaignActions';
import { toast } from 'sonner';

const statusFilters = ['all', 'active', 'paused', 'draft', 'completed'] as const;

const Campaigns = () => {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('all');
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);

  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();

  const campaigns = state.campaigns || [];

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => {
        const matchesSearch =
          campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          campaign.platform.some((platform) => platform.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [campaigns, searchTerm, statusFilter]
  );

  useEffect(() => {
    setSelectedCampaignIds((currentIds) =>
      currentIds.filter((id) => filteredCampaigns.some((campaign) => campaign.id === id))
    );
  }, [filteredCampaigns]);

  const activeCount = campaigns.filter((campaign) => campaign.status === 'active').length;
  const attentionCount = campaigns.filter((campaign) => campaign.status === 'paused' || campaign.status === 'draft').length;
  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);

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

  const handleDuplicate = (campaignId: string) => {
    actions.duplicateCampaigns([campaignId]);
  };

  const exportCampaigns = (campaignIds: string[]) => {
    const campaignsToExport = campaigns.filter((campaign) => campaignIds.includes(campaign.id));

    if (campaignsToExport.length === 0) {
      toast.info('No campaigns selected', {
        description: 'Select at least one campaign to export.',
      });
      return;
    }

    const blob = new Blob([JSON.stringify(campaignsToExport, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaigns-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success('Campaign export ready', {
      description: `${campaignsToExport.length} campaign${campaignsToExport.length === 1 ? '' : 's'} exported.`,
    });
  };

  const handleBulkAction = (action: string, campaignIds: string[], payload?: { status?: string }) => {
    switch (action) {
      case 'activate':
        actions.bulkUpdateCampaigns(campaignIds, { status: 'active' });
        break;
      case 'pause':
        actions.bulkUpdateCampaigns(campaignIds, { status: 'paused' });
        break;
      case 'duplicate':
        actions.duplicateCampaigns(campaignIds);
        break;
      case 'delete':
        actions.bulkDeleteCampaigns(campaignIds);
        break;
      case 'export':
        exportCampaigns(campaignIds);
        break;
      case 'changeStatus':
        if (payload?.status) {
          actions.bulkUpdateCampaigns(campaignIds, {
            status: payload.status as 'active' | 'paused' | 'draft' | 'completed',
          });
        }
        break;
      default:
        toast.info('Action unavailable', {
          description: 'This campaign action is not configured yet.',
        });
    }
  };

  const toggleCampaignSelection = (campaignId: string, checked: boolean) => {
    setSelectedCampaignIds((currentIds) =>
      checked ? [...new Set([...currentIds, campaignId])] : currentIds.filter((id) => id !== campaignId)
    );
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
    <div className="page-container space-y-6 py-4 md:py-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Campaigns & Ads Management</h1>
          <p className="text-muted-foreground mt-1">View status and take action on your campaigns</p>
        </div>
        <Button size="lg" onClick={() => navigate('/create')} className="w-full sm:w-auto sm:min-w-[200px]">
          <Plus className="h-5 w-5 mr-2" /> Create New Ad
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription>Live campaigns</CardDescription>
            <CardTitle className="text-3xl">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Campaigns currently running across your connected channels.
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription>Needs attention</CardDescription>
            <CardTitle className="text-3xl">{attentionCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Draft or paused campaigns ready for revision or activation.
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription>Managed budget</CardDescription>
            <CardTitle className="text-3xl">${totalBudget.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Total allocated budget across every campaign in this workspace.
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-lg flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search by campaign name or platform..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <Button
              key={status}
              type="button"
              variant={statusFilter === status ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <BulkActions
        items={filteredCampaigns}
        selectedItems={selectedCampaignIds}
        onSelectionChange={setSelectedCampaignIds}
        onBulkAction={handleBulkAction}
        itemType="campaigns"
        quickStatusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'Paused' },
          { value: 'draft', label: 'Draft' },
          { value: 'completed', label: 'Completed' },
        ]}
        actions={[
          {
            id: 'activate',
            label: 'Activate',
            icon: <Play className="h-4 w-4" />,
          },
          {
            id: 'pause',
            label: 'Pause',
            icon: <Pause className="h-4 w-4" />,
            variant: 'outline',
          },
          {
            id: 'duplicate',
            label: 'Duplicate',
            icon: <Copy className="h-4 w-4" />,
            variant: 'outline',
          },
          {
            id: 'export',
            label: 'Export',
            icon: <Download className="h-4 w-4" />,
            variant: 'outline',
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive',
            requiresConfirmation: true,
            confirmationMessage: 'Delete the selected campaigns and their ads? This action cannot be undone.',
          },
        ]}
      />

      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Checkbox
                  checked={selectedCampaignIds.includes(campaign.id)}
                  onCheckedChange={(checked) => toggleCampaignSelection(campaign.id, checked === true)}
                  aria-label={`Select ${campaign.name}`}
                  className="mt-1"
                />
                <div className="flex min-w-0 flex-col space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CardTitle className="min-w-0 text-lg font-semibold leading-tight break-words">{campaign.name}</CardTitle>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{campaign.platform.join(', ')}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {campaign.runContinuously
                      ? `Starts ${campaign.startDate} • Runs continuously`
                      : `Runs ${campaign.startDate} to ${campaign.endDate}`}
                  </p>
                </div>
              </div>

              <Separator className="block md:hidden" />

              <div className="grid w-full grid-cols-2 gap-4 text-center md:w-auto md:min-w-[360px] md:grid-cols-4 md:text-left">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-semibold">
                    ${campaign.budget.toLocaleString()}
                    <span className="ml-1 text-xs font-medium text-muted-foreground">
                      / {campaign.budgetPeriod || 'total'}
                    </span>
                  </p>
                </div>
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

              <div className="flex w-full flex-wrap justify-end gap-2 md:w-auto md:flex-nowrap">
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
                  onClick={() => handleDuplicate(campaign.id)}
                  title="Duplicate Campaign"
                >
                  <Copy className="h-4 w-4 mr-1" /> Duplicate
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(campaign.id)}
                  title="Edit Campaign"
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredCampaigns.length === 0 && (searchTerm.length > 0 || statusFilter !== 'all') && (
          <div className="text-center text-muted-foreground p-8">
            <p>No campaigns match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;
