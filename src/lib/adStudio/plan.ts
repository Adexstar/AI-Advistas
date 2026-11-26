// The Ad Studio plan: an ordered list of scenes with a type, on-screen text and
// a length. Start times are always derived, never stored.

import { splitDuration } from '@/components/visual-editor/studio/adVideoPlan';
import type { AdStyle } from './styles';
import { ADVISTA_STYLES } from './styles';
import { formatById, sizeFor, type FormatId, type OutputKind } from './formats';

export const SCENE_TYPES = ['Hook', 'Product', 'Benefit', 'Proof', 'Offer', 'Before', 'After', 'Call to action'] as const;
export type SceneType = (typeof SCENE_TYPES)[number];

export const MIN_SCENES = 3;
export const MAX_SCENES = 6;
export const MIN_SCENE_SECONDS = 1;
export const MAX_SCENE_SECONDS = 15;

export interface Scene {
  id: string;
  type: SceneType;
  text: string;
  /** Seconds. Photo formats keep a nominal value that is never shown. */
  duration: number;
  /** What the picture should show. Used when a frame is generated. */
  visual: string;
  imageUrl?: string;
}

export interface StudioPlan {
  title: string;
  description: string;
  formatId: FormatId;
  ratio: string;
  kind: OutputKind;
  scenes: Scene[];
  source: 'model' | 'template';
  note?: string;
  /** True once the person changed anything, so Regenerate can ask first. */
  edited: boolean;
}

const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `scene-${Math.random().toString(36).slice(2, 10)}`;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

export function sceneStarts(scenes: Scene[]): number[] {
  let at = 0;
  return scenes.map((scene) => {
    const start = round1(at);
    at += scene.duration;
    return start;
  });
}

export function totalSeconds(scenes: Scene[]): number {
  return round1(scenes.reduce((sum, scene) => sum + scene.duration, 0));
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** Scene types for a plan: a hook, the style's middle scenes, then a call to action. */
export function arcFor(style: Pick<AdStyle, 'middle'> | null, count: number): SceneType[] {
  const middle = (style ?? ADVISTA_STYLES[1]).middle;
  const safe = Math.min(MAX_SCENES, Math.max(MIN_SCENES, count));
  return ['Hook', ...middle.slice(0, safe - 2), 'Call to action'];
}

/* ---------- Reading the description ---------- */

const OFFER_PATTERNS = [
  /(\d{1,2})\s?%\s*off/i,
  /save\s+(\d{1,2})\s?%/i,
  /(buy one,? get one(?: free)?)/i,
  /(free shipping)/i,
];

export function findOffer(prompt: string): string | null {
  for (const pattern of OFFER_PATTERNS) {
    const match = prompt.match(pattern);
    if (!match) continue;
    if (/^\d/.test(match[1])) return `${match[1]}% off`;
    return match[1].replace(/^./, (letter) => letter.toUpperCase());
  }
  return null;
}

const FILLER = /^(please\s+)?(make|create|build|write|generate|design|i want|i need|i'd like|we need|we want)( me| us)?\s+(an?\s+|the\s+)?/i;

/** Best guess at what is being sold. The person can always edit it. */
export function deriveProduct(prompt: string, brandName?: string | null): string {
  const text = prompt.replace(/\s+/g, ' ').trim();
  const forMatch = text.match(/\b(?:ad|video|reel|post|banner|carousel|campaign)\s+(?:for|about|of)\s+(?:the\s+|a\s+|an\s+|my\s+|our\s+)?([^,.;:\n—-]+?)(?=\s+(?:that|which|with|showing|featuring|and|to|in|on|at)\b|[,.;:\n—-]|$)/i);
  if (forMatch?.[1]) return clip(forMatch[1], 5);
  const selling = text.match(/\b(?:selling|promoting|launching|advertising)\s+(?:the\s+|a\s+|an\s+|my\s+|our\s+)?([^,.;:\n—-]+?)(?=\s+(?:that|which|with|showing|featuring|and|to)\b|[,.;:\n—-]|$)/i);
  if (selling?.[1]) return clip(selling[1], 5);
  if (brandName?.trim()) return brandName.trim();
  const stripped = text.replace(FILLER, '');
  return clip(stripped, 3) || 'Your product';
}

function clip(value: string, words: number): string {
  const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, words);
  const joined = parts.join(' ').replace(/[^\w\s%'&-]+$/g, '');
  return joined ? joined.replace(/^./, (letter) => letter.toUpperCase()) : '';
}

/** Short phrases from the description that can stand in for benefit and proof lines. */
export function phrasesFrom(prompt: string, product: string): string[] {
  return prompt
    .split(/[.;\n]|,|\band\b/i)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => {
      const words = part.split(' ').filter(Boolean).length;
      return words >= 2 && words <= 8 && !part.toLowerCase().includes(product.toLowerCase());
    })
    .filter((part) => !/\b(ad|video|reel|ugc|showing|style|scenes?)\b/i.test(part))
    .map((part) => clip(part, 6))
    .filter(Boolean);
}

/* ---------- Fallback plan (clearly labelled, never presented as AI) ---------- */

interface FallbackContext {
  product: string;
  offer: string | null;
  phrases: string[];
}

const FALLBACK_TEXT: Record<SceneType, (c: FallbackContext) => string> = {
  Hook: (c) => (c.offer ? `${c.offer} on ${c.product}` : `Meet ${c.product}`),
  Product: (c) => `This is ${c.product}`,
  Benefit: (c) => c.phrases[0] ?? 'Made for everyday use',
  Proof: (c) => c.phrases[1] ?? 'See it in action',
  Offer: (c) => c.offer ?? 'Available now',
  Before: (c) => `Before ${c.product}`,
  After: (c) => `After ${c.product}`,
  'Call to action': (c) => (c.offer ? `Shop now — ${c.offer}` : 'Shop now'),
};

const VISUAL_BY_TYPE: Record<SceneType, string> = {
  Hook: 'An eye-catching opening frame of the product',
  Product: 'The product, centred, clearly lit',
  Benefit: 'The product in use, showing the main benefit',
  Proof: 'A detail or moment that backs up the claim',
  Offer: 'The offer on screen beside the product',
  Before: 'The situation before using the product',
  After: 'The result after using the product',
  'Call to action': 'The product with room for the closing line',
};

export function visualFor(type: SceneType, product: string): string {
  return `${VISUAL_BY_TYPE[type]} (${product})`;
}

export interface PlanInput {
  prompt: string;
  formatId: FormatId;
  ratio: string;
  length: number;
  style: AdStyle | null;
  brandName?: string | null;
  imageUrls: string[];
}

export function buildDurations(kind: OutputKind, length: number, count: number): number[] {
  if (kind === 'video') return splitDuration(length || 15, count);
  return Array.from({ length: count }, () => 3);
}

/** Pictures the person attached, repeated so every scene has one. */
export function assignImages(scenes: Scene[], imageUrls: string[]): Scene[] {
  if (!imageUrls.length) return scenes;
  return scenes.map((scene, index) => ({ ...scene, imageUrl: scene.imageUrl || imageUrls[index % imageUrls.length] }));
}

export function planTitle(product: string, formatId: FormatId, length: number): string {
  const format = formatById(formatId);
  if (format.kind === 'video') return `${product} — ${length}s ${formatId === 'story' ? 'Reel' : 'Video'}`;
  return `${product} — ${format.label}`;
}

export function planDescription(prompt: string, product: string): string {
  const first = prompt.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s/)[0] ?? '';
  const text = first.length > 150 ? `${first.slice(0, 147).trimEnd()}…` : first;
  return text || `An ad for ${product}.`;
}

export function fallbackPlan(input: PlanInput): StudioPlan {
  const format = formatById(input.formatId);
  const size = sizeFor(format, input.ratio);
  const product = deriveProduct(input.prompt, input.brandName);
  const offer = findOffer(input.prompt);
  const phrases = phrasesFrom(input.prompt, product);
  const count = Math.min(MAX_SCENES, Math.max(MIN_SCENES, format.kind === 'video' ? (input.length ? initialCount(input.length) : format.defaultScenes) : format.defaultScenes));
  const types = arcFor(input.style, count);
  const durations = buildDurations(format.kind, input.length, types.length);
  const context: FallbackContext = { product, offer, phrases };
  const scenes: Scene[] = types.map((type, index) => ({
    id: newId(),
    type,
    text: FALLBACK_TEXT[type](context),
    duration: durations[index],
    visual: visualFor(type, product),
  }));
  return {
    title: planTitle(product, input.formatId, input.length),
    description: planDescription(input.prompt, product),
    formatId: input.formatId,
    ratio: size.ratio,
    kind: format.kind,
    scenes: assignImages(scenes, input.imageUrls),
    source: 'template',
    note: 'Fallback plan. No text model answered, so these lines come from your description. Add an AI key in settings for written copy.',
    edited: false,
  };
}

function initialCount(length: number) {
  if (length <= 5) return 3;
  if (length <= 10) return 4;
  return 5;
}

/** Turns model shots into a plan. Scene types follow the style's arc. */
export function planFromShots(
  input: PlanInput,
  shots: Array<{ text: string; action: string; duration: number }>,
): StudioPlan | null {
  if (shots.length < MIN_SCENES) return null;
  const format = formatById(input.formatId);
  const size = sizeFor(format, input.ratio);
  const product = deriveProduct(input.prompt, input.brandName);
  const used = shots.slice(0, MAX_SCENES);
  const types = arcFor(input.style, used.length);
  const durations = format.kind === 'video' ? used.map((shot) => shot.duration) : used.map(() => 3);
  const scenes: Scene[] = used.map((shot, index) => ({
    id: newId(),
    type: types[index],
    text: shot.text.slice(0, 60) || FALLBACK_TEXT[types[index]]({ product, offer: findOffer(input.prompt), phrases: [] }),
    duration: durations[index],
    visual: shot.action || visualFor(types[index], product),
  }));
  return {
    title: planTitle(product, input.formatId, input.length),
    description: planDescription(input.prompt, product),
    formatId: input.formatId,
    ratio: size.ratio,
    kind: format.kind,
    scenes: assignImages(scenes, input.imageUrls),
    source: 'model',
    edited: false,
  };
}

/* ---------- Editing ---------- */

const touch = (plan: StudioPlan, scenes: Scene[]): StudioPlan => ({ ...plan, scenes, edited: true });

export function updateScene(plan: StudioPlan, id: string, patch: Partial<Pick<Scene, 'type' | 'text' | 'duration' | 'imageUrl'>>): StudioPlan {
  return touch(plan, plan.scenes.map((scene) => {
    if (scene.id !== id) return scene;
    const next = { ...scene, ...patch };
    if (patch.duration !== undefined) {
      next.duration = Math.min(MAX_SCENE_SECONDS, Math.max(MIN_SCENE_SECONDS, round1(patch.duration)));
    }
    return next;
  }));
}

export function moveScene(plan: StudioPlan, from: number, to: number): StudioPlan {
  if (from === to || from < 0 || to < 0 || from >= plan.scenes.length || to >= plan.scenes.length) return plan;
  const scenes = plan.scenes.slice();
  const [row] = scenes.splice(from, 1);
  scenes.splice(to, 0, row);
  return touch(plan, scenes);
}

export function canAddScene(plan: StudioPlan) {
  return plan.scenes.length < MAX_SCENES;
}

export function canRemoveScene(plan: StudioPlan) {
  return plan.scenes.length > MIN_SCENES;
}

/** Keep the overall length steady when scenes come and go. */
function refit(plan: StudioPlan, scenes: Scene[], total: number): Scene[] {
  if (plan.kind !== 'video') return scenes;
  const parts = splitDuration(total, scenes.length);
  return scenes.map((scene, index) => ({ ...scene, duration: parts[index] }));
}

export function addScene(plan: StudioPlan, product = ''): StudioPlan {
  if (!canAddScene(plan)) return plan;
  const total = totalSeconds(plan.scenes);
  const lastIndex = plan.scenes.length - 1;
  const used = new Set(plan.scenes.map((scene) => scene.type));
  const type = (['Benefit', 'Proof', 'Product', 'Offer'] as SceneType[]).find((candidate) => !used.has(candidate)) ?? 'Benefit';
  const added: Scene = {
    id: newId(),
    type,
    text: '',
    duration: plan.kind === 'video' ? 3 : 3,
    visual: visualFor(type, product || 'the product'),
    imageUrl: plan.scenes[lastIndex]?.imageUrl,
  };
  const scenes = plan.scenes.slice();
  scenes.splice(lastIndex, 0, added);
  return touch(plan, refit(plan, scenes, total));
}

export function removeScene(plan: StudioPlan, id: string): StudioPlan {
  if (!canRemoveScene(plan)) return plan;
  const total = totalSeconds(plan.scenes);
  const scenes = plan.scenes.filter((scene) => scene.id !== id);
  return touch(plan, refit(plan, scenes, total));
}

export function updateMeta(plan: StudioPlan, patch: Partial<Pick<StudioPlan, 'title' | 'description'>>): StudioPlan {
  return { ...plan, ...patch, edited: true };
}

/** Chips shown under the plan description. */
export function planChips(plan: StudioPlan): string[] {
  const first = plan.kind === 'video' ? `${Math.round(totalSeconds(plan.scenes))}s` : formatById(plan.formatId).id === 'carousel' ? `${plan.scenes.length} slides` : 'Photo';
  return [first, plan.ratio, `${plan.scenes.length} scenes`];
}

/* ---------- Variations ---------- */

const HOOK_ALTERNATIVES = (product: string, offer: string | null) => [
  offer ? `${offer} on ${product}` : `Meet ${product}`,
  `Ready for ${product}?`,
  `${product}, up close`,
  `Say hello to ${product}`,
];

const CTA_ALTERNATIVES = (offer: string | null) => [
  offer ? `Shop now — ${offer}` : 'Shop now',
  'Get yours today',
  'Learn more',
  'Order now',
];

export interface PlanVariation {
  label: string;
  plan: StudioPlan;
}

/** Two or three versions with a different opening line and call to action. */
export function variationsOf(plan: StudioPlan, product: string, offer: string | null, count = 3): PlanVariation[] {
  const hooks = HOOK_ALTERNATIVES(product, offer).filter((hook) => hook !== plan.scenes.find((scene) => scene.type === 'Hook')?.text);
  const ctas = CTA_ALTERNATIVES(offer).filter((cta) => cta !== plan.scenes.find((scene) => scene.type === 'Call to action')?.text);
  const total = Math.min(3, Math.max(2, count));
  return Array.from({ length: total }, (_, index) => {
    const hook = hooks[index % hooks.length];
    const cta = ctas[(index + 1) % ctas.length];
    return {
      label: `Version ${String.fromCharCode(66 + index)}`,
      plan: {
        ...plan,
        edited: true,
        scenes: plan.scenes.map((scene) => {
          if (scene.type === 'Hook') return { ...scene, id: newId(), text: hook };
          if (scene.type === 'Call to action') return { ...scene, id: newId(), text: cta };
          return { ...scene, id: newId() };
        }),
      },
    };
  });
}
