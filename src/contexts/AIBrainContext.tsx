// Compatibility hook; the brain uses the same effective context and mode as the UI.
import type { ReactNode } from 'react';
import { useAIContext } from './AIContext';
export type { AIBrainValue } from './AIContext';
export const AIBrainProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
export const useAIBrain = useAIContext;
