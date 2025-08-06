import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  MousePointer, 
  Target, 
  DollarSign,
  Calendar,
  Calculator,
  Layers,
  Eye,
  BarChart3,
  Users,
  MapPin,
  Lightbulb,
  Globe,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ChevronRight,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  ShoppingCart,
  Heart
} from "lucide-react";

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
      trend: "up",
      bg: "bg-primary-100",
      color: "text-primary-700"
    },
    { 
      title: "Total Clicks", 
      value: "48.7K", 
      change: "+8.2%", 
      icon: MousePointer, 
      trend: "up",
      bg: "bg-blue-100",
      color: "text-blue-700"
    },
    { 
      title: "Conversion Rate", 
      value: "3.8%", 
      change: "+0.6%", 
      icon: Target, 
      trend: "up",
      bg: "bg-green-100",
      color: "text-green-700"
    },
    { 
      title: "Total Revenue", 
      value: "$24,890", 
      change: "+15.3%", 
      icon: DollarSign, 
      trend: "up",
      bg: "bg-purple-100",
      color: "text-purple-700"
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
      impact: "High",
      color: "text-red-600"
    },
    {
      type: "Strategy",
      title: "A/B Test Landing Pages",
      description: "Consider testing multiple landing page variants to improve conversion rates.",
      impact: "Medium",
      color: "text-yellow-600"
    },
    {
      type: "Performance",
      title: "Increase Instagram Budget",
      description: "Instagram is outperforming other platforms. Consider reallocating 20% more budget.",
      impact: "High",
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
      color: "bg-blue-50 border-blue-200"
    },
    { 
      title: "Budget Estimator", 
      description: "Calculate optimal budget allocation across platforms with ROI predictions", 
      icon: Calculator,
      features: ["ROI forecasting", "Platform comparison", "Cost optimization"],
      color: "bg-green-50 border-green-200"
    },
    { 
      title: "Platform Manager", 
      description: "Manage all advertising platforms from a unified dashboard", 
      icon: Layers,
      features: ["Multi-platform sync", "Performance comparison", "Unified reporting"],
      color: "bg-purple-50 border-purple-200"
    },
    { 
      title: "Creative Studio", 
      description: "AI-powered ad creation with real-time platform previews", 
      icon: Eye,
      features: ["AI content generation", "Platform optimization", "A/B testing"],
      color: "bg-orange-50 border-orange-200"
    },
  ];

  // Audience Insights with detailed analytics
  const audienceInsights = [
    { 
      title: "Demographics", 
      description: "Comprehensive age, gender, and income analysis", 
      icon: Users,
      data: "4 key segments identified",
      color: "bg-indigo-50 border-indigo-200"
    },
    { 
      title: "Geographic Data", 
      description: "Location-based performance with city-level insights", 
      icon: MapPin,
      data: "Top 3 markets: NY, CA, TX",
      color: "bg-cyan-50 border-cyan-200"
    },
    { 
      title: "Behavioral Analytics", 
      description: "User engagement patterns and conversion paths", 
      icon: Activity,
      data: "85% mobile engagement",
      color: "bg-emerald-50 border-emerald-200"
    },
    { 
      title: "Interest Mapping", 
      description: "Category preferences and purchase intent analysis", 
      icon: Heart,
      data: "12 interest categories",
      color: "bg-rose-50 border-rose-200"
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
          {/* Enhanced Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      {stat.trend === "up" ? (
                        <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
                      )}
                      {stat.change} from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Performance Chart with Time Range Selector */}
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
                      onClick={() => setTimeRange(days)}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center border-2 border-dashed border-primary-200">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-primary-400 mx-auto mb-2" />
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

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Platform Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Cross-platform analytics comparison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {platformPerformance.map((platform, index) => (
                  <motion.div
                    key={platform.platform}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <platform.icon className={`h-5 w-5 ${platform.color}`} />
                      <div>
                        <p className="font-medium">{platform.platform}</p>
                        <p className="text-sm text-muted-foreground">CTR: {platform.ctr}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{platform.revenue}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={platform.performance} className="w-16 h-2" />
                        <span className="text-xs text-muted-foreground">{platform.performance}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* AI Optimization Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>Optimization suggestions to improve performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiRecommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                          <Badge 
                            variant={rec.impact === "High" ? "destructive" : rec.impact === "Medium" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {rec.impact} Impact
                          </Badge>
                        </div>
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your latest advertising campaigns with performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCampaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
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
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {campaignTools.map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${tool.color}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-background">
                          <tool.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tool.title}</CardTitle>
                          <CardDescription className="text-sm">{tool.description}</CardDescription>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {tool.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="default" className="w-full" size="sm">
                        Launch Tool
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Audience Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Audience Demographics
                </CardTitle>
                <CardDescription>Age and gender distribution analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "18-24 years", value: 28, color: "bg-blue-500" },
                  { label: "25-34 years", value: 42, color: "bg-indigo-500" },
                  { label: "35-44 years", value: 23, color: "bg-purple-500" },
                  { label: "45+ years", value: 7, color: "bg-pink-500" },
                ].map((demo, index) => (
                  <motion.div
                    key={demo.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{demo.label}</span>
                    <div className="flex items-center gap-3">
                      <Progress value={demo.value} className="w-24 h-2" />
                      <span className="text-sm text-muted-foreground min-w-[3rem] text-right">{demo.value}%</span>
                    </div>
                  </motion.div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">52%</p>
                      <p className="text-sm text-muted-foreground">Female</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-600">48%</p>
                      <p className="text-sm text-muted-foreground">Male</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Geographic Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-cyan-600" />
                  Geographic Insights
                </CardTitle>
                <CardDescription>Top performing locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { country: "United States", flag: "🇺🇸", percentage: 45, revenue: "$11,250" },
                  { country: "Canada", flag: "🇨🇦", percentage: 18, revenue: "$4,480" },
                  { country: "United Kingdom", flag: "🇬🇧", percentage: 15, revenue: "$3,735" },
                  { country: "Australia", flag: "🇦🇺", percentage: 12, revenue: "$2,988" },
                  { country: "Germany", flag: "🇩🇪", percentage: 10, revenue: "$2,437" },
                ].map((location, index) => (
                  <motion.div
                    key={location.country}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{location.flag}</span>
                      <div>
                        <p className="font-medium">{location.country}</p>
                        <p className="text-sm text-muted-foreground">{location.revenue}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{location.percentage}%</p>
                      <Progress value={location.percentage} className="w-16 h-2 mt-1" />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Device Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  Device Usage
                </CardTitle>
                <CardDescription>Platform usage breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { device: "Mobile", icon: Smartphone, percentage: 68, color: "text-emerald-600" },
                  { device: "Desktop", icon: Monitor, percentage: 24, color: "text-blue-600" },
                  { device: "Tablet", icon: Tablet, percentage: 8, color: "text-purple-600" },
                ].map((device, index) => (
                  <motion.div
                    key={device.device}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <device.icon className={`h-5 w-5 ${device.color}`} />
                      <span className="font-medium">{device.device}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={device.percentage} className="w-24 h-2" />
                      <span className="text-sm font-semibold min-w-[3rem] text-right">{device.percentage}%</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Interest Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-600" />
                  Interest Categories
                </CardTitle>
                <CardDescription>Top audience interests and engagement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { category: "Technology", engagement: 92, icon: "💻" },
                  { category: "Fashion", engagement: 78, icon: "👗" },
                  { category: "Travel", engagement: 85, icon: "✈️" },
                  { category: "Food & Dining", engagement: 73, icon: "🍽️" },
                  { category: "Sports", engagement: 67, icon: "⚽" },
                ].map((interest, index) => (
                  <motion.div
                    key={interest.category}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{interest.icon}</span>
                      <span className="font-medium">{interest.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={interest.engagement} className="w-20 h-2" />
                      <span className="text-sm text-muted-foreground min-w-[3rem] text-right">{interest.engagement}%</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;