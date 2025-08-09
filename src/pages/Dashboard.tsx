import { useState } from "react";
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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30");

  // Enhanced overview stats with backgrounds and trends
  const overviewStats = [
    { 
      title: "Total Impressions", 
      value: "2.4M", 
      change: "+12.5%", 
      icon: Eye, 
      trend: "up" as const,
      bg: "bg-primary/10",
      color: "text-primary"
    },
    { 
      title: "Total Clicks", 
      value: "48.7K", 
      change: "+8.2%", 
      icon: MousePointer, 
      trend: "up" as const,
      bg: "bg-blue-500/10",
      color: "text-blue-600"
    },
    { 
      title: "Conversion Rate", 
      value: "3.8%", 
      change: "+0.6%", 
      icon: Target, 
      trend: "up" as const,
      bg: "bg-green-500/10",
      color: "text-green-600"
    },
    { 
      title: "Total Revenue", 
      value: "$24,890", 
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

  // Recent campaigns with enhanced data
  const recentCampaigns = [
    { 
      id: 1, 
      name: "Summer Sale Campaign", 
      status: "Active", 
      platform: "Facebook", 
      ctr: "2.8%", 
      impressions: "145.2K",
      budget: "$2,500",
      spent: "$1,850",
      thumbnail: "🏖️"
    },
    { 
      id: 2, 
      name: "Product Launch", 
      status: "Active", 
      platform: "Instagram", 
      ctr: "3.1%", 
      impressions: "98.7K",
      budget: "$1,800",
      spent: "$1,200",
      thumbnail: "🚀"
    },
    { 
      id: 3, 
      name: "Brand Awareness", 
      status: "Paused", 
      platform: "Google", 
      ctr: "1.9%", 
      impressions: "267.3K",
      budget: "$3,200",
      spent: "$2,890",
      thumbnail: "✨"
    },
  ];

  // AI Recommendations
  const aiRecommendations = [
    {
      type: "Creative",
      title: "Update Headlines",
      description: "Your current headlines are performing 15% below average. Try more action-oriented language.",
      impact: "High" as const,
      color: "text-red-600"
    },
    {
      type: "Strategy",
      title: "A/B Test Landing Pages",
      description: "Consider testing multiple landing page variants to improve conversion rates.",
      impact: "Medium" as const,
      color: "text-yellow-600"
    },
    {
      type: "Performance",
      title: "Increase Instagram Budget",
      description: "Instagram is outperforming other platforms. Consider reallocating 20% more budget.",
      impact: "High" as const,
      color: "text-green-600"
    },
  ];

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
          {/* Overview Cards */}
          <OverviewCards stats={overviewStats} />

          {/* Performance Chart */}
          <PerformanceChart 
            timeRange={timeRange} 
            onTimeRangeChange={setTimeRange} 
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Platform Performance */}
            <PlatformPerformance platforms={platformPerformance} />

            {/* AI Recommendations */}
            <AIRecommendations recommendations={aiRecommendations} />
          </div>

          {/* Recent Campaigns */}
          <RecentCampaigns campaigns={recentCampaigns} />
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <CampaignTools tools={campaignTools} />
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