export interface CampaignTrackRecord {
  id: string;
  name: string;
  objective: string;
  platform: string | null;
  ctr: number;
  roas: number;
  budget: number;
  spend: number;
  revenue: number;
  budgetEfficiency: number;
  creativeStyle: string | null;
}

export interface AngleTally {
  accepted: number;
  applied: number;
  dismissed: number;
  rejected: number;
}

export interface LearnedSuggestion {
  angle: string;
  title: string;
  reasoning: string;
  preview: string;
  confidence: number;
  campaignId: string | null;
  decisionId: string | null;
}

export interface ExperienceDecision {
  id?: string;
  status: string;
  action?: string | null;
  category?: string | null;
  signal?: string | null;
  reasoning?: string | null;
  confidence?: number | null;
  campaign_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function budgetEfficiency(budget: number, spend: number, revenue: number): number {
  if (budget > 0) return revenue / budget;
  if (spend > 0) return revenue / spend;
  return 0;
}

export function creativeStyleFrom(...sources: unknown[]): string | null {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const record = source as Record<string, unknown>;
    for (const key of ["creative_style", "creativeStyle", "style", "format", "ad_type", "adType"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return null;
}

export function decisionAngle(decision: Pick<ExperienceDecision, "action" | "category" | "metadata">): string {
  const angle = decision.metadata?.angle;
  if (typeof angle === "string" && angle.trim()) return angle.trim().toLowerCase();
  if (decision.category && decision.category.toLowerCase() !== "general") return decision.category.toLowerCase();
  return (decision.action ?? "").trim().toLowerCase();
}

export function tallyDecisions(decisions: ExperienceDecision[]): Map<string, AngleTally> {
  const map = new Map<string, AngleTally>();
  for (const decision of decisions) {
    if (decision.status === "pending") continue;
    const key = decisionAngle(decision);
    if (!key) continue;
    const tally = map.get(key) ?? { accepted: 0, applied: 0, dismissed: 0, rejected: 0 };
    if (decision.status === "accepted") tally.accepted += 1;
    else if (decision.status === "applied") tally.applied += 1;
    else if (decision.status === "dismissed") tally.dismissed += 1;
    else if (decision.status === "rejected") tally.rejected += 1;
    map.set(key, tally);
  }
  return map;
}

/** 0 hides an angle the user keeps rejecting. 2 boosts an angle they keep accepting. */
export function angleWeight(tally?: AngleTally): number {
  if (!tally) return 1;
  const positive = tally.accepted + tally.applied;
  const negative = tally.rejected + tally.dismissed;
  if (negative >= 2 && positive === 0) return 0;
  if (positive >= 2 && negative === 0) return 2;
  return Math.max(0, 1 + (positive - negative) * 0.25);
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function displayConfidence(value: number | null | undefined): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n <= 1 ? n * 100 : n);
}

export function learnSuggestions(input: {
  focus?: CampaignTrackRecord | null;
  track: CampaignTrackRecord[];
  decisions: ExperienceDecision[];
}): LearnedSuggestion[] {
  const tally = tallyDecisions(input.decisions);
  const pendingByAngle = new Map<string, string>();
  for (const decision of input.decisions) {
    if (decision.status !== "pending" || !decision.id) continue;
    const angle = decisionAngle(decision);
    if (angle && !pendingByAngle.has(angle)) pendingByAngle.set(angle, decision.id);
  }

  const pool = [...input.track];
  if (input.focus && !pool.some((row) => row.id === input.focus!.id)) pool.unshift(input.focus);
  const measured = pool.filter((row) => row.ctr > 0 || row.roas > 0 || row.revenue > 0);
  const drafts: Array<Omit<LearnedSuggestion, "confidence" | "decisionId"> & { base: number }> = [];

  const byStyle = new Map<string, CampaignTrackRecord[]>();
  for (const row of measured) {
    if (!row.creativeStyle) continue;
    const list = byStyle.get(row.creativeStyle) ?? [];
    list.push(row);
    byStyle.set(row.creativeStyle, list);
  }
  let bestStyle: { style: string; ctr: number; names: string[] } | null = null;
  for (const [style, rows] of byStyle) {
    const ctr = rows.reduce((sum, row) => sum + row.ctr, 0) / rows.length;
    if (!bestStyle || ctr > bestStyle.ctr) bestStyle = { style, ctr, names: rows.map((row) => row.name) };
  }
  if (bestStyle) {
    const focus = input.focus;
    const alreadyUsingIt = !!focus?.creativeStyle && focus.creativeStyle.toLowerCase() === bestStyle.style.toLowerCase();
    const focusIsWeaker = !!focus && focus.ctr > 0 && focus.ctr < bestStyle.ctr && !alreadyUsingIt;
    if (!focus || focusIsWeaker) {
      drafts.push({
        angle: `style:${bestStyle.style.toLowerCase()}`,
        title: `Lean on ${bestStyle.style}`,
        reasoning: `${bestStyle.names.slice(0, 2).join(" and ")} averaged ${bestStyle.ctr.toFixed(2)}% CTR with ${bestStyle.style}.`,
        preview: `The next creative would use ${bestStyle.style}. This card does not replace the current artwork.`,
        campaignId: focus?.id ?? null,
        base: measured.length >= 3 ? 84 : measured.length === 2 ? 74 : 62,
      });
    }
  }

  const byObjective = new Map<string, CampaignTrackRecord[]>();
  for (const row of measured) {
    if (!row.objective) continue;
    const list = byObjective.get(row.objective) ?? [];
    list.push(row);
    byObjective.set(row.objective, list);
  }
  let bestObjective: { objective: string; roas: number; efficiency: number; name: string } | null = null;
  for (const [objective, rows] of byObjective) {
    const roas = rows.reduce((sum, row) => sum + row.roas, 0) / rows.length;
    const efficiency = rows.reduce((sum, row) => sum + row.budgetEfficiency, 0) / rows.length;
    if (roas < 2) continue;
    if (!bestObjective || roas > bestObjective.roas) {
      bestObjective = { objective, roas, efficiency, name: rows[0].name };
    }
  }
  if (bestObjective) {
    const efficiency = bestObjective.efficiency > 0 ? `, ${bestObjective.efficiency.toFixed(2)}x return on budget` : "";
    drafts.push({
      angle: `scale:${bestObjective.objective.toLowerCase()}`,
      title: `Put more behind ${bestObjective.objective}`,
      reasoning: `${bestObjective.name} returned ${bestObjective.roas.toFixed(2)}x ROAS on ${bestObjective.objective}${efficiency}.`,
      preview: `A later budget change would favor ${bestObjective.objective}. This card does not move money.`,
      campaignId: input.focus?.id ?? null,
      base: 78,
    });
  }

  const focus = input.focus;
  if (focus && focus.ctr > 0 && focus.platform) {
    const ctrs = measured.map((row) => row.ctr).filter((value) => value > 0);
    const mid = median(ctrs);
    if (ctrs.length >= 2 && focus.ctr < mid * 0.8) {
      drafts.push({
        angle: `format:${focus.platform.toLowerCase()}`,
        title: `Ease off ${focus.platform}`,
        reasoning: `${focus.name} CTR is ${focus.ctr.toFixed(2)}%, under your ${mid.toFixed(2)}% median.`,
        preview: `${focus.platform} would be de-emphasized. ${focus.name} stays live until you change it.`,
        campaignId: focus.id,
        base: 76,
      });
    }
  }

  return drafts
    .map((draft) => {
      const weight = angleWeight(tally.get(draft.angle));
      const acceptedBefore = weight >= 2;
      return {
        angle: draft.angle,
        title: draft.title,
        reasoning: acceptedBefore
          ? `${draft.reasoning} You have accepted this direction before, so it is weighted higher.`
          : draft.reasoning,
        preview: draft.preview,
        confidence: weight === 0 ? 0 : Math.min(95, Math.round(draft.base * weight)),
        campaignId: draft.campaignId,
        decisionId: pendingByAngle.get(draft.angle) ?? null,
        weight,
      };
    })
    .filter((draft) => draft.weight > 0)
    .sort((a, b) => b.weight - a.weight || b.confidence - a.confidence)
    .map(({ weight: _weight, ...suggestion }) => suggestion);
}

export function pendingAsSuggestions(decisions: ExperienceDecision[]): LearnedSuggestion[] {
  return decisions
    .filter((decision) => decision.status === "pending" && decision.id)
    .map((decision) => {
      const preview = decision.metadata?.preview;
      return {
        angle: decisionAngle(decision) || decision.id!,
        title: decision.action || decision.signal || "Suggestion",
        reasoning: decision.reasoning || "Recorded from an earlier recommendation.",
        preview: typeof preview === "string" && preview
          ? preview
          : "Accepting records your choice. The campaign is not edited from this card.",
        confidence: displayConfidence(decision.confidence),
        campaignId: decision.campaign_id ?? null,
        decisionId: decision.id!,
      };
    });
}

export function mergeSuggestions(learned: LearnedSuggestion[], pending: LearnedSuggestion[]): LearnedSuggestion[] {
  const seen = new Set(learned.map((item) => item.angle));
  const extra = pending.filter((item) => !seen.has(item.angle) && !learned.some((row) => row.decisionId && row.decisionId === item.decisionId));
  return [...learned, ...extra];
}
