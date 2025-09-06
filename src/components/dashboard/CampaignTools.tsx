import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Tool {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  color: string;
}

interface CampaignToolsProps {
  tools: Tool[];
  onToolClick?: (toolTitle: string) => void;
}

export const CampaignTools = ({ tools, onToolClick }: CampaignToolsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {tools.map((tool, index) => (
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
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tool.features.map((feature, featureIndex) => (
                  <Badge key={featureIndex} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => onToolClick?.(tool.title)}
              >
                Launch Tool
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};