import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, X, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignRecommendationService } from '@/services/campaign/CampaignRecommendationService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { CampaignRecommendation } from '@/services/campaign/types';

interface Props {
  campaignId: string;
}

export function CampaignRecommendations({ campaignId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['campaign-recommendations', campaignId],
    queryFn: () => CampaignRecommendationService.list(campaignId, 'pending'),
  });

  const handleDismiss = async (id: string) => {
    try {
      await CampaignRecommendationService.dismiss(id);
      qc.invalidateQueries({ queryKey: ['campaign-recommendations', campaignId] });
      toast.success('Recommendation dismissed');
    } catch {
      toast.error('Failed to dismiss');
    }
  };

  const handleApply = async (id: string) => {
    try {
      await CampaignRecommendationService.apply(id, campaignId, user!.id);
      qc.invalidateQueries({ queryKey: ['campaign-recommendations', campaignId] });
      qc.invalidateQueries({ queryKey: ['campaign-events', campaignId] });
      toast.success('Recommendation applied');
    } catch {
      toast.error('Failed to apply recommendation');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No pending recommendations</p>
          <p className="text-sm text-muted-foreground">AI will generate recommendations as your campaign runs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} pending
        </p>
      </div>
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          onDismiss={() => handleDismiss(rec.id)}
          onApply={() => handleApply(rec.id)}
        />
      ))}
    </div>
  );
}

function RecommendationCard({
  recommendation: rec,
  onDismiss,
  onApply,
}: {
  recommendation: CampaignRecommendation;
  onDismiss: () => void;
  onApply: () => void;
}) {
  return (
    <Card className="rounded-2xl border border-border/60 hover:border-primary/20 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{rec.title}</h4>
              <Badge variant="secondary" className="rounded-full text-[10px] whitespace-nowrap">
                {rec.confidence}% confidence
              </Badge>
              <Badge variant="outline" className="rounded-full text-[10px] capitalize">
                {rec.recommendation_type}
              </Badge>
            </div>
            {rec.description && (
              <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
            )}
            {rec.estimated_impact && (
              <p className="mt-1 text-xs font-medium text-emerald-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {rec.estimated_impact}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="ghost" className="h-8 w-8" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-8 gap-1 rounded-xl" onClick={onApply}>
              <Check className="h-3.5 w-3.5" /> Apply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
