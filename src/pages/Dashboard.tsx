import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
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
  Lightbulb
} from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const overviewStats = [
    { title: "Impressions", value: "1.2M", change: "+12.5%", icon: Eye, trend: "up" },
    { title: "Clicks", value: "24.3K", change: "+8.2%", icon: MousePointer, trend: "up" },
    { title: "Conversion Rate", value: "3.4%", change: "+0.8%", icon: Target, trend: "up" },
    { title: "Revenue", value: "$12,485", change: "+15.3%", icon: DollarSign, trend: "up" },
  ];

  const recentAds = [
    { id: 1, name: "Summer Sale Campaign", status: "Active", platform: "Facebook", ctr: "2.8%", impressions: "45.2K" },
    { id: 2, name: "Product Launch", status: "Pending", platform: "Instagram", ctr: "3.1%", impressions: "28.7K" },
    { id: 3, name: "Brand Awareness", status: "Active", platform: "Google", ctr: "1.9%", impressions: "67.3K" },
  ];

  const campaignTools = [
    { title: "Ad Scheduler", description: "Plan and automate campaign timing", icon: Calendar },
    { title: "Budget Estimator", description: "Calculate optimal budget allocation", icon: Calculator },
    { title: "Platform Selector", description: "Choose target advertising platforms", icon: Layers },
    { title: "Ad Placement Preview", description: "Visualize ad placements", icon: Eye },
  ];

  const audienceInsights = [
    { title: "Demographics", description: "Age, gender, location breakdowns", icon: Users },
    { title: "Geographic Data", description: "Location-based performance", icon: MapPin },
    { title: "Performance Analytics", description: "Cross-platform comparison", icon: BarChart3 },
    { title: "AI Recommendations", description: "Optimization suggestions", icon: Lightbulb },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your advertising performance overview.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Main Dashboard</TabsTrigger>
          <TabsTrigger value="tools">Campaign Tools</TabsTrigger>
          <TabsTrigger value="insights">Audience Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      {stat.change} from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>30-day trend visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Performance chart would be rendered here</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Ads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your latest advertising campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAds.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium">{ad.name}</h4>
                      <p className="text-sm text-muted-foreground">{ad.platform}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ad.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ad.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">CTR: {ad.ctr} | {ad.impressions} impressions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {campaignTools.map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <tool.icon className="h-6 w-6 text-primary" />
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                    </div>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">Launch Tool</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {audienceInsights.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <insight.icon className="h-6 w-6 text-primary" />
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <CardDescription>{insight.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">View Details</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;