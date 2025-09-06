import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface PerformanceChartProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  campaigns?: Array<{
    impressions: number;
    clicks: number;
    spent: number;
  }>;
}

export const PerformanceChart = ({ timeRange, onTimeRangeChange, campaigns = [] }: PerformanceChartProps) => {
  // Calculate real totals from campaigns
  const totalImpressions = campaigns.reduce((acc, campaign) => acc + campaign.impressions, 0);
  const totalClicks = campaigns.reduce((acc, campaign) => acc + campaign.clicks, 0);
  const totalRevenue = campaigns.reduce((acc, campaign) => acc + campaign.spent, 0);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Campaign performance across time periods</CardDescription>
          </div>
          <div className="flex gap-2">
            {["7", "30", "90"].map((days) => (
              <Button
                key={days}
                variant={timeRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => onTimeRangeChange(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/20">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-primary/60 mx-auto mb-2" />
            <p className="text-muted-foreground">Interactive performance chart</p>
            <p className="text-sm text-muted-foreground">Impressions, Clicks, Revenue trends</p>
          </div>
        </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {totalImpressions > 0 ? `${(totalImpressions / 1000).toFixed(1)}K` : '0'}
                </p>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {totalClicks > 0 ? `${(totalClicks / 1000).toFixed(1)}K` : '0'}
                </p>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
            </div>
      </CardContent>
    </Card>
  );
};