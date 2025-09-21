import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Lightbulb, Loader2 } from 'lucide-react';
import { SimulatorScore } from '@/hooks/useSimulateAd';

interface AdScorePanelProps {
  score?: SimulatorScore;
  isLoading?: boolean;
}

export const AdScorePanel: React.FC<AdScorePanelProps> = ({ score, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI Ad Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Analyzing ad performance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI Ad Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Create an ad to see performance analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const };
    return { label: 'Needs Work', variant: 'destructive' as const };
  };

  const scoreBadge = getScoreBadge(score.qualityScore);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          AI Ad Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-2">
          <div className={`text-4xl font-bold ${getScoreColor(score.qualityScore)}`}>
            {score.qualityScore}
          </div>
          <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
          <Progress value={score.qualityScore} className="w-full" />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Expected CTR
            </div>
            <div className="text-xl font-semibold text-primary">
              {score.ctrEstimate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Confidence</div>
            <div className="text-xl font-semibold">
              {Math.round(score.confidence * 100)}%
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {score.suggestions && score.suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Suggestions
            </div>
            <ul className="space-y-2">
              {score.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground pl-6 relative">
                  <span className="absolute left-0 top-1 w-2 h-2 bg-primary rounded-full"></span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};