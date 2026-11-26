// Ready-made ad styles and the helpers behind "My styles".

import type { SceneType } from './plan';

export type Pacing = 'fast' | 'steady' | 'slow';
export type AdStyleSource = 'preset' | 'link' | 'custom';

export interface AdStyle {
  id: string;
  name: string;
  description: string;
  source: AdStyleSource;
  pacing: Pacing;
  textStyle: string;
  /** Scenes between the opening hook and the closing call to action, in order. */
  middle: SceneType[];
  /** Short art-direction hint passed to the plan writer. */
  direction: string;
  /** Two colours for the preview tile. */
  tint: [string, string];
  sourceUrl?: string;
  analysis?: StyleAnalysis;
}

export type AnalysisStatus = 'needs_ai_key' | 'ready' | 'failed' | 'not_connected';

export interface StyleAnalysis {
  status: AnalysisStatus;
  note: string;
}

export const NEEDS_AI_KEY = 'Needs AI key, add in settings';

export const ADVISTA_STYLES: AdStyle[] = [
  {
    id: 'ugc',
    name: 'UGC',
    description: 'Handheld, first-person and fast.',
    source: 'preset',
    pacing: 'fast',
    textStyle: 'Casual captions, centred, large',
    middle: ['Product', 'Benefit', 'Proof', 'Offer'],
    direction: 'Handheld, first-person, natural light, quick cuts, casual captions.',
    tint: ['#7c5cfa', '#3b2a8f'],
  },
  {
    id: 'product-showcase',
    name: 'Product showcase',
    description: 'Clean shots that let the product lead.',
    source: 'preset',
    pacing: 'steady',
    textStyle: 'Short labels, lower third',
    middle: ['Product', 'Benefit', 'Proof', 'Offer'],
    direction: 'Clean studio shots, one product, steady camera, short labels.',
    tint: ['#4f8cff', '#1f2a5c'],
  },
  {
    id: 'before-after',
    name: 'Before and after',
    description: 'Show the problem, then the result.',
    source: 'preset',
    pacing: 'steady',
    textStyle: 'Bold Before and After tags',
    middle: ['Before', 'After', 'Proof', 'Offer'],
    direction: 'Split between the problem and the result, matching framing in both.',
    tint: ['#f472b6', '#6b1d4a'],
  },
  {
    id: 'sale-promo',
    name: 'Sale or promo',
    description: 'The offer first, with a clear deadline feel.',
    source: 'preset',
    pacing: 'fast',
    textStyle: 'Large offer text, high contrast',
    middle: ['Offer', 'Product', 'Benefit', 'Proof'],
    direction: 'High contrast, the offer on screen early, punchy copy.',
    tint: ['#fb923c', '#7a2e0e'],
  },
  {
    id: 'testimonial',
    name: 'Testimonial',
    description: 'A real voice up front, then the product.',
    source: 'preset',
    pacing: 'steady',
    textStyle: 'Quote style, left aligned',
    middle: ['Proof', 'Benefit', 'Product', 'Offer'],
    direction: 'Quote on screen, calm pacing, product shown after the quote.',
    tint: ['#34d399', '#0f4a38'],
  },
  {
    id: 'minimal-luxury',
    name: 'Minimal luxury',
    description: 'Slow, spare and premium.',
    source: 'preset',
    pacing: 'slow',
    textStyle: 'Thin serif, generous space',
    middle: ['Product', 'Benefit', 'Proof', 'Offer'],
    direction: 'Slow camera, lots of empty space, restrained serif type.',
    tint: ['#d4b98c', '#2a2218'],
  },
];

export function styleById(id: string | null | undefined, saved: AdStyle[] = []): AdStyle | null {
  if (!id) return null;
  return ADVISTA_STYLES.find((style) => style.id === id) ?? saved.find((style) => style.id === id) ?? null;
}

const LINK_HOSTS = [/(^|\.)instagram\.com$/i, /(^|\.)tiktok\.com$/i];

export type ParsedLink = { ok: true; url: string; host: 'instagram' | 'tiktok' } | { ok: false; error: string };

export function parseAdLink(raw: string): ParsedLink {
  const text = raw.trim();
  if (!text) return { ok: false, error: 'Paste an Instagram or TikTok link.' };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { ok: false, error: 'That does not look like a link.' };
  }
  if (!LINK_HOSTS.some((pattern) => pattern.test(url.hostname))) {
    return { ok: false, error: 'Only Instagram and TikTok links work here.' };
  }
  return { ok: true, url: url.toString(), host: /tiktok/i.test(url.hostname) ? 'tiktok' : 'instagram' };
}

/** Default name for a style saved from a link. */
export function nameForLink(link: { url: string; host: 'instagram' | 'tiktok' }, existing: number): string {
  return `${link.host === 'tiktok' ? 'TikTok' : 'Instagram'} style ${existing + 1}`;
}

/** A style made from a link starts neutral. Real pacing, text style and scene order come only from analysis. */
export function linkStyleDraft(link: { url: string; host: 'instagram' | 'tiktok' }, name: string, analysis: StyleAnalysis): Omit<AdStyle, 'id'> {
  return {
    name,
    description: link.url,
    source: 'link',
    pacing: 'steady',
    textStyle: '',
    middle: ['Product', 'Benefit', 'Proof', 'Offer'],
    direction: '',
    tint: ['#6b7280', '#1f2937'],
    sourceUrl: link.url,
    analysis,
  };
}
