import { useQuery } from '@tanstack/react-query';
import { Clock, Copy, Edit3, Send, LayoutTemplate, PauseCircle, Play, Archive, GitBranch, DollarSign, Target, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignEventService } from '@/services/campaign/CampaignEventService';
import type { CampaignEvent, CampaignEventType } from '@/services/campaign/types';

const EVENT_ICONS: Record<string, React.ElementType> = {
  campaign_created: Copy,
  campaign_status_changed: Edit3,
  template_selected: LayoutTemplate,
  creative_edited: Edit3,
  headline_changed: Edit3,
  budget_updated: DollarSign,
  audience_updated: Target,
  published: Send,
  paused: PauseCircle,
  resumed: Play,
  finished: Archive,
  archived: Archive,
  version_created: GitBranch,
  version_restored: GitBranch,
  recommendation_applied: Sparkles,
  rule_triggered: Sparkles,
};

function getEventIcon(eventType: string): React.ElementType {
  return EVENT_ICONS[eventType] || Clock;
}

interface Props {
  campaignId: string;
  limit?: number;
}

export function CampaignTimeline({ campaignId, limit = 50 }: Props) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['campaign-events', campaignId],
    queryFn: () => CampaignEventService.list(campaignId, limit),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No events yet</p>
          <p className="text-sm text-muted-foreground">Campaign timeline will populate as actions are taken.</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="relative">
      <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border" />
      <div className="space-y-0 rounded-2xl border bg-card">
        {sorted.map((event, i) => {
          const Icon = getEventIcon(event.event_type);
          return (
            <div
              key={event.id}
              className="relative flex items-start gap-4 border-b px-5 py-4 last:border-0 hover:bg-muted/30 transition-colors"
            >
              <div className="relative z-10 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{event.event_label || event.event_type.replace(/_/g, ' ')}</p>
                  {event.actor === 'system' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">AI</span>
                  )}
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                )}
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
              {i === 0 && (
                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Latest
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
