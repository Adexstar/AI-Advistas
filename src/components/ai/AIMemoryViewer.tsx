import { useQuery } from '@tanstack/react-query';
import { Brain, TrendingUp, TrendingDown, Lightbulb, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { LearningService } from '@/services/ai/LearningService';
import { BrandIntelligenceService } from '@/services/ai/BrandIntelligenceService';

interface Props {
  brandId?: string;
  className?: string;
}

export function AIMemoryViewer({ brandId, className }: Props) {
  const { user } = useAuth();

  const { data: learningData, isLoading: learningLoading } = useQuery({
    queryKey: ['ai-learning-summary', user?.id],
    enabled: !!user,
    queryFn: () => LearningService.getSummary(user!.id),
  });

  const { data: brandMemory, isLoading: memoryLoading } = useQuery({
    queryKey: ['brand-memory', user?.id],
    enabled: !!user,
    queryFn: () => BrandIntelligenceService.getBrandMemory(user!.id),
  });

  const loading = learningLoading || memoryLoading;

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Brand Memory */}
      {brandMemory && (
        <div className="rounded-xl border border-purple-100 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Brand Memory</h4>
          </div>

          {brandMemory.topHeadlines.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1">Top Performing Headlines</p>
              <div className="flex flex-wrap gap-1">
                {brandMemory.topHeadlines.slice(0, 5).map((h, i) => (
                  <span key={i} className="text-[10px] text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 font-medium">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {brandMemory.topCtasets.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1">Best CTAs</p>
              <div className="flex flex-wrap gap-1">
                {brandMemory.topCtasets.slice(0, 5).map((c, i) => (
                  <span key={i} className="text-[10px] text-blue-700 bg-blue-50 rounded-full px-2 py-0.5 font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {brandMemory.bestPerformingFormats.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1">Best Formats</p>
              <div className="flex flex-wrap gap-1">
                {brandMemory.bestPerformingFormats.slice(0, 5).map((f, i) => (
                  <span key={i} className="text-[10px] text-purple-700 bg-purple-50 rounded-full px-2 py-0.5 font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {brandMemory.failedApproaches.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1">Learnings (What Didn't Work)</p>
              <div className="flex flex-wrap gap-1">
                {brandMemory.failedApproaches.slice(0, 3).map((f, i) => (
                  <span key={i} className="text-[10px] text-red-600 bg-red-50 rounded-full px-2 py-0.5 flex items-center gap-1">
                    <AlertCircle className="h-2.5 w-2.5" /> {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Learning Summary */}
      {learningData && learningData.length > 0 && (
        <div className="rounded-xl border border-purple-100 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">AI Learning</h4>
          </div>

          <div className="space-y-2">
            {learningData.slice(0, 6).map((item) => {
              const acceptRate = item.totalCount > 0 ? item.acceptedCount / item.totalCount : 0;
              return (
                <div key={item.sourceType} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {acceptRate >= 0.7 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-400 shrink-0" />
                    )}
                    <span className="text-xs text-gray-700 capitalize truncate">
                      {item.sourceType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-gray-400">{item.totalCount}</span>
                    <span className={cn(
                      'text-[10px] font-semibold',
                      acceptRate >= 0.7 ? 'text-emerald-600' : acceptRate >= 0.4 ? 'text-amber-600' : 'text-red-600',
                    )}>
                      {Math.round(acceptRate * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!brandMemory && (!learningData || learningData.length === 0) && (
        <div className="text-center py-8">
          <Brain className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No AI memory yet. Create campaigns and use AI suggestions to build your profile.</p>
        </div>
      )}
    </div>
  );
}
