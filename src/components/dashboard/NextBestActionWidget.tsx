import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { useNextBestActions } from '@/hooks/useNextBestActions';
import { usePauseCampaign, useResumeCampaign, useUpdateBudget } from '@/hooks/useCampaignActions';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const NextBestActionWidget = () => {
  const { data: actions, isLoading, error } = useNextBestActions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pauseCampaign = usePauseCampaign();
  const resumeCampaign = useResumeCampaign();
  const updateBudget = useUpdateBudget();
  const navigate = useNavigate();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('Optimization')) return <Zap className="h-4 w-4" />;
    if (type.includes('Alert')) return <AlertTriangle className="h-4 w-4" />;
    if (type.includes('Scaling')) return <TrendingUp className="h-4 w-4" />;
    return <Lightbulb className="h-4 w-4" />;
  };

  const handleQuickAction = async (action: typeof actions[0]) => {
    if (!action.actionType) return;

    switch (action.actionType) {
      case 'pause':
        await pauseCampaign.mutateAsync(action.campaignId);
        break;
      case 'resume':
        await resumeCampaign.mutateAsync(action.campaignId);
        break;
      case 'increase_budget':
        navigate(`/campaigns`);
        break;
      case 'update_creative':
      case 'adjust_targeting':
        navigate(`/campaigns`);
        break;
      default:
        navigate(`/campaigns`);
    }
  };

  if (isLoading) {
    return (
      <Card className="surface-outline border-l-4 border-l-primary shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle>Next Best Actions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="surface-outline border-l-4 border-l-destructive shadow-card">
        <CardHeader>
          <CardTitle>Analysis Error</CardTitle>
          <CardDescription>Failed to load recommendations. Please try again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <Card className="surface-outline border-l-4 border-l-primary bg-gradient-to-br from-white to-secondary/45 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle>Next Best Actions</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              All Good!
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Your campaigns are performing well. No immediate actions needed.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="surface-outline border-l-4 border-l-primary shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle>Next Best Actions</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {actions.length} {actions.length === 1 ? 'Recommendation' : 'Recommendations'}
          </Badge>
        </div>
        <CardDescription>
          AI-powered recommendations to optimize your campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="popLayout">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="surface-panel overflow-hidden rounded-[24px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1 rounded-xl bg-primary/10 p-2 text-primary">
                          {getTypeIcon(action.type)}
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">{action.title}</h4>
                            <Badge variant={getPriorityColor(action.priority)} className="text-xs">
                              {action.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {action.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === action.id ? null : action.id)}
                      >
                        {expandedId === action.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {expandedId === action.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3 border-t pt-3"
                        >
                          {action.metadata && (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="space-y-1">
                                <p className="text-muted-foreground">Current</p>
                                <p className="font-medium">{action.metadata.currentValue}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">Target</p>
                                <p className="font-medium">{action.metadata.targetValue}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground">Confidence</p>
                                <p className="font-medium">{action.confidence}%</p>
                              </div>
                            </div>
                          )}
                          
                          {action.metadata?.impact && (
                            <div className="rounded-md bg-primary/5 p-3">
                              <p className="text-xs font-medium text-primary">
                                Expected Impact: {action.metadata.impact}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleQuickAction(action)}
                              disabled={pauseCampaign.isPending || resumeCampaign.isPending || updateBudget.isPending}
                              className="flex-1"
                            >
                              {action.suggestedAction}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate('/campaigns')}
                            >
                              View Campaign
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
