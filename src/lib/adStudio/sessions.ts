// Ad Studio sessions: the prompt, files, style, format, plan, status and result.
// They live in `ad_studio_sessions` (row-level security, owner only). Browser
// storage mirrors every save so work survives a refresh, and carries the
// session on its own if the table is not available yet.

import { supabase } from '@/integrations/supabase/client';
import type { StudioPlan } from './plan';
import type { FormatId } from './formats';
import { DEFAULT_FORMAT } from './formats';

const sb: any = supabase;

export type SessionStatus = 'draft' | 'planning' | 'plan' | 'building' | 'ready' | 'failed';
export type FileKind = 'image' | 'video' | 'logo' | 'design';

export interface AttachedFile {
  id: string;
  kind: FileKind;
  name: string;
  /** Persistent URL (signed storage URL, or a design preview). */
  url: string;
  path?: string;
  designId?: string;
  mime?: string;
}

export interface StudioVariation {
  label: string;
  designId: string;
  previewUrl: string;
}

export interface StudioResult {
  designId: string;
  previewUrl: string;
  notes: string[];
  videoUrl?: string;
  variations?: StudioVariation[];
  builtAt: string;
}

export interface StudioSession {
  id: string;
  title: string;
  prompt: string;
  formatId: FormatId;
  ratio: string;
  length: number;
  styleId: string | null;
  useBrandKit: boolean;
  files: AttachedFile[];
  plan: StudioPlan | null;
  status: SessionStatus;
  result: StudioResult | null;
  designId: string | null;
  updatedAt: string;
  createdAt: string;
  /** Last failure, shown with a Try again button. */
  error?: string | null;
}

export const newSessionId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`;

export function blankSession(partial: Partial<StudioSession> = {}): StudioSession {
  const now = new Date().toISOString();
  return {
    id: newSessionId(),
    title: 'Untitled ad',
    prompt: '',
    formatId: DEFAULT_FORMAT,
    ratio: '9:16',
    length: 15,
    styleId: null,
    useBrandKit: true,
    files: [],
    plan: null,
    status: 'draft',
    result: null,
    designId: null,
    createdAt: now,
    updatedAt: now,
    error: null,
    ...partial,
  };
}

/** Label shown on the Recent strip. */
export function recentLabel(session: Pick<StudioSession, 'status'>): 'Plan' | 'Building' | 'Ready' | null {
  if (session.status === 'plan') return 'Plan';
  if (session.status === 'building') return 'Building';
  if (session.status === 'ready') return 'Ready';
  return null;
}

/** Sessions worth showing: ones that reached a plan or beyond. */
export function recentSessions(sessions: StudioSession[], limit = 8): StudioSession[] {
  return sessions
    .filter((session) => recentLabel(session) !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export function canSend(prompt: string, files: AttachedFile[]) {
  return prompt.trim().length > 0 || files.length > 0;
}

/* ---------- Row mapping ---------- */

type Row = Record<string, any>;

export function fromRow(row: Row): StudioSession {
  return blankSession({
    id: row.id,
    title: row.title ?? 'Untitled ad',
    prompt: row.prompt ?? '',
    formatId: row.format ?? DEFAULT_FORMAT,
    ratio: row.settings?.ratio ?? '9:16',
    length: Number(row.settings?.length ?? 15),
    styleId: row.style_id ?? null,
    useBrandKit: row.use_brand_kit !== false,
    files: Array.isArray(row.files) ? row.files : [],
    plan: row.plan ?? null,
    status: row.status ?? 'draft',
    result: row.result ?? null,
    designId: row.design_id ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    error: row.settings?.error ?? null,
  });
}

export function toRow(userId: string, session: StudioSession): Row {
  return {
    id: session.id,
    user_id: userId,
    title: session.title,
    prompt: session.prompt,
    format: session.formatId,
    style_id: session.styleId,
    use_brand_kit: session.useBrandKit,
    files: session.files,
    plan: session.plan,
    status: session.status,
    result: session.result,
    design_id: session.designId,
    settings: { ratio: session.ratio, length: session.length, error: session.error ?? null },
  };
}

/* ---------- Browser recovery copy ---------- */

const localKey = (userId: string) => `advista.adstudio.sessions.${userId}`;

export function readLocalSessions(userId: string): StudioSession[] {
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => blankSession(item)) : [];
  } catch {
    return [];
  }
}

function writeLocalSession(userId: string, session: StudioSession) {
  try {
    const rest = readLocalSessions(userId).filter((item) => item.id !== session.id);
    localStorage.setItem(localKey(userId), JSON.stringify([session, ...rest].slice(0, 20)));
  } catch {
    /* Recovery copy only. */
  }
}

function dropLocalSession(userId: string, id: string) {
  try {
    localStorage.setItem(localKey(userId), JSON.stringify(readLocalSessions(userId).filter((item) => item.id !== id)));
  } catch {
    /* Recovery copy only. */
  }
}

export function tableMissing(error: unknown): boolean {
  const item = error as { code?: string; message?: string } | null;
  if (!item) return false;
  return item.code === '42P01' || item.code === 'PGRST205' || /ad_studio_(sessions|styles)/i.test(item.message ?? '') && /(does not exist|schema cache|not find)/i.test(item.message ?? '');
}

/* ---------- Service ---------- */

export const SessionService = {
  async list(userId: string): Promise<StudioSession[]> {
    const local = readLocalSessions(userId);
    const { data, error } = await sb
      .from('ad_studio_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(30);
    if (error) {
      if (tableMissing(error)) return local;
      throw error;
    }
    const remote = (data ?? []).map(fromRow);
    const ids = new Set(remote.map((item: StudioSession) => item.id));
    // A local copy that is newer than the saved row means a save did not land.
    const merged = remote.map((item: StudioSession) => {
      const copy = local.find((candidate) => candidate.id === item.id);
      return copy && copy.updatedAt > item.updatedAt ? copy : item;
    });
    return [...merged, ...local.filter((item) => !ids.has(item.id) && item.status !== 'draft')]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(userId: string, id: string): Promise<StudioSession | null> {
    const local = readLocalSessions(userId).find((item) => item.id === id) ?? null;
    const { data, error } = await sb.from('ad_studio_sessions').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
    if (error) {
      if (tableMissing(error)) return local;
      throw error;
    }
    if (!data) return local;
    const remote = fromRow(data);
    return local && local.updatedAt > remote.updatedAt ? local : remote;
  },

  async save(userId: string, session: StudioSession): Promise<StudioSession> {
    const next = { ...session, updatedAt: new Date().toISOString() };
    writeLocalSession(userId, next);
    const { error } = await sb.from('ad_studio_sessions').upsert(toRow(userId, next), { onConflict: 'id' });
    if (error && !tableMissing(error)) throw error;
    return next;
  },

  async remove(userId: string, id: string) {
    dropLocalSession(userId, id);
    const { error } = await sb.from('ad_studio_sessions').delete().eq('id', id).eq('user_id', userId);
    if (error && !tableMissing(error)) throw error;
  },
};
