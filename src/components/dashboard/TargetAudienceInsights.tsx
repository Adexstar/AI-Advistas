import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart2, PieChart, MapPin } from "lucide-react";

interface TargetAudienceInsightsProps {
  isLoading?: boolean;
}

export const TargetAudienceInsights = ({ isLoading }: TargetAudienceInsightsProps) => {
  // Demo data
  const gender = { male: 42, female: 56, other: 2 };
  const ageGroups = [
    { label: "18-24", value: 15 },
    { label: "25-34", value: 38 },
    { label: "35-44", value: 28 },
    { label: "45-54", value: 12 },
    { label: "55+", value: 7 },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Target Audience Insights</CardTitle>
            <CardDescription>Advanced audience analysis across demographics</CardDescription>
          </div>
          <Badge variant="secondary">Audience Analysis</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="demographics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
            <TabsTrigger value="behaviors">Behaviors</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="demographics" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender distribution */}
              <div>
                <h4 className="text-sm font-medium mb-3">Gender Distribution</h4>
                <div className="space-y-3">
                  {[{ label: "Male", value: gender.male }, { label: "Female", value: gender.female }, { label: "Other", value: gender.other }].map((g) => (
                    <div key={g.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{g.label}</span>
                        <span className="font-medium">{g.value}%</span>
                      </div>
                      <Progress value={g.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Age groups */}
              <div>
                <h4 className="text-sm font-medium mb-3">Age Groups</h4>
                <div className="space-y-3">
                  {ageGroups.map((a, i) => (
                    <div key={a.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{a.label}</span>
                        <span className="font-medium">{a.value}%</span>
                      </div>
                      <Progress value={a.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Placeholders for future tabs */}
          <TabsContent value="interests" className="mt-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
              <div className="mx-auto mb-2 w-8 h-8 flex items-center justify-center rounded-md bg-muted"><BarChart2 className="h-4 w-4" /></div>
              Audience interest categories coming soon
            </div>
          </TabsContent>

          <TabsContent value="behaviors" className="mt-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
              <div className="mx-auto mb-2 w-8 h-8 flex items-center justify-center rounded-md bg-muted"><PieChart className="h-4 w-4" /></div>
              Behavioral patterns and analytics coming soon
            </div>
          </TabsContent>

          <TabsContent value="locations" className="mt-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
              <div className="mx-auto mb-2 w-8 h-8 flex items-center justify-center rounded-md bg-muted"><MapPin className="h-4 w-4" /></div>
              Geographic distribution analysis coming soon
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default TargetAudienceInsights;
