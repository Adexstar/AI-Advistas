// "My styles": styles a person saved. Stored in `ad_studio_styles`, with a
// browser copy so the list still works if the table has not been created.

import { supabase } from '@/integrations/supabase/client';
import { newSessionId, tableMissing } from './sessions';
import type { AdStyle, StyleAnalysis } from './styles';

const sb: any = supabase;

const localKey = (userId: string) => `advista.adstudio.styles.${userId}`;

function readLocal(userId: string): AdStyle[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(localKey(userId)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(userId: string, styles: AdStyle[]) {
  try {
    localStorage.setItem(localKey(userId), JSON.stringify(styles));
  } catch {
    /* Recovery copy only. */
  }
}

function fromRow(row: Record<string, any>): AdStyle {
  const analysis = row.analysis && typeof row.analysis === 'object' ? (row.analysis as StyleAnalysis) : undefined;
  return {
    id: row.id,
    name: row.name,
    description: row.source_url || row.text_style || 'Saved style',
    source: row.source_url ? 'link' : 'custom',
    pacing: row.pacing ?? 'steady',
    textStyle: row.text_style ?? '',
    middle: Array.isArray(row.scene_order) && row.scene_order.length ? row.scene_order : ['Product', 'Benefit', 'Proof', 'Offer'],
    direction: row.direction ?? '',
    tint: ['#6b7280', '#1f2937'],
    sourceUrl: row.source_url ?? undefined,
    analysis,
  };
}

function toRow(userId: string, style: AdStyle) {
  return {
    id: style.id,
    user_id: userId,
    name: style.name,
    source_url: style.sourceUrl ?? null,
    pacing: style.pacing,
    text_style: style.textStyle,
    scene_order: style.middle,
    direction: style.direction,
    analysis: style.analysis ?? null,
  };
}

export const StyleStore = {
  async list(userId: string): Promise<AdStyle[]> {
    const { data, error } = await sb.from('ad_studio_styles').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) {
      if (tableMissing(error)) return readLocal(userId);
      throw error;
    }
    return (data ?? []).map(fromRow);
  },

  async create(userId: string, draft: Omit<AdStyle, 'id'>): Promise<AdStyle> {
    const style: AdStyle = { ...draft, id: newSessionId() };
    const { error } = await sb.from('ad_studio_styles').insert(toRow(userId, style));
    if (error) {
      if (!tableMissing(error)) throw error;
      writeLocal(userId, [style, ...readLocal(userId)]);
    }
    return style;
  },

  async update(userId: string, style: AdStyle): Promise<void> {
    const { error } = await sb.from('ad_studio_styles').update(toRow(userId, style)).eq('id', style.id).eq('user_id', userId);
    if (error) {
      if (!tableMissing(error)) throw error;
      writeLocal(userId, readLocal(userId).map((item) => (item.id === style.id ? style : item)));
    }
  },

  async rename(userId: string, style: AdStyle, name: string): Promise<AdStyle> {
    const next = { ...style, name: name.trim() || style.name };
    await this.update(userId, next);
    return next;
  },

  async remove(userId: string, id: string): Promise<void> {
    const { error } = await sb.from('ad_studio_styles').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      if (!tableMissing(error)) throw error;
      writeLocal(userId, readLocal(userId).filter((item) => item.id !== id));
    }
  },
};
