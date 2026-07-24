import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAIContext } from './AIContext';
import { MarketingBrain, type BrainResponse, type BrainRequest, type ProactiveSignal } from '@/services/ai/MarketingBrain';
import { LearningService, type LearningEvent, type LearningSummary } from '@/services/ai/LearningService';
import type { AIMode } from '@/services/ai/types';

export interface AIBrainState {
  processing: boolean;
  lastResponse: BrainResponse | null;
  signals: ProactiveSignal[];
  learningSummary: LearningSummary[];
}

export interface AIBrainActions {
  process: (intent: string, extraVars?: Record<string, string>) => Promise<BrainResponse>;
  recordFeedback: (event: LearningEvent) => Promise<string | null>;
  refreshSignals: () => Promise<void>;
  refreshLearning: () => Promise<void>;
}

type AIBrainValue = AIBrainState & AIBrainActions;

const AIBrainContext = createContext<AIBrainValue | null>(null);

export function AIBrainProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { effectiveContext } = useAIContext();
  const [processing, setProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<BrainResponse | null>(null);
  const [signals, setSignals] = useState<ProactiveSignal[]>([]);
  const [learningSummary, setLearningSummary] = useState<LearningSummary[]>([]);

  const process = useCallback(async (intent: string, extraVars?: Record<string, string>): Promise<BrainResponse> => {
    if (!user) throw new Error('Not authenticated');
    setProcessing(true);
    try {
      const request: BrainRequest = {
        intent,
        context: effectiveContext,
        mode: (effectiveContext?.active_objective as AIMode) ?? 'assisted',
        page: window.location.pathname,
        userId: user.id,
        extraVars,
      };
      const response = await MarketingBrain.process(request);
      setLastResponse(response);
      return response;
    } finally {
      setProcessing(false);
    }
  }, [user, effectiveContext]);

  const recordFeedback = useCallback(async (event: LearningEvent): Promise<string | null> => {
    return LearningService.record(event);
  }, []);

  const refreshSignals = useCallback(async () => {
    if (!user || !effectiveContext) return;
    try {
      const result = await MarketingBrain.getProactiveSignals(effectiveContext, user.id);
      setSignals(result);
    } catch {
      /* non-critical */
    }
  }, [user, effectiveContext]);

  const refreshLearning = useCallback(async () => {
    if (!user) return;
    try {
      const summary = await LearningService.getSummary(user.id);
      setLearningSummary(summary);
    } catch {
      /* non-critical */
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshSignals();
      refreshLearning();
    }
  }, [user, refreshSignals, refreshLearning]);

  const value: AIBrainValue = {
    processing, lastResponse, signals, learningSummary,
    process, recordFeedback, refreshSignals, refreshLearning,
  };

  return (
    <AIBrainContext.Provider value={value}>
      {children}
    </AIBrainContext.Provider>
  );
}

export function useAIBrain(): AIBrainValue {
  const ctx = useContext(AIBrainContext);
  if (!ctx) throw new Error('useAIBrain must be used within AIBrainProvider');
  return ctx;
}
