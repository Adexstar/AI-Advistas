import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { DecisionService } from "@/services/ai/DecisionService";
import { LearningService } from "@/services/ai/LearningService";
import { commitSuggestion, type SuggestionStatus } from "@/services/ai/resolveSuggestion";
import {
  learnSuggestions,
  mergeSuggestions,
  pendingAsSuggestions,
  type CampaignTrackRecord,
  type LearnedSuggestion,
} from "@/services/ai/suggestionLearning";

export function useLearnedSuggestions(focus?: CampaignTrackRecord | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const decisions = useQuery({
    queryKey: ["ai-decisions", user?.id],
    enabled: !!user,
    queryFn: () => DecisionService.list(user!.id, { limit: 80 }),
  });
  const track = useQuery({
    queryKey: ["ai-track", user?.id],
    enabled: !!user,
    queryFn: () => LearningService.getTrackRecord(user!.id),
  });

  const enrichedFocus = useMemo(() => {
    if (!focus) return null;
    const match = (track.data ?? []).find((row) => row.id === focus.id);
    return match?.creativeStyle ? { ...focus, creativeStyle: match.creativeStyle } : focus;
  }, [focus, track.data]);

  const suggestions = useMemo(() => {
    const history = decisions.data ?? [];
    const learned = learnSuggestions({ focus: enrichedFocus, track: track.data ?? [], decisions: history });
    return mergeSuggestions(learned, pendingAsSuggestions(history));
  }, [decisions.data, track.data, enrichedFocus]);

  const resolve = async (suggestion: LearnedSuggestion, status: SuggestionStatus) => {
    if (!user) return;
    await commitSuggestion({ userId: user.id, status, suggestion });
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["ai-decisions"] }),
      qc.invalidateQueries({ queryKey: ["ai-track"] }),
    ]);
  };

  return {
    suggestions,
    track: track.data ?? [],
    isLoading: !!user && (decisions.isLoading || track.isLoading),
    refetch: () => Promise.all([decisions.refetch(), track.refetch()]),
    resolve,
  };
}
