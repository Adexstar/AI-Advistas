import { DecisionService } from "./DecisionService";
import { LearningService } from "./LearningService";
import { sb } from "./supabase";
import type { LearnedSuggestion } from "./suggestionLearning";

export type SuggestionStatus = "accepted" | "dismissed" | "applied" | "rejected";

export async function resolveSuggestion(input: {
  id: string;
  status: SuggestionStatus;
  userId?: string | null;
  sourceType?: string;
  sourceLabel?: string;
  confidence?: number;
  context?: Record<string, unknown>;
}): Promise<void> {
  await DecisionService.resolve(input.id, input.status);

  let userId = input.userId ?? null;
  let sourceType = input.sourceType;
  let confidence = input.confidence;
  if (!userId || !sourceType) {
    const { data } = await sb
      .from("decisions")
      .select("user_id,action,category,confidence,metadata")
      .eq("id", input.id)
      .maybeSingle();
    userId = userId ?? data?.user_id ?? null;
    const angle = data?.metadata?.angle;
    sourceType = sourceType ?? (typeof angle === "string" ? angle : null) ?? data?.category ?? data?.action ?? "suggestion";
    if (confidence == null && data?.confidence != null) confidence = Number(data.confidence);
  }

  if (!userId) return;
  await LearningService.recordEvent({
    userId,
    sourceType: String(sourceType),
    sourceLabel: input.sourceLabel,
    action: input.status,
    confidence,
    decisionId: input.id,
    context: input.context,
  });
}

export async function commitSuggestion(input: {
  userId: string;
  status: SuggestionStatus;
  suggestion: LearnedSuggestion;
  page?: string;
}): Promise<string> {
  let id = input.suggestion.decisionId;
  const confidence = input.suggestion.confidence > 1
    ? input.suggestion.confidence / 100
    : input.suggestion.confidence;
  if (!id) {
    const row = await DecisionService.record(input.userId, {
      page: input.page ?? (typeof window !== "undefined" ? window.location.pathname : "/dashboard"),
      trigger_source: "learning",
      category: input.suggestion.angle,
      campaign_id: input.suggestion.campaignId,
      signal: input.suggestion.title,
      action: input.suggestion.angle,
      reasoning: input.suggestion.reasoning,
      confidence,
      metadata: { angle: input.suggestion.angle, preview: input.suggestion.preview },
    });
    id = row.id;
  }
  await resolveSuggestion({
    id,
    status: input.status,
    userId: input.userId,
    sourceType: input.suggestion.angle,
    sourceLabel: input.suggestion.title,
    confidence,
    context: { preview: input.suggestion.preview, campaignId: input.suggestion.campaignId },
  });
  return id;
}
