import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  DollarSign,
  Users,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle,
  Brain,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface PredictionData {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  change: number;
  changePercent: number;
  factors: string[];
  recommendations: string[];
}

interface PerformancePredictionProps {
  campaignData?: any;
  adData?: any;
}

export const PerformancePrediction = ({
  campaignData,
  adData
}: PerformancePredictionProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock prediction data
  const mockPredictions: PredictionData[] = [
    {
      metric: 'Click-through Rate',
      current: 2.4,
      predicted: 3.1,
      confidence: 87,
      change: 0.7,
      changePercent: 29.2,
      factors: [
        'Improved headline optimization',
        'Better audience targeting',
        'Enhanced visual appeal',
        'Optimal posting time'
      ],
      recommendations: [
        'Test action-oriented headlines with urgency',
        'Narrow audience to high-intent users',
        'Use bright, contrasting colors for CTA buttons',
        'Schedule posts during peak engagement hours'
      ]
    },
    {
      metric: 'Conversion Rate',
      current: 4.2,
      predicted: 5.8,
      confidence: 92,
      change: 1.6,
      changePercent: 38.1,
      factors: [
        'Landing page optimization',
        'Trust signals addition',
        'Simplified checkout process',
        'Social proof elements'
      ],
      recommendations: [
        'Add customer testimonials and reviews',
        'Display security badges and guarantees',
        'Reduce form fields to essential only',
        'Show real-time user activity'
      ]
    },
    {
      metric: 'Cost per Acquisition',
      current: 45.30,
      predicted: 32.80,
      confidence: 84,
      change: -12.50,
      changePercent: -27.6,
      factors: [
        'Improved quality score',
        'Better keyword targeting',
        'Enhanced ad relevance',
        'Reduced competition'
      ],
      recommendations: [
        'Focus on long-tail keywords',
        'Improve ad-to-landing page relevance',
        'Use negative keywords to filter traffic',
        'Optimize for Quality Score improvements'
      ]
    },
    {
      metric: 'Return on Ad Spend',
      current: 3.2,
      predicted: 4.7,
      confidence: 89,
      change: 1.5,
      changePercent: 46.9,
      factors: [
        'Higher conversion rates',
        'Increased average order value',
        'Better customer lifetime value',
        'Reduced acquisition costs'
      ],
      recommendations: [
        'Implement upselling strategies',
        'Create compelling bundle offers',
        'Focus on high-value customer segments',
        'Optimize for repeat purchases'
      ]
    },
    {
      metric: 'Reach',
      current: 125000,
      predicted: 180000,
      confidence: 78,
      change: 55000,
      changePercent: 44.0,
      factors: [
        'Expanded audience targeting',
        'Cross-platform promotion',
        'Viral content potential',
        'Influencer partnerships'
      ],
      recommendations: [
        'Expand to lookalike audiences',
        'Cross-promote on multiple platforms',
        'Create shareable content formats',
        'Partner with micro-influencers'
      ]
    },
    {
      metric: 'Engagement Rate',
      current: 3.8,
      predicted: 5.2,
      confidence: 91,
      change: 1.4,
      changePercent: 36.8,
      factors: [
        'Interactive content elements',
        'Community building',
        'Personalized messaging',
        'Trending topics integration'
      ],
      recommendations: [
        'Add polls and interactive elements',
        'Respond promptly to comments',
        'Use personalization tokens',
        'Leverage trending hashtags and topics'
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call for predictions
    const fetchPredictions = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPredictions(mockPredictions);
      setLoading(false);
    };

    fetchPredictions();
  }, [campaignData, adData]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return { color: 'bg-green-100 text-green-700', label: 'High Confidence' };
    if (confidence >= 80) return { color: 'bg-blue-100 text-blue-700', label: 'Good Confidence' };
    if (confidence >= 70) return { color: 'bg-yellow-100 text-yellow-700', label: 'Medium Confidence' };
    return { color: 'bg-red-100 text-red-700', label: 'Low Confidence' };
  };

  const formatMetricValue = (metric: string, value: number) => {
    switch (metric) {
      case 'Click-through Rate':
      case 'Conversion Rate':
      case 'Engagement Rate':
        return `${value}%`;
      case 'Cost per Acquisition':
        return `$${value.toFixed(2)}`;
      case 'Return on Ad Spend':
        return `${value.toFixed(1)}x`;
      case 'Reach':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="animate-spin">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Performance Predictions</h2>
            <p className="text-muted-foreground">Analyzing data and generating predictions...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-2 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">AI Performance Predictions</h2>
          <p className="text-muted-foreground">Data-driven insights for optimizing your campaigns</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Prediction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((prediction, index) => {
              const confidenceBadge = getConfidenceBadge(prediction.confidence);
              const isPositive = prediction.change > 0;
              
              return (
                <motion.div
                  key={prediction.metric}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full transition-all hover:shadow-soft border-border/50 hover:border-primary/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{prediction.metric}</CardTitle>
                        <Badge className={confidenceBadge.color}>
                          {confidenceBadge.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Current vs Predicted */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Current</span>
                          <span className="font-medium">{formatMetricValue(prediction.metric, prediction.current)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Predicted</span>
                          <span className="font-bold text-lg">{formatMetricValue(prediction.metric, prediction.predicted)}</span>
                        </div>
                      </div>

                      {/* Change Indicator */}
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{prediction.changePercent.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {isPositive ? 'improvement' : 'decrease'}
                        </span>
                      </div>

                      {/* Confidence Level */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Confidence</span>
                          <span className={`font-medium ${getConfidenceColor(prediction.confidence)}`}>
                            {prediction.confidence}%
                          </span>
                        </div>
                        <Progress value={prediction.confidence} className="h-2" />
                      </div>

                      {/* Top Factors */}
                      <div>
                        <h5 className="text-sm font-medium mb-2">Key Factors</h5>
                        <div className="space-y-1">
                          {prediction.factors.slice(0, 2).map((factor, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <span className="text-xs text-muted-foreground">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Summary Insights */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Top Opportunities
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">ROAS Improvement</span>
                      <Badge className="bg-green-100 text-green-700">+46.9%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">Conversion Rate</span>
                      <Badge className="bg-green-100 text-green-700">+38.1%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">Engagement Rate</span>
                      <Badge className="bg-green-100 text-green-700">+36.8%</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Priority Actions
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                      <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Optimize landing pages for better conversion rates</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                      <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Test action-oriented headlines with urgency</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                      <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Implement upselling and cross-selling strategies</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <div className="space-y-6">
            {predictions.map((prediction, index) => (
              <Card key={prediction.metric}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {prediction.metric}
                      <Badge className={getConfidenceBadge(prediction.confidence).color}>
                        {prediction.confidence}% Confidence
                      </Badge>
                    </CardTitle>
                    <div className={`text-right ${prediction.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <div className="text-sm font-medium">
                        {prediction.change > 0 ? '+' : ''}{prediction.changePercent.toFixed(1)}% change
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatMetricValue(prediction.metric, prediction.current)} → {formatMetricValue(prediction.metric, prediction.predicted)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Progress Visualization */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Current Performance</span>
                      <span>Predicted Performance</span>
                    </div>
                    <div className="relative">
                      <Progress value={50} className="h-3" />
                      <div 
                        className="absolute top-0 left-1/2 h-3 bg-primary rounded-r-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min((Math.abs(prediction.changePercent) / 100) * 50, 50)}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatMetricValue(prediction.metric, prediction.current)}</span>
                      <span>{formatMetricValue(prediction.metric, prediction.predicted)}</span>
                    </div>
                  </div>

                  {/* Contributing Factors */}
                  <div>
                    <h4 className="font-semibold mb-3">Contributing Factors</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {prediction.factors.map((factor, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations Preview */}
                  <div>
                    <h4 className="font-semibold mb-3">Top Recommendations</h4>
                    <div className="space-y-2">
                      {prediction.recommendations.slice(0, 2).map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-blue-800">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="space-y-6">
            {predictions.map((prediction) => (
              <Card key={prediction.metric}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {prediction.metric} Optimization
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {prediction.recommendations.map((recommendation, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 border border-border rounded-lg hover:border-primary/30 transition-colors">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{i + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm mb-2">{recommendation}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Priority: {i === 0 ? 'High' : i === 1 ? 'Medium' : 'Low'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Effort: {Math.random() > 0.5 ? 'Low' : 'Medium'}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Action Plan */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Recommended Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-card rounded-lg border">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-semibold">Week 1-2</h4>
                      <p className="text-sm text-muted-foreground">Landing page optimization and headline testing</p>
                    </div>
                    <div className="text-center p-4 bg-card rounded-lg border">
                      <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-semibold">Week 3-4</h4>
                      <p className="text-sm text-muted-foreground">Audience refinement and targeting improvements</p>
                    </div>
                    <div className="text-center p-4 bg-card rounded-lg border">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-semibold">Week 5-6</h4>
                      <p className="text-sm text-muted-foreground">Performance analysis and further optimization</p>
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Zap className="h-4 w-4 mr-2" />
                      Implement Recommendations
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};