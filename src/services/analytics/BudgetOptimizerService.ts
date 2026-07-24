import type { UnifiedCampaignAnalytics } from './types';

export interface BudgetShiftSuggestion {
  from: string;
  to: string;
  amount: number;
  expectedLift: number;
  reasoning: string;
  confidence: number;
}

export const BudgetOptimizerService = {
  suggestShifts(unified: UnifiedCampaignAnalytics): BudgetShiftSuggestion[] {
    const suggestions: BudgetShiftSuggestion[] = [];
    if (unified.byPlatform.length < 2) return suggestions;
    const sorted = [...unified.byPlatform].sort((a, b) => b.roas - a.roas);
    const winner = sorted[0];
    const loser = sorted[sorted.length - 1];
    if (winner.roas > loser.roas * 1.2 && loser.spend > 50) {
      const amount = Math.round(loser.spend * 0.2);
      suggestions.push({
        from: loser.platform,
        to: winner.platform,
        amount,
        expectedLift: Math.round(((winner.roas - loser.roas) / loser.roas) * 100 * 0.4),
        reasoning: `${winner.platform} is delivering ${winner.roas.toFixed(1)}x ROAS vs ${loser.roas.toFixed(1)}x on ${loser.platform}.`,
        confidence: 82,
      });
    }
    return suggestions;
  },
};
