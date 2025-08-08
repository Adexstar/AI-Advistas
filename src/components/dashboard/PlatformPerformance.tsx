import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Platform {
  platform: string;
  icon: React.ComponentType<any>;
  color: string;
  performance: number;
  revenue: string;
  ctr: string;
}

interface PlatformPerformanceProps {
  platforms: Platform[];
}

export const PlatformPerformance = ({ platforms }: PlatformPerformanceProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Performance</CardTitle>
        <CardDescription>Cross-platform analytics comparison</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map((platform, index) => (
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
  );
};