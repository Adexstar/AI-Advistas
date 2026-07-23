import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import type { CampaignHealth } from '@/services/campaign/types';

const STATUS_COLORS = {
  excellent: { label: 'Excellent', color: '#22C55E', bg: 'bg-emerald-500' },
  good: { label: 'Good', color: '#3B82F6', bg: 'bg-blue-500' },
  fair: { label: 'Fair', color: '#F59E0B', bg: 'bg-amber-500' },
  attention: { label: 'Needs Attention', color: '#EF4444', bg: 'bg-red-500' },
};

function getStatus(score: number) {
  if (score >= 90) return STATUS_COLORS.excellent;
  if (score >= 75) return STATUS_COLORS.good;
  if (score >= 50) return STATUS_COLORS.fair;
  return STATUS_COLORS.attention;
}

interface Props {
  health: CampaignHealth;
}

export function CampaignHealthDashboard({ health }: Props) {
  const overallStatus = getStatus(health.overall);

  return (
    <section>
      <h3 className="text-lg font-bold mb-4">Campaign Health</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-2xl border-2" style={{ borderColor: overallStatus.color + '30' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Overall Health</p>
              <span className="text-2xl font-extrabold" style={{ color: overallStatus.color }}>
                {health.overall}%
              </span>
            </div>
            <Progress
              value={health.overall}
              className="h-2.5 mb-2"
              style={{ background: '#F0F0F5' }}
            />
            <div className="flex items-center gap-1.5" style={{ color: overallStatus.color }}>
              <Sparkles className="h-3 w-3" />
              <span className="text-xs font-medium">{overallStatus.label}</span>
            </div>
          </CardContent>
        </Card>

        <HealthMetric label="Creative Quality" value={health.creative_quality} color="#22C55E" />
        <HealthMetric label="Audience Match" value={health.audience_match} color="#3B82F6" />
        <HealthMetric label="Budget Efficiency" value={health.budget_efficiency} color="#F59E0B" />
        <HealthMetric label="Optimization Level" value={health.optimization_level} color="#8B5CF6" />
      </div>
    </section>
  );
}

function HealthMetric({ label, value, color }: { label: string; value: number; color: string }) {
  const status = getStatus(value);
  return (
    <Card className="rounded-2xl border border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="text-lg font-extrabold" style={{ color }}>{value}%</span>
        </div>
        <Progress value={value} className="h-2" style={{ background: '#F0F0F5' }} />
        <p className="text-[11px] text-muted-foreground mt-1.5">{status.label}</p>
      </CardContent>
    </Card>
  );
}
