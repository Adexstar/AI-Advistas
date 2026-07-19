// Handoff channel between the Template gallery and the Visual Editor.
// The gallery writes the selected template into sessionStorage; the editor
// reads it on mount, instantiates it via the TemplateEngine, and clears it.

import type { TemplateRecord } from '@/services/templates/types';

const KEY = 'advista.editor.pendingTemplate';

export interface PendingEditorTemplate {
  template: TemplateRecord;
  source?: 'originals' | 'library' | 'ai';
  openedAt: number;
}

export const setPendingEditorTemplate = (template: TemplateRecord, source: PendingEditorTemplate['source'] = 'originals') => {
  if (typeof window === 'undefined') return;
  const payload: PendingEditorTemplate = { template, source, openedAt: Date.now() };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[templateEditorSession] failed to persist', err);
  }
};

export const consumePendingEditorTemplate = (): PendingEditorTemplate | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(KEY);
  try {
    return JSON.parse(raw) as PendingEditorTemplate;
  } catch {
    return null;
  }
};

export const peekPendingEditorTemplate = (): PendingEditorTemplate | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingEditorTemplate;
  } catch {
    return null;
  }
};
