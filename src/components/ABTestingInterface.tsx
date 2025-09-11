import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  FlaskConical,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCw,
  Copy,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABVariant[];
  settings: {
    trafficSplit: number[];
    duration: number;
    confidenceLevel: number;
    minSampleSize: number;
    primaryMetric: string;
  };
  results?: ABTestResults;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

interface ABVariant {
  id: string;
  name: string;
  content: {
    headline: string;
    description: string;
    cta: string;
    imageUrl?: string;
  };
  isControl: boolean;
  trafficPercentage: number;
}

interface ABTestResults {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  duration: number;
  variants: {
    [variantId: string]: {
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      conversionRate: number;
      confidence: number;
      isWinner: boolean;
      uplift: number;
    };
  };
  statisticalSignificance: boolean;
  recommendedAction: string;
}

interface ABTestingInterfaceProps {
  onCreateTest: (test: Partial<ABTest>) => void;
  onUpdateTest: (testId: string, updates: Partial<ABTest>) => void;
  onDeleteTest: (testId: string) => void;
  existingTests?: ABTest[];
}

export const ABTestingInterface = ({
  onCreateTest,
  onUpdateTest,
  onDeleteTest,
  existingTests = []
}: ABTestingInterfaceProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTest, setNewTest] = useState<Partial<ABTest>>({
    name: '',
    description: '',
    variants: [
      {
        id: 'control',
        name: 'Control (Original)',
        content: { headline: '', description: '', cta: '' },
        isControl: true,
        trafficPercentage: 50
      },
      {
        id: 'variant-a',
        name: 'Variant A',
        content: { headline: '', description: '', cta: '' },
        isControl: false,
        trafficPercentage: 50
      }
    ],
    settings: {
      trafficSplit: [50, 50],
      duration: 14,
      confidenceLevel: 95,
      minSampleSize: 1000,
      primaryMetric: 'conversions'
    }
  });

  // Mock data for demonstration
  const mockTests: ABTest[] = [
    {
      id: '1',
      name: 'Headline Optimization Test',
      description: 'Testing different headlines to improve click-through rates',
      status: 'running',
      variants: [
        {
          id: 'control',
          name: 'Control',
          content: {
            headline: 'Get Started Today',
            description: 'Join thousands of satisfied customers',
            cta: 'Sign Up Now'
          },
          isControl: true,
          trafficPercentage: 50
        },
        {
          id: 'variant-a',
          name: 'Variant A',
          content: {
            headline: 'Transform Your Business Today',
            description: 'Join thousands of satisfied customers',
            cta: 'Sign Up Now'
          },
          isControl: false,
          trafficPercentage: 50
        }
      ],
      settings: {
        trafficSplit: [50, 50],
        duration: 14,
        confidenceLevel: 95,
        minSampleSize: 1000,
        primaryMetric: 'conversions'
      },
      results: {
        totalImpressions: 15420,
        totalClicks: 1234,
        totalConversions: 156,
        duration: 7,
        variants: {
          control: {
            impressions: 7710,
            clicks: 580,
            conversions: 68,
            ctr: 7.52,
            conversionRate: 11.72,
            confidence: 0,
            isWinner: false,
            uplift: 0
          },
          'variant-a': {
            impressions: 7710,
            clicks: 654,
            conversions: 88,
            ctr: 8.48,
            conversionRate: 13.46,
            confidence: 87,
            isWinner: true,
            uplift: 14.84
          }
        },
        statisticalSignificance: false,
        recommendedAction: 'Continue test for higher confidence'
      },
      createdAt: '2024-01-10',
      startedAt: '2024-01-11',
    },
    {
      id: '2',
      name: 'CTA Button Color Test',
      description: 'Testing button colors for better conversion rates',
      status: 'completed',
      variants: [
        {
          id: 'control',
          name: 'Blue Button',
          content: {
            headline: 'Start Your Free Trial',
            description: 'No credit card required',
            cta: 'Get Started'
          },
          isControl: true,
          trafficPercentage: 50
        },
        {
          id: 'variant-a',
          name: 'Orange Button',
          content: {
            headline: 'Start Your Free Trial',
            description: 'No credit card required',
            cta: 'Get Started'
          },
          isControl: false,
          trafficPercentage: 50
        }
      ],
      settings: {
        trafficSplit: [50, 50],
        duration: 21,
        confidenceLevel: 95,
        minSampleSize: 2000,
        primaryMetric: 'conversions'
      },
      results: {
        totalImpressions: 28500,
        totalClicks: 2394,
        totalConversions: 287,
        duration: 21,
        variants: {
          control: {
            impressions: 14250,
            clicks: 1140,
            conversions: 128,
            ctr: 8.0,
            conversionRate: 11.23,
            confidence: 0,
            isWinner: false,
            uplift: 0
          },
          'variant-a': {
            impressions: 14250,
            clicks: 1254,
            conversions: 159,
            ctr: 8.8,
            conversionRate: 12.68,
            confidence: 96,
            isWinner: true,
            uplift: 12.91
          }
        },
        statisticalSignificance: true,
        recommendedAction: 'Implement Variant A - Orange Button'
      },
      createdAt: '2024-01-01',
      startedAt: '2024-01-02',
      endedAt: '2024-01-23'
    }
  ];

  const [tests, setTests] = useState<ABTest[]>(existingTests.length > 0 ? existingTests : mockTests);

  const handleCreateTest = () => {
    if (!newTest.name?.trim()) {
      toast({
        title: 'Test name required',
        description: 'Please enter a name for your A/B test',
        variant: 'destructive',
      });
      return;
    }

    const test: ABTest = {
      ...newTest,
      id: Date.now().toString(),
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
    } as ABTest;

    setTests(prev => [...prev, test]);
    onCreateTest(test);
    setShowCreateDialog(false);
    setNewTest({
      name: '',
      description: '',
      variants: [
        {
          id: 'control',
          name: 'Control (Original)',
          content: { headline: '', description: '', cta: '' },
          isControl: true,
          trafficPercentage: 50
        },
        {
          id: 'variant-a',
          name: 'Variant A',
          content: { headline: '', description: '', cta: '' },
          isControl: false,
          trafficPercentage: 50
        }
      ],
      settings: {
        trafficSplit: [50, 50],
        duration: 14,
        confidenceLevel: 95,
        minSampleSize: 1000,
        primaryMetric: 'conversions'
      }
    });

    toast({
      title: 'A/B Test Created',
      description: 'Your test has been created and is ready to launch.',
    });
  };

  const handleTestAction = (testId: string, action: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    let newStatus = test.status;
    let updates: Partial<ABTest> = {};

    switch (action) {
      case 'start':
        newStatus = 'running';
        updates.startedAt = new Date().toISOString().split('T')[0];
        break;
      case 'pause':
        newStatus = 'paused';
        break;
      case 'complete':
        newStatus = 'completed';
        updates.endedAt = new Date().toISOString().split('T')[0];
        break;
      case 'delete':
        setTests(prev => prev.filter(t => t.id !== testId));
        onDeleteTest(testId);
        return;
    }

    updates.status = newStatus;
    setTests(prev => prev.map(t => t.id === testId ? { ...t, ...updates } : t));
    onUpdateTest(testId, updates);

    toast({
      title: 'Test Updated',
      description: `Test has been ${action}ed successfully.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            A/B Testing
          </h2>
          <p className="text-muted-foreground">Optimize your ads with data-driven experiments</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <FlaskConical className="h-4 w-4 mr-2" />
          Create A/B Test
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="running">Running Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Tests</p>
                    <p className="text-2xl font-bold">{tests.filter(t => t.status === 'running').length}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{tests.filter(t => t.status === 'completed').length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Uplift</p>
                    <p className="text-2xl font-bold">+12.8%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tests</p>
                    <p className="text-2xl font-bold">{tests.length}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tests */}
          <Card>
            <CardHeader>
              <CardTitle>All Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tests.map((test) => (
                  <motion.div
                    key={test.id}
                    whileHover={{ x: 4 }}
                    className="p-4 border border-border rounded-lg hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{test.name}</h3>
                          <Badge className={getStatusColor(test.status)}>
                            {getStatusIcon(test.status)}
                            <span className="ml-1">{test.status.charAt(0).toUpperCase() + test.status.slice(1)}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                        
                        {test.results && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Impressions: </span>
                              <span className="font-medium">{test.results.totalImpressions.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Clicks: </span>
                              <span className="font-medium">{test.results.totalClicks.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Conversions: </span>
                              <span className="font-medium">{test.results.totalConversions}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duration: </span>
                              <span className="font-medium">{test.results.duration} days</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {test.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestAction(test.id, 'start');
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {test.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestAction(test.id, 'pause');
                            }}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestAction(test.id, 'delete');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="running">
          <div className="space-y-4">
            {tests.filter(t => t.status === 'running').map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {test.name}
                      <Badge className="bg-green-100 text-green-700">
                        <Play className="h-3 w-3 mr-1" />
                        Running
                      </Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestAction(test.id, 'pause')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestAction(test.id, 'complete')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {test.results && (
                    <div className="space-y-6">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Test Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {test.results.duration} / {test.settings.duration} days
                          </span>
                        </div>
                        <Progress value={(test.results.duration / test.settings.duration) * 100} />
                      </div>

                      {/* Variants Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {test.variants.map((variant) => {
                          const results = test.results?.variants[variant.id];
                          if (!results) return null;

                          return (
                            <Card key={variant.id} className={`${results.isWinner ? 'border-green-200 bg-green-50/50' : ''}`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">{variant.name}</CardTitle>
                                  {results.isWinner && (
                                    <Badge className="bg-green-100 text-green-700">
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      Leading
                                    </Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">CTR</span>
                                    <p className="font-semibold">{results.ctr}%</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Conv. Rate</span>
                                    <p className="font-semibold">{results.conversionRate}%</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Clicks</span>
                                    <p className="font-semibold">{results.clicks.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Conversions</span>
                                    <p className="font-semibold">{results.conversions}</p>
                                  </div>
                                </div>
                                
                                {!variant.isControl && (
                                  <div className="pt-2 border-t">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Uplift</span>
                                      <span className={`text-sm font-medium ${results.uplift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {results.uplift > 0 ? '+' : ''}{results.uplift}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Confidence</span>
                                      <span className="text-sm font-medium">{results.confidence}%</span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Recommendations */}
                      {test.results.recommendedAction && (
                        <Card className="border-blue-200 bg-blue-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-blue-900">Recommendation</h4>
                                <p className="text-sm text-blue-700 mt-1">{test.results.recommendedAction}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {tests.filter(t => t.status === 'completed').map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {test.name}
                      <Badge className="bg-blue-100 text-blue-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Create new test based on this one
                        setNewTest({
                          name: `${test.name} - Copy`,
                          description: test.description,
                          variants: test.variants,
                          settings: test.settings
                        });
                        setShowCreateDialog(true);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {test.results && (
                    <div className="space-y-4">
                      {/* Final Results */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {test.variants.map((variant) => {
                          const results = test.results?.variants[variant.id];
                          if (!results) return null;

                          return (
                            <Card key={variant.id} className={`${results.isWinner ? 'border-green-200 bg-green-50/50' : ''}`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">{variant.name}</CardTitle>
                                  {results.isWinner && (
                                    <Badge className="bg-green-100 text-green-700">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Winner
                                    </Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Final CTR</span>
                                    <p className="font-semibold">{results.ctr}%</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Final Conv. Rate</span>
                                    <p className="font-semibold">{results.conversionRate}%</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Total Clicks</span>
                                    <p className="font-semibold">{results.clicks.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Total Conv.</span>
                                    <p className="font-semibold">{results.conversions}</p>
                                  </div>
                                </div>
                                
                                {!variant.isControl && (
                                  <div className="pt-2 border-t">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Final Uplift</span>
                                      <span className={`text-sm font-medium ${results.uplift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {results.uplift > 0 ? '+' : ''}{results.uplift}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Confidence</span>
                                      <span className="text-sm font-medium">{results.confidence}%</span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Implementation Status */}
                      <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-green-900">Test Completed Successfully</h4>
                              <p className="text-sm text-green-700 mt-1">
                                {test.results.recommendedAction}
                              </p>
                              {test.results.statisticalSignificance && (
                                <p className="text-xs text-green-600 mt-2">
                                  ✅ Results are statistically significant
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Testing Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Test Duration</span>
                    <span className="font-semibold">16.5 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Uplift</span>
                    <span className="font-semibold text-green-600">+12.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Success Rate</span>
                    <span className="font-semibold">75%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Statistical Significance</span>
                    <span className="font-semibold">85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Elements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Action-oriented Headlines</span>
                    <Badge variant="secondary">+18% CTR</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Orange CTA Buttons</span>
                    <Badge variant="secondary">+13% Conv</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Social Proof Elements</span>
                    <Badge variant="secondary">+15% Trust</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Urgency Messaging</span>
                    <Badge variant="secondary">+22% Action</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Test Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New A/B Test</DialogTitle>
            <DialogDescription>
              Set up a new A/B test to optimize your ad performance
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-name">Test Name *</Label>
                <Input
                  id="test-name"
                  value={newTest.name}
                  onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Headline Optimization Test"
                />
              </div>
              <div>
                <Label htmlFor="primary-metric">Primary Metric</Label>
                <Select
                  value={newTest.settings?.primaryMetric}
                  onValueChange={(value) => setNewTest(prev => ({
                    ...prev,
                    settings: { ...prev.settings!, primaryMetric: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clicks">Click-through Rate</SelectItem>
                    <SelectItem value="conversions">Conversion Rate</SelectItem>
                    <SelectItem value="revenue">Revenue per Visitor</SelectItem>
                    <SelectItem value="engagement">Engagement Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="test-description">Description</Label>
              <Textarea
                id="test-description"
                value={newTest.description}
                onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you're testing and why..."
                rows={3}
              />
            </div>

            {/* Variants */}
            <div>
              <h4 className="font-semibold mb-4">Test Variants</h4>
              <div className="space-y-4">
                {newTest.variants?.map((variant, index) => (
                  <Card key={variant.id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {variant.name}
                        {variant.isControl && (
                          <Badge variant="outline">Control</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Headline</Label>
                        <Input
                          value={variant.content.headline}
                          onChange={(e) => {
                            const updatedVariants = [...(newTest.variants || [])];
                            updatedVariants[index] = {
                              ...variant,
                              content: { ...variant.content, headline: e.target.value }
                            };
                            setNewTest(prev => ({ ...prev, variants: updatedVariants }));
                          }}
                          placeholder="Enter headline..."
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={variant.content.description}
                          onChange={(e) => {
                            const updatedVariants = [...(newTest.variants || [])];
                            updatedVariants[index] = {
                              ...variant,
                              content: { ...variant.content, description: e.target.value }
                            };
                            setNewTest(prev => ({ ...prev, variants: updatedVariants }));
                          }}
                          placeholder="Enter description..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Call-to-Action</Label>
                        <Input
                          value={variant.content.cta}
                          onChange={(e) => {
                            const updatedVariants = [...(newTest.variants || [])];
                            updatedVariants[index] = {
                              ...variant,
                              content: { ...variant.content, cta: e.target.value }
                            };
                            setNewTest(prev => ({ ...prev, variants: updatedVariants }));
                          }}
                          placeholder="Enter CTA text..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Test Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Test Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Duration (days)</Label>
                    <Input
                      type="number"
                      value={newTest.settings?.duration}
                      onChange={(e) => setNewTest(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, duration: parseInt(e.target.value) || 14 }
                      }))}
                      min="1"
                      max="90"
                    />
                  </div>
                  <div>
                    <Label>Confidence Level (%)</Label>
                    <Select
                      value={newTest.settings?.confidenceLevel.toString()}
                      onValueChange={(value) => setNewTest(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, confidenceLevel: parseInt(value) }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90%</SelectItem>
                        <SelectItem value="95">95%</SelectItem>
                        <SelectItem value="99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Min Sample Size</Label>
                    <Input
                      type="number"
                      value={newTest.settings?.minSampleSize}
                      onChange={(e) => setNewTest(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, minSampleSize: parseInt(e.target.value) || 1000 }
                      }))}
                      min="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTest}>
                Create Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Details Dialog */}
      {selectedTest && (
        <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTest.name}
                <Badge className={getStatusColor(selectedTest.status)}>
                  {getStatusIcon(selectedTest.status)}
                  <span className="ml-1">{selectedTest.status.charAt(0).toUpperCase() + selectedTest.status.slice(1)}</span>
                </Badge>
              </DialogTitle>
              <DialogDescription>{selectedTest.description}</DialogDescription>
            </DialogHeader>
            
            {selectedTest.results && (
              <div className="space-y-6">
                {/* Test Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{selectedTest.results.totalImpressions.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Impressions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{selectedTest.results.totalClicks.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Clicks</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{selectedTest.results.totalConversions}</p>
                      <p className="text-sm text-muted-foreground">Conversions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{selectedTest.results.duration}</p>
                      <p className="text-sm text-muted-foreground">Days Run</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedTest.variants.map((variant) => {
                    const results = selectedTest.results?.variants[variant.id];
                    if (!results) return null;

                    return (
                      <Card key={variant.id} className={`${results.isWinner ? 'border-green-200 bg-green-50/50' : ''}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{variant.name}</span>
                            {results.isWinner && (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Winner
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Content Preview */}
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">Content:</h5>
                            <div className="text-xs space-y-1">
                              <p><strong>Headline:</strong> {variant.content.headline}</p>
                              <p><strong>Description:</strong> {variant.content.description}</p>
                              <p><strong>CTA:</strong> {variant.content.cta}</p>
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center p-2 bg-muted/20 rounded">
                              <p className="text-xs text-muted-foreground">CTR</p>
                              <p className="font-bold text-lg">{results.ctr}%</p>
                            </div>
                            <div className="text-center p-2 bg-muted/20 rounded">
                              <p className="text-xs text-muted-foreground">Conv. Rate</p>
                              <p className="font-bold text-lg">{results.conversionRate}%</p>
                            </div>
                            <div className="text-center p-2 bg-muted/20 rounded">
                              <p className="text-xs text-muted-foreground">Clicks</p>
                              <p className="font-bold">{results.clicks.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-2 bg-muted/20 rounded">
                              <p className="text-xs text-muted-foreground">Conversions</p>
                              <p className="font-bold">{results.conversions}</p>
                            </div>
                          </div>

                          {!variant.isControl && (
                            <div className="pt-3 border-t space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Uplift:</span>
                                <span className={`font-bold ${results.uplift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {results.uplift > 0 ? '+' : ''}{results.uplift}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Confidence:</span>
                                <span className="font-bold">{results.confidence}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${results.confidence}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};