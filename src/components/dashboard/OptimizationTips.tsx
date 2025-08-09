import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, FlaskRound } from "lucide-react";

interface OptimizationTipsProps { isLoading?: boolean }

export const OptimizationTips = ({ isLoading }: OptimizationTipsProps) => {
  const creativeTips = [
    "Use action-oriented headlines",
    "Highlight a clear value proposition",
    "Test contrasting CTA colors",
  ];
  const strategyTips = [
    "A/B test landing pages",
    "Reallocate budget to top platforms",
    "Schedule ads for peak hours",
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Optimization Tips</CardTitle>
            <CardDescription>Creative and strategic recommendations</CardDescription>
          </div>
          <Badge variant="secondary">AI Powered</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-medium">Creative Tips</h4>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {creativeTips.map((t) => (
                <li key={t} className="text-muted-foreground">{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-3">
              <FlaskRound className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-medium">Strategy Tips</h4>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {strategyTips.map((t) => (
                <li key={t} className="text-muted-foreground">{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizationTips;
