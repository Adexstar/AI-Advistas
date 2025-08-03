import { useState } from "react";
import { motion } from "framer-motion";
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
  DollarSign
} from "lucide-react";

const Campaigns = () => {
  const [campaigns] = useState([
    {
      id: 1,
      name: "Summer Sale Campaign",
      status: "Active",
      platform: "Facebook, Instagram",
      budget: "$500",
      spent: "$342",
      impressions: "45.2K",
      clicks: "1.2K",
      ctr: "2.8%",
      startDate: "2024-01-15",
      endDate: "2024-02-15"
    },
    {
      id: 2,
      name: "Product Launch",
      status: "Paused",
      platform: "Google Ads",
      budget: "$1000",
      spent: "$756",
      impressions: "28.7K",
      clicks: "890",
      ctr: "3.1%",
      startDate: "2024-01-10",
      endDate: "2024-01-25"
    },
    {
      id: 3,
      name: "Brand Awareness",
      status: "Draft",
      platform: "LinkedIn",
      budget: "$300",
      spent: "$0",
      impressions: "0",
      clicks: "0",
      ctr: "0%",
      startDate: "2024-02-01",
      endDate: "2024-02-28"
    }
  ]);

  const [ads] = useState([
    {
      id: 1,
      name: "Summer Collection Ad",
      campaign: "Summer Sale Campaign",
      status: "Active",
      format: "Single Image",
      impressions: "12.3K",
      clicks: "340",
      ctr: "2.8%"
    },
    {
      id: 2,
      name: "New Product Showcase",
      campaign: "Product Launch",
      status: "Active",
      format: "Carousel",
      impressions: "8.7K",
      clicks: "267",
      ctr: "3.1%"
    },
    {
      id: 3,
      name: "Brand Story Video",
      campaign: "Brand Awareness",
      status: "Draft",
      format: "Video",
      impressions: "0",
      clicks: "0",
      ctr: "0%"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-700";
      case "Paused": return "bg-yellow-100 text-yellow-700";
      case "Draft": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Manage your advertising campaigns and ads</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

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
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.platform}</TableCell>
                  <TableCell>{campaign.budget}</TableCell>
                  <TableCell>{campaign.spent}</TableCell>
                  <TableCell>{campaign.impressions}</TableCell>
                  <TableCell>{campaign.ctr}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        {campaign.status === "Active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon">
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
              {ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium">{ad.name}</TableCell>
                  <TableCell>{ad.campaign}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ad.status)}>
                      {ad.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{ad.format}</TableCell>
                  <TableCell>{ad.impressions}</TableCell>
                  <TableCell>{ad.clicks}</TableCell>
                  <TableCell>{ad.ctr}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        {ad.status === "Active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Campaigns;