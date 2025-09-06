import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Campaign {
  id: string | number;
  name: string;
  status: string;
  platform: string;
  ctr: string;
  impressions: string;
  budget: string;
  spent: string;
  thumbnail: string;
}

interface RecentCampaignsProps {
  campaigns: Campaign[];
  onCampaignClick?: (campaign: any) => void;
  onToggleStatus?: (campaignId: string) => void;
}

export const RecentCampaigns = ({ campaigns, onCampaignClick, onToggleStatus }: RecentCampaignsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Campaigns</CardTitle>
        <CardDescription>Your latest advertising campaigns with performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer border border-border/50"
              onClick={() => onCampaignClick?.(campaign)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{campaign.thumbnail}</div>
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <p className="text-sm text-muted-foreground">{campaign.platform}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">CTR: {campaign.ctr}</span>
                      <span className="text-xs text-muted-foreground">{campaign.impressions} impressions</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={campaign.status === 'Active' ? 'default' : campaign.status === 'Paused' ? 'secondary' : 'outline'}
                    className="mb-2"
                  >
                    {campaign.status}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    <p>Budget: {campaign.budget}</p>
                    <p>Spent: {campaign.spent}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};