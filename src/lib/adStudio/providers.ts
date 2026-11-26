// Which provider keys are set, read from the same `provider-status` function the
// editor's AI Studio uses. Unknown means the check itself failed.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProviderMap {
  /** True once the status check answered. */
  known: boolean;
  text: boolean;
  image: boolean;
  video: boolean;
  raw: Record<string, boolean>;
}

const TEXT_IDS = ['openai', 'gemini', 'groq', 'claude', 'lovable'];
const IMAGE_IDS = ['runware', 'openai'];

export function summarizeProviders(raw: Record<string, boolean> | null): ProviderMap {
  if (!raw) return { known: false, text: false, image: false, video: false, raw: {} };
  return {
    known: true,
    raw,
    text: TEXT_IDS.some((id) => raw[id] === true),
    image: IMAGE_IDS.some((id) => raw[id] === true),
    video: raw.runware === true,
  };
}

export async function fetchProviders(): Promise<ProviderMap> {
  const { data, error } = await supabase.functions.invoke('provider-status', { body: { action: 'list' } });
  if (error) return summarizeProviders(null);
  const rows = Array.isArray(data?.providers) ? data.providers : Array.isArray(data) ? data : [];
  const raw: Record<string, boolean> = {};
  for (const row of rows) {
    if (typeof row?.id === 'string') raw[row.id] = row.configured === true;
  }
  return summarizeProviders(raw);
}

export function useProviders() {
  return useQuery({
    queryKey: ['ad-studio-providers'],
    queryFn: fetchProviders,
    staleTime: 5 * 60_000,
  });
}
