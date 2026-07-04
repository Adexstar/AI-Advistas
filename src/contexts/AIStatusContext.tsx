import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type AIStatus = "ready" | "working" | "approval" | "learning";
export type AIMode = "manual" | "assisted" | "smart" | "growth";

export interface AIStatusState {
  status: AIStatus;
  mode: AIMode;
  category: string;
  detail?: string;
}

interface AIStatusContextValue extends AIStatusState {
  setStatus: (s: AIStatus, detail?: string) => void;
  setMode: (m: AIMode) => void;
  setCategory: (c: string) => void;
}

const AIStatusContext = createContext<AIStatusContextValue | null>(null);

export const AIStatusProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AIStatusState>({
    status: "ready",
    mode: "manual",
    category: "General",
  });

  const value = useMemo<AIStatusContextValue>(
    () => ({
      ...state,
      setStatus: (status, detail) => setState((s) => ({ ...s, status, detail })),
      setMode: (mode) => setState((s) => ({ ...s, mode })),
      setCategory: (category) => setState((s) => ({ ...s, category })),
    }),
    [state]
  );

  return <AIStatusContext.Provider value={value}>{children}</AIStatusContext.Provider>;
};

export const useAIStatus = () => {
  const ctx = useContext(AIStatusContext);
  if (!ctx) throw new Error("useAIStatus must be used inside AIStatusProvider");
  return ctx;
};
