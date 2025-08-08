import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface DemographicData {
  label: string;
  percentage: number;
}

interface AudienceInsight {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  data: string;
  color: string;
}

interface AudienceInsightsProps {
  insights: AudienceInsight[];
}

export const AudienceInsights = ({ insights }: AudienceInsightsProps) => {
  // Demographics data
  const ageGroups: DemographicData[] = [
    { label: "18-24", percentage: 32 },
    { label: "25-34", percentage: 45 },
    { label: "35-44", percentage: 18 },
    { label: "45+", percentage: 5 },
  ];

  const genderDistribution = {
    male: 52,
    female: 46,
    nonBinary: 2
  };

  const deviceUsage = [
    { device: "Mobile", percentage: 68, icon: "📱" },
    { device: "Desktop", percentage: 24, icon: "💻" },
    { device: "Tablet", percentage: 8, icon: "📲" },
  ];

  const topInterests = [
    { category: "Technology", score: 92 },
    { category: "Entertainment", score: 87 },
    { category: "Fashion", score: 73 },
    { category: "Sports", score: 65 },
    { category: "Travel", score: 58 },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${insight.color}`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-background">
                    <insight.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {insight.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-primary">{insight.data}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Age Demographics</CardTitle>
            <CardDescription>Age distribution of your audience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ageGroups.map((group, index) => (
              <div key={group.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{group.label} years</span>
                  <span className="font-medium">{group.percentage}%</span>
                </div>
                <Progress value={group.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Gender breakdown of your audience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{genderDistribution.male}%</p>
                <p className="text-sm text-muted-foreground">Male</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-600">{genderDistribution.female}%</p>
                <p className="text-sm text-muted-foreground">Female</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{genderDistribution.nonBinary}%</p>
                <p className="text-sm text-muted-foreground">Non-binary</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Device Usage</CardTitle>
            <CardDescription>How your audience accesses content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deviceUsage.map((device, index) => (
              <div key={device.device} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{device.icon}</span>
                  <span className="font-medium">{device.device}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={device.percentage} className="w-16 h-2" />
                  <span className="text-sm font-medium">{device.percentage}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Interest Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Interest Categories</CardTitle>
            <CardDescription>Primary interests of your audience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topInterests.map((interest, index) => (
              <div key={interest.category} className="flex items-center justify-between">
                <span className="font-medium">{interest.category}</span>
                <div className="flex items-center gap-2">
                  <Progress value={interest.score} className="w-20 h-2" />
                  <Badge variant="secondary" className="text-xs">
                    {interest.score}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};