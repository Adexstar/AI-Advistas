import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  BarChart3,
  Calendar,
  DollarSign,
  Filter
} from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { BulkActions } from "@/components/BulkActions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { toast } from "@/hooks/use-toast";

const Campaigns = () => {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [selectedTab, setSelectedTab] = useState("campaigns");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'n',
        ctrlKey: true,
        metaKey: true,
        action: () => {
          handleCreateCampaign();
        },
        description: 'Create new campaign',
        category: 'Creation'
      },
      {
        key: 'a',
        ctrlKey: true,
        metaKey: true,
        action: () => {
          if (selectedTab === "campaigns") {
            setSelectedCampaigns(filteredCampaigns.map(c => c.id));
          } else {
            setSelectedAds(filteredAds.map(a => a.id));
          }
        },
        description: 'Select all items',
        category: 'Selection'
      }
    ]
  });

  // Filter data based on search query and filters
  const filteredCampaigns = state.campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.platform.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilters = Object.entries(activeFilters).every(([filterKey, values]) => {
      if (values.length === 0) return true;
      if (filterKey === 'status') return values.includes(campaign.status);
      if (filterKey === 'platform') return campaign.platform.some(p => values.includes(p));
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  const filteredAds = state.ads.filter(ad => {
    const campaign = state.campaigns.find(c => c.id === ad.campaignId);
    const matchesSearch = ad.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilters = Object.entries(activeFilters).every(([filterKey, values]) => {
      if (values.length === 0) return true;
      if (filterKey === 'status') return values.includes(ad.status);
      if (filterKey === 'format') return values.includes(ad.format);
      return true;
    });

    return matchesSearch && matchesFilters;
  });


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-700";
      case "paused": return "bg-yellow-100 text-yellow-700";
      case "draft": return "bg-gray-100 text-gray-700";
      case "completed": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const handleCreateCampaign = () => {
    navigate('/create-ad');
  };

  const handleBulkAction = (action: string, itemIds: string[], payload?: any) => {
    if (selectedTab === "campaigns") {
      itemIds.forEach(id => {
        switch (action) {
          case 'activate':
          case 'pause':
            actions.toggleCampaignStatus(id);
            break;
          case 'delete':
            actions.deleteCampaign(id);
            break;
          case 'changeStatus':
            // Update campaign status with payload.status
            break;
        }
      });
    } else {
      itemIds.forEach(id => {
        switch (action) {
          case 'activate':
          case 'pause':
            actions.toggleAdStatus(id);
            break;
          case 'delete':
            actions.deleteAd(id);
            break;
        }
      });
    }
    
    toast({
      title: "Bulk Action Complete",
      description: `${action} applied to ${itemIds.length} ${selectedTab}.`,
    });
  };

  // Search and filter options
  const searchFilters = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'draft', label: 'Draft' },
        { value: 'completed', label: 'Completed' },
      ]
    },
    {
      id: 'platform',
      label: 'Platform',
      options: [
        { value: 'Facebook', label: 'Facebook' },
        { value: 'Instagram', label: 'Instagram' },
        { value: 'Google', label: 'Google' },
        { value: 'Twitter', label: 'Twitter' },
        { value: 'LinkedIn', label: 'LinkedIn' },
      ]
    },
    ...(selectedTab === "ads" ? [{
      id: 'format',
      label: 'Format',
      options: [
        { value: 'image', label: 'Image' },
        { value: 'video', label: 'Video' },
        { value: 'carousel', label: 'Carousel' },
      ]
    }] : [])
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Manage your advertising campaigns and ads</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateCampaign}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Search and Filters */}
      <SearchBar
        onSearch={(query, filters) => {
          setSearchQuery(query);
          setActiveFilters(filters);
        }}
        placeholder={`Search ${selectedTab}...`}
        filters={searchFilters}
        className="mb-6"
      />

      {/* Bulk Actions for Campaigns */}
      {selectedTab === "campaigns" && (
        <BulkActions
          items={filteredCampaigns}
          selectedItems={selectedCampaigns}
          onSelectionChange={setSelectedCampaigns}
          onBulkAction={handleBulkAction}
          itemType="campaigns"
        />
      )}

      {/* Bulk Actions for Ads */}
      {selectedTab === "ads" && (
        <BulkActions
          items={filteredAds}
          selectedItems={selectedAds}
          onSelectionChange={setSelectedAds}
          onBulkAction={handleBulkAction}
          itemType="ads"
        />
      )}

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.platform.join(", ")}</TableCell>
                  <TableCell>${campaign.budget.toLocaleString()}</TableCell>
                  <TableCell>${campaign.spent.toLocaleString()}</TableCell>
                  <TableCell>{(campaign.impressions / 1000).toFixed(1)}K</TableCell>
                  <TableCell>{campaign.ctr}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => actions.toggleCampaignStatus(campaign.id)}
                      >
                        {campaign.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          actions.selectCampaign(campaign);
                          navigate('/create-ad');
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Advertisement Library</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Name</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => {
                const campaign = state.campaigns.find(c => c.id === ad.campaignId);
                return (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.name}</TableCell>
                    <TableCell>{campaign?.name || 'Unknown Campaign'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ad.status)}>
                        {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{ad.format.charAt(0).toUpperCase() + ad.format.slice(1)}</TableCell>
                    <TableCell>{(ad.impressions / 1000).toFixed(1)}K</TableCell>
                    <TableCell>{ad.clicks}</TableCell>
                    <TableCell>{ad.ctr}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => actions.toggleAdStatus(ad.id)}
                        >
                          {ad.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            actions.selectAd(ad);
                            navigate('/create-ad');
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Campaigns;