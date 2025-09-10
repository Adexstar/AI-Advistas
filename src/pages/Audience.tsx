import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { 
  Users, 
  MapPin, 
  Smartphone, 
  Monitor, 
  Tablet,
  TrendingUp,
  Heart,
  ShoppingBag,
  Gamepad2,
  Plane,
  FileText
} from "lucide-react";

const Audience = () => {
  const navigate = useNavigate();
  const { state } = useApp();

  // Generate dynamic insights based on campaign data
  const totalImpressions = state.campaigns.reduce((acc, campaign) => acc + campaign.impressions, 0);
  const avgCTR = state.campaigns.length > 0 
    ? (state.campaigns.reduce((acc, campaign) => acc + campaign.ctr, 0) / state.campaigns.length).toFixed(1)
    : "0";
  const activeCampaigns = state.campaigns.filter(c => c.status === 'active').length;
  const ageDistribution = [
    { range: "18-24", percentage: 25, color: "bg-blue-500" },
    { range: "25-34", percentage: 35, color: "bg-purple-500" },
    { range: "35-44", percentage: 22, color: "bg-green-500" },
    { range: "45-54", percentage: 12, color: "bg-yellow-500" },
    { range: "55+", percentage: 6, color: "bg-red-500" }
  ];

  const topLocations = [
    { location: "California, USA", percentage: 22 },
    { location: "New York, USA", percentage: 18 },
    { location: "Texas, USA", percentage: 12 },
    { location: "Florida, USA", percentage: 10 },
    { location: "London, UK", percentage: 8 },
    { location: "Toronto, Canada", percentage: 6 }
  ];

  const deviceUsage = [
    { device: "Mobile", percentage: 65, icon: Smartphone },
    { device: "Desktop", percentage: 30, icon: Monitor },
    { device: "Tablet", percentage: 5, icon: Tablet }
  ];

  const interests = [
    { category: "Technology", percentage: 45, icon: TrendingUp },
    { category: "Fashion", percentage: 38, icon: Heart },
    { category: "Shopping", percentage: 42, icon: ShoppingBag },
    { category: "Gaming", percentage: 28, icon: Gamepad2 },
    { category: "Travel", percentage: 35, icon: Plane }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audience Analytics</h1>
          <p className="text-muted-foreground">Understand your audience demographics and behavior patterns</p>
        </div>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Live Campaign Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{(totalImpressions / 1000).toFixed(1)}K</p>
              <p className="text-sm text-muted-foreground">Total Impressions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{avgCTR}%</p>
              <p className="text-sm text-muted-foreground">Average CTR</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{activeCampaigns}</p>
              <p className="text-sm text-muted-foreground">Active Campaigns</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Age Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Age Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ageDistribution.map((age, index) => (
                <motion.div
                  key={age.range}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm font-medium w-12">{age.range}</span>
                    <div className="flex-1">
                      <Progress value={age.percentage} className="h-2" />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">{age.percentage}%</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Device Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceUsage.map((device, index) => (
                <motion.div
                  key={device.device}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <device.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{device.device}</span>
                  </div>
                  <span className="text-lg font-bold">{device.percentage}%</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLocations.map((location, index) => (
                <motion.div
                  key={location.location}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{location.location}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={location.percentage} className="h-2 w-24" />
                    <span className="text-sm text-muted-foreground w-8">{location.percentage}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interest Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Interest Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interests.map((interest, index) => (
                <motion.div
                  key={interest.category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <interest.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{interest.category}</span>
                  </div>
                  <span className="text-sm font-bold">{interest.percentage}%</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => navigate('/create-ad')}>
              <h4 className="font-medium text-blue-900">Target Mobile Users</h4>
              <p className="text-sm text-blue-700 mt-1">65% of your audience uses mobile devices. Optimize for mobile-first experience.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500 cursor-pointer hover:bg-green-100 transition-colors" onClick={() => navigate('/campaigns')}>
              <h4 className="font-medium text-green-900">Focus on 25-34 Age Group</h4>
              <p className="text-sm text-green-700 mt-1">Your highest converting segment. Increase budget allocation for this demographic.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500 cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => navigate('/create-ad')}>
              <h4 className="font-medium text-purple-900">Expand to Technology Interest</h4>
              <p className="text-sm text-purple-700 mt-1">45% show tech interest. Consider tech-focused ad content and platforms.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Audience;