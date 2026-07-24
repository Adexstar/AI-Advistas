import { cn } from '@/lib/utils';

interface Props {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  very_high: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-500/30' },
  high: { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-500/30' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-500/30' },
  low: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-500/30' },
  very_low: { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-500/30' },
};

function getLabel(score: number): string {
  if (score >= 90) return 'very_high';
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  if (score >= 25) return 'low';
  return 'very_low';
}

const LABEL_TEXT: Record<string, string> = {
  very_high: 'Very High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  very_low: 'Very Low',
};

export function ConfidenceBadge({ score, label, size = 'md', showLabel = true, className }: Props) {
  const level = label ?? getLabel(score);
  const colors = COLORS[level] ?? COLORS.medium;
  const sizeClasses = {
    sm: 'h-1.5 w-12 text-[10px]',
    md: 'h-2 w-16 text-xs',
    lg: 'h-2.5 w-24 text-sm',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], colors.bg, 'ring-1', colors.ring)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors.text.replace('text-', 'bg-'))}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('font-semibold', size === 'lg' ? 'text-sm' : 'text-xs', colors.text)}>
          {score}%
        </span>
      )}
    </div>
  );
}
