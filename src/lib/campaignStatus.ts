import type { Json } from '@/integrations/supabase/types';

const LAUNCHED = new Set(['active', 'running', 'paused', 'completed']);

export function isDraftStatus(status: string | null | undefined) {
  return (status ?? '').toLowerCase() === 'draft';
}

export function isLaunchedStatus(status: string | null | undefined) {
  return LAUNCHED.has((status ?? '').toLowerCase());
}

export function isRunningStatus(status: string | null | undefined) {
  const value = (status ?? '').toLowerCase();
  return value === 'active' || value === 'running';
}

export function isPausedStatus(status: string | null | undefined) {
  return (status ?? '').toLowerCase() === 'paused';
}

export function matchesStatusTab(status: string, tab: string) {
  if (tab === 'all') return true;
  if (tab === 'active') return status === 'active' || status === 'running';
  return status === tab;
}

export function createAdPath(id: string) {
  return `/create-ad?campaignId=${encodeURIComponent(id)}&step=2`;
}

type Settings = Record<string, Json | undefined>;

function asSettings(value: Json | null | undefined): Settings {
  if (value && typeof value === 'object' && !Array.isArray(value)) return { ...value } as Settings;
  return {};
}

/** Pause keeps the status to restore: `running` resumes as `running`, everything else as `active`. */
export function pauseResumePatch(status: string, settings: Json | null): { status: string; settings: Json } {
  const current = asSettings(settings);
  if (isRunningStatus(status)) {
    return {
      status: 'paused',
      settings: { ...current, resume_status: status === 'running' ? 'running' : 'active' },
    };
  }
  const resume = current.resume_status === 'running' ? 'running' : 'active';
  delete current.resume_status;
  return { status: resume, settings: current };
}
