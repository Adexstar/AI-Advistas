import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  MousePointer, 
  Target, 
  DollarSign,
  Calendar,
  Calculator,
  Layers,
  Eye,
  Users,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Activity,
  Heart
} from "lucide-react";

// Import dashboard components
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { PlatformPerformance } from "@/components/dashboard/PlatformPerformance";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { CampaignTools } from "@/components/dashboard/CampaignTools";
import { AudienceInsights } from "@/components/dashboard/AudienceInsights";
import { RecentCampaigns } from "@/components/dashboard/RecentCampaigns";
import { TargetAudienceInsights } from "@/components/dashboard/TargetAudienceInsights";
import { OptimizationTips } from "@/components/dashboard/OptimizationTips";
import { AdPerformanceHeatmap } from "@/components/dashboard/AdPerformanceHeatmap";
import { InteractiveDashboard } from "@/components/InteractiveDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate dynamic stats from app state
  const totalImpressions = state.campaigns.reduce((acc, campaign) => acc + campaign.impressions, 0);
  const totalClicks = state.campaigns.reduce((acc, campaign) => acc + campaign.clicks, 0);
  const totalSpent = state.campaigns.reduce((acc, campaign) => acc + campaign.spent, 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const overviewStats = [
    { 
      title: "Total Impressions", 
      value: `${(totalImpressions / 1000).toFixed(1)}K`, 
      change: "+12.5%", 
      icon: Eye, 
      trend: "up" as const,
      bg: "bg-primary/10",
      color: "text-primary"
    },
    { 
      title: "Total Clicks", 
      value: `${(totalClicks / 1000).toFixed(1)}K`, 
      change: "+8.2%", 
      icon: MousePointer, 
      trend: "up" as const,
      bg: "bg-blue-500/10",
      color: "text-blue-600"
    },
    { 
      title: "Conversion Rate", 
      value: `${avgCTR.toFixed(1)}%`, 
      change: "+0.6%", 
      icon: Target, 
      trend: "up" as const,
      bg: "bg-green-500/10",
      color: "text-green-600"
    },
    { 
      title: "Total Spent", 
      value: `$${totalSpent.toLocaleString()}`, 
      change: "+15.3%", 
      icon: DollarSign, 
      trend: "up" as const,
      bg: "bg-purple-500/10",
      color: "text-purple-600"
    },
  ];

  // Platform performance data
  const platformPerformance = [
    { platform: "Facebook", icon: Facebook, color: "text-blue-600", performance: 85, revenue: "$8,450", ctr: "2.8%" },
    { platform: "Instagram", icon: Instagram, color: "text-pink-600", performance: 92, revenue: "$6,720", ctr: "3.2%" },
    { platform: "Google Ads", icon: Globe, color: "text-red-600", performance: 78, revenue: "$5,890", ctr: "2.1%" },
    { platform: "Twitter", icon: Twitter, color: "text-blue-400", performance: 71, revenue: "$2,340", ctr: "1.9%" },
    { platform: "LinkedIn", icon: Linkedin, color: "text-blue-700", performance: 88, revenue: "$1,490", ctr: "4.1%" },
  ];

  // Use real campaigns from app state
  const recentCampaigns = state.campaigns.slice(0, 3).map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1),
    platform: campaign.platform.join(", "),
    ctr: `${campaign.ctr}%`,
    impressions: `${(campaign.impressions / 1000).toFixed(1)}K`,
    budget: `$${campaign.budget.toLocaleString()}`,
    spent: `$${campaign.spent.toLocaleString()}`,
    thumbnail: campaign.name.includes('Summer') ? '🏖️' : 
               campaign.name.includes('Product') ? '🚀' : 
               campaign.name.includes('Brand') ? '✨' : '📊'
  }));

  // Generate AI Recommendations based on actual data
  const generateRecommendations = () => {
    const recommendations = [];
    
    // Find best performing platform
    const bestPlatform = platformPerformance.reduce((best, current) => 
      current.performance > best.performance ? current : best
    );
    
    if (bestPlatform.performance > 85) {
      recommendations.push({
        type: "Performance",
        title: `Increase ${bestPlatform.platform} Budget`,
        description: `${bestPlatform.platform} is outperforming other platforms. Consider reallocating 20% more budget.`,
        impact: "High" as const,
        color: "text-green-600",
        action: () => navigate('/campaigns')
      });
    }

    // Check for low performing campaigns
    const lowPerformingCampaigns = state.campaigns.filter(c => c.ctr < 2.0);
    if (lowPerformingCampaigns.length > 0) {
      recommendations.push({
        type: "Creative",
        title: "Optimize Low-CTR Campaigns",
        description: `${lowPerformingCampaigns.length} campaigns have CTR below 2%. Consider updating headlines and visuals.`,
        impact: "High" as const,
        color: "text-red-600",
        action: () => navigate('/create-ad')
      });
    }

    recommendations.push({
      type: "Strategy",
      title: "A/B Test Landing Pages",
      description: "Consider testing multiple landing page variants to improve conversion rates.",
      impact: "Medium" as const,
      color: "text-yellow-600",
      action: () => navigate('/landing-pages')
    });

    return recommendations;
  };

  const aiRecommendations = generateRecommendations();

  // Campaign Tools with enhanced descriptions
  const campaignTools = [
    { 
      title: "Ad Scheduler", 
      description: "Plan and automate campaign timing with AI-optimized scheduling", 
      icon: Calendar,
      features: ["Smart scheduling", "Timezone optimization", "Recurring campaigns"],
      color: "bg-blue-500/5 border-blue-200"
    },
    { 
      title: "Budget Estimator", 
      description: "Calculate optimal budget allocation across platforms with ROI predictions", 
      icon: Calculator,
      features: ["ROI forecasting", "Platform comparison", "Cost optimization"],
      color: "bg-green-500/5 border-green-200"
    },
    { 
      title: "Platform Manager", 
      description: "Manage all advertising platforms from a unified dashboard", 
      icon: Layers,
      features: ["Multi-platform sync", "Performance comparison", "Unified reporting"],
      color: "bg-purple-500/5 border-purple-200"
    },
    { 
      title: "Creative Studio", 
      description: "AI-powered ad creation with real-time platform previews", 
      icon: Eye,
      features: ["AI content generation", "Platform optimization", "A/B testing"],
      color: "bg-orange-500/5 border-orange-200"
    },
  ];

  // Audience Insights with detailed analytics
  const audienceInsights = [
    { 
      title: "Demographics", 
      description: "Comprehensive age, gender, and income analysis", 
      icon: Users,
      data: "4 key segments identified",
      color: "bg-indigo-500/5 border-indigo-200"
    },
    { 
      title: "Geographic Data", 
      description: "Location-based performance with city-level insights", 
      icon: MapPin,
      data: "Top 3 markets: NY, CA, TX",
      color: "bg-cyan-500/5 border-cyan-200"
    },
    { 
      title: "Behavioral Analytics", 
      description: "User engagement patterns and conversion paths", 
      icon: Activity,
      data: "85% mobile engagement",
      color: "bg-emerald-500/5 border-emerald-200"
    },
    { 
      title: "Interest Mapping", 
      description: "Category preferences and purchase intent analysis", 
      icon: Heart,
      data: "12 interest categories",
      color: "bg-rose-500/5 border-rose-200"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your advertising performance overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Main Dashboard</TabsTrigger>
          <TabsTrigger value="tools">Campaign Tools</TabsTrigger>
          <TabsTrigger value="insights">Audience Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Interactive Dashboard Widget */}
          <InteractiveDashboard />
          
          {/* Overview Cards */}
          <OverviewCards stats={overviewStats} />

          {/* Performance Chart */}
          <PerformanceChart 
            timeRange={state.timeRange} 
            onTimeRangeChange={actions.setTimeRange}
            campaigns={state.campaigns}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Platform Performance */}
            <PlatformPerformance platforms={platformPerformance} />

            {/* AI Recommendations */}
            <AIRecommendations 
              recommendations={aiRecommendations}
              onRecommendationClick={(recommendation) => recommendation.action?.()}
            />
          </div>

          {/* Recent Campaigns */}
          <RecentCampaigns 
            campaigns={recentCampaigns}
            onCampaignClick={(campaign) => navigate(`/campaigns`)}
            onToggleStatus={(campaignId) => actions.toggleCampaignStatus(campaignId)}
          />
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <CampaignTools 
            tools={campaignTools}
            onToolClick={(toolTitle) => {
              if (toolTitle === 'Creative Studio') navigate('/create-ad');
              else if (toolTitle === 'Platform Manager') navigate('/campaigns');
              else if (toolTitle === 'Ad Scheduler') navigate('/campaigns');
              else if (toolTitle === 'Budget Estimator') navigate('/billing');
            }}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AudienceInsights insights={audienceInsights} />
            <TargetAudienceInsights />
          </div>

          <div className="grid grid-cols-1 gap-5">
            <PlatformPerformance platforms={platformPerformance} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <OptimizationTips />
            <AdPerformanceHeatmap />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;