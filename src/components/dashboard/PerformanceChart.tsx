import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface PerformanceChartProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export const PerformanceChart = ({ timeRange, onTimeRangeChange }: PerformanceChartProps) => {
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
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Impressions</p>
            <p className="text-xl font-bold">2.4M</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Clicks</p>
            <p className="text-xl font-bold">48.7K</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold">$24,890</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};