// Compatibility hook; AIContext owns all global AI state.
import type { ReactNode } from 'react';
import { useAIContext } from './AIContext';
export type { AIStatus, AIStatusState } from './AIContext';
export type { AIMode } from '@/services/ai/types';
export const AIStatusProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
export const useAIStatus = useAIContext;
