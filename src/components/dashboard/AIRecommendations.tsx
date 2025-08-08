import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ChevronRight } from "lucide-react";

interface Recommendation {
  type: string;
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  color: string;
}

interface AIRecommendationsProps {
  recommendations: Recommendation[];
}

export const AIRecommendations = ({ recommendations }: AIRecommendationsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          AI Recommendations
        </CardTitle>
        <CardDescription>Optimization suggestions to improve performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
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
  );
};