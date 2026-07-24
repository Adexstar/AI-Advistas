import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ConfidenceResult } from '@/services/ai/ConfidenceEngine';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Props {
  title: string;
  content: string;
  specialist: string;
  confidence: ConfidenceResult;
  evidence?: string;
  expectedImprovement?: number | null;
  onAccept?: () => void;
  onReject?: () => void;
  onDismiss?: () => void;
  onApply?: () => void;
  className?: string;
}

const SPECIALIST_LABELS: Record<string, string> = {
  creative_strategist: 'Creative Strategist',
  design_advisor: 'Design Advisor',
  brand_guardian: 'Brand Guardian',
  campaign_optimizer: 'Campaign Optimizer',
  analytics_expert: 'Analytics Expert',
  publishing_advisor: 'Publishing Advisor',
  general: 'AI Assistant',
};

export function AIExplanation({
  title, content, specialist, confidence, evidence,
  expectedImprovement, onAccept, onReject, onDismiss, onApply, className,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const lowConfidence = confidence.score < 45;

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-3 transition-all',
      lowConfidence ? 'border-orange-200 bg-orange-50/30' : 'border-purple-200 bg-purple-50/30',
      className,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 bg-purple-100 rounded-full px-2 py-0.5">
              {SPECIALIST_LABELS[specialist] ?? specialist}
            </span>
            {expectedImprovement != null && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5">
                +{expectedImprovement}% expected
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        </div>
        <ConfidenceBadge score={confidence.score} size="md" />
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{content}</p>

      {evidence && (
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-white/60 rounded-lg p-2.5">
          <span className="text-purple-500 font-bold mt-0.5">!</span>
          <span>{evidence}</span>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-medium text-purple-600 hover:text-purple-700 transition"
      >
        {expanded ? 'Hide reasoning' : 'Show reasoning'}
      </button>

      {expanded && (
        <div className="space-y-2 bg-white/70 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Confidence Factors</p>
          {confidence.factors.map((factor, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-medium">{factor.name}</span>
                  <span className={cn(
                    'font-semibold',
                    factor.score >= 0.7 ? 'text-emerald-600' : factor.score >= 0.4 ? 'text-amber-600' : 'text-red-600',
                  )}>
                    {Math.round(factor.score * 100)}%
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">{factor.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {(onApply || onAccept || onReject || onDismiss) && (
        <div className="flex items-center gap-2 pt-1">
          {onApply && (
            <button
              onClick={onApply}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
            >
              Apply
            </button>
          )}
          {onAccept && (
            <button
              onClick={onAccept}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition"
            >
              Accept
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Reject
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
