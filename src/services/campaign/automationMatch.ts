import type { AutomationRuleConfig } from "./types";

export interface CampaignSignals {
  cpa: number | null;
  roas: number | null;
  ctr: number | null;
  budget: number | null;
  spend: number | null;
}

export interface RuleCheck {
  matched: boolean;
  detail: string;
}

export function signalsFromMetrics(row: {
  spend?: number | null;
  conversions?: number | null;
  roas?: number | null;
  ctr?: number | null;
  budget?: number | null;
}): CampaignSignals {
  const spend = Number(row.spend ?? 0);
  const conversions = Number(row.conversions ?? 0);
  return {
    cpa: conversions > 0 ? spend / conversions : null,
    roas: row.roas == null ? null : Number(row.roas),
    ctr: row.ctr == null ? null : Number(row.ctr),
    budget: row.budget == null ? null : Number(row.budget),
    spend,
  };
}

export function checkRule(rule: Pick<AutomationRuleConfig, "enabled" | "trigger">, signals: CampaignSignals): RuleCheck {
  if (!rule.enabled) return { matched: false, detail: "Rule is off." };
  const threshold = rule.trigger.threshold ?? 0;

  switch (rule.trigger.type) {
    case "cpa_exceeded":
      if (signals.cpa == null) return { matched: false, detail: "CPA needs at least one recorded conversion." };
      return signals.cpa > threshold
        ? { matched: true, detail: `CPA ${signals.cpa.toFixed(2)} is above ${threshold}.` }
        : { matched: false, detail: `CPA ${signals.cpa.toFixed(2)} is within ${threshold}.` };
    case "roas_above":
      if (signals.roas == null) return { matched: false, detail: "ROAS is not recorded for this campaign." };
      return signals.roas > threshold
        ? { matched: true, detail: `ROAS ${signals.roas.toFixed(2)} is above ${threshold}.` }
        : { matched: false, detail: `ROAS ${signals.roas.toFixed(2)} is not above ${threshold}.` };
    case "ctr_dropped":
      if (signals.ctr == null) return { matched: false, detail: "CTR is not recorded for this campaign." };
      return signals.ctr < threshold
        ? { matched: true, detail: `CTR ${signals.ctr.toFixed(2)} is below ${threshold}.` }
        : { matched: false, detail: `CTR ${signals.ctr.toFixed(2)} is not below ${threshold}.` };
    case "budget_depleted": {
      if (!signals.budget) return { matched: false, detail: "This campaign has no budget to compare." };
      const ratio = signals.spend / signals.budget;
      return ratio >= 0.8
        ? { matched: true, detail: `${Math.round(ratio * 100)}% of the budget is spent.` }
        : { matched: false, detail: `${Math.round(ratio * 100)}% of the budget is spent.` };
    }
    case "creative_fatigue":
      return { matched: false, detail: "Frequency is not recorded, so creative fatigue cannot be checked." };
    default:
      return { matched: false, detail: "This trigger is not checked from the campaign workspace." };
  }
}

export function budgetAfterAction(current: number, action: AutomationRuleConfig["action"]): number | null {
  const amount = Number(action.value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (action.type === "increase_budget") return Math.round((current + amount) * 100) / 100;
  if (action.type === "decrease_budget") return Math.max(0, Math.round((current - amount) * 100) / 100);
  return null;
}
