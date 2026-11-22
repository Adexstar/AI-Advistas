// The guided ad-video plan. Timing, presets, and the local director
// template live here so the dock can keep working when no text model answers.

import {
  CAMERA_MOVES,
  CATEGORY_LIGHT,
  CATEGORY_SETTING,
  DIRECTOR_CATEGORIES,
  type DirectorCategory,
} from './directorPrompt';

export const AD_ASPECTS = ['9:16', '1:1', '16:9'] as const;
export const AD_DURATIONS = [5, 10, 15] as const;
export const AD_VIBES = ['Clean', 'Bold', 'Warm', 'Quiet', 'Night'] as const;
export const AD_GOALS = ['Launch', 'Offer', 'Visit', 'App install', 'Listing'] as const;
export const AD_TRANSITIONS = ['cut', 'dissolve', 'match cut'] as const;

export type AdAspect = (typeof AD_ASPECTS)[number];
export type AdDuration = (typeof AD_DURATIONS)[number];
export type AdVibe = (typeof AD_VIBES)[number];
export type AdGoal = (typeof AD_GOALS)[number];
export type AdTransition = (typeof AD_TRANSITIONS)[number];
export type AdStep = 'product' | 'brief' | 'shots';
export type GenerateMode = 'one-shot' | 'per-shot';
export type LineSource = 'template' | 'model';

export interface AdShot {
  id: string;
  duration: number;
  camera: string;
  action: string;
  onScreenText: string;
  transition: AdTransition;
  frameUrl: string;
  from: LineSource;
}

export interface AdPlan {
  id: string;
  name: string;
  productName: string;
  productImage: string;
  goal: AdGoal;
  audience: string;
  vibe: AdVibe;
  category: DirectorCategory;
  aspect: AdAspect;
  duration: AdDuration;
  resolution: '720p' | '1080p';
  audio: boolean;
  look: string;
  lighting: string;
  musicMood: string;
  shots: AdShot[];
  source: LineSource;
  generateMode: GenerateMode;
  savedAt: number;
}

export interface AdPreset {
  id: string;
  label: string;
  category: DirectorCategory;
  productName: string;
  goal: AdGoal;
  audience: string;
  vibe: AdVibe;
}

export const AD_PRESETS: AdPreset[] = [
  { id: 'sneaker-drop', label: 'Sneaker drop', category: 'fashion/sneakers', productName: 'Court Runner', goal: 'Launch', audience: 'People who buy sneakers', vibe: 'Clean' },
  { id: 'skincare', label: 'Skincare', category: 'beauty/perfume', productName: 'Glass Serum', goal: 'Offer', audience: 'Skincare buyers', vibe: 'Quiet' },
  { id: 'food', label: 'Food', category: 'food & drink', productName: 'Night Market bowl', goal: 'Visit', audience: 'People nearby this weekend', vibe: 'Warm' },
  { id: 'app-promo', label: 'App promo', category: 'tech/gadgets', productName: 'Field notes app', goal: 'App install', audience: 'Phone users at a desk', vibe: 'Clean' },
  { id: 'real-estate', label: 'Real estate', category: 'real estate', productName: 'Harbour flat', goal: 'Listing', audience: 'Buyers looking this month', vibe: 'Quiet' },
];

const MUSIC: Record<DirectorCategory, string> = {
  'fashion/sneakers': 'dry electronic pulse, no vocals',
  'beauty/perfume': 'soft piano, slow, no beat drop',
  'food & drink': 'light percussion and a warm tone',
  'real estate': 'spare piano, held under the room tone',
  'tech/gadgets': 'muted ticks, no trailer brass',
  automotive: 'low sustained tone, no engine overlay',
  fitness: 'steady pulse, no shout track',
  events: 'the room tone, with a quiet beat under it',
  generic: 'a simple pulse, no lyrics',
};

const TITLES: Record<DirectorCategory, [string, string, string]> = {
  'fashion/sneakers': ['New colour', 'Same last', 'Shop the drop'],
  'beauty/perfume': ['The serum', 'Nothing added', 'See the set'],
  'food & drink': ['Tonight', 'One bowl', 'Get a table'],
  'real estate': ['The room', 'As it is', 'Book a viewing'],
  'tech/gadgets': ['Open the app', 'One screen', 'Install'],
  automotive: ['The paint', 'Unchanged', 'Book a drive'],
  fitness: ['One piece', 'Even light', 'Start here'],
  events: ['The entrance', 'The sign stays', 'Get tickets'],
  generic: ['The product', 'Held still', 'Learn more'],
};

const ACTIONS = [
  'Hold on the product. Nothing else enters the frame.',
  'Move once, then settle. The logo stays readable.',
  'A detail fills the frame, then returns to the whole product.',
  'The product turns just enough to show the second side.',
  'Pull back to the full object and the empty set.',
  'End on the product, centred, with room for the last line.',
];

const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `shot-${Math.random().toString(36).slice(2, 10)}`;
};

export function shotCountFor(duration: number): number {
  if (duration <= 5) return 3;
  if (duration <= 10) return 4;
  return 6;
}

export function splitDuration(total: number, count: number): number[] {
  const safeCount = Math.min(6, Math.max(1, count));
  const safeTotal = Math.max(safeCount * 0.4, total);
  const base = Math.floor((safeTotal / safeCount) * 10) / 10;
  const values = Array.from({ length: safeCount }, () => base);
  const used = Math.round(base * (safeCount - 1) * 10) / 10;
  values[safeCount - 1] = Math.round((safeTotal - used) * 10) / 10;
  return values;
}

export function totalDuration(shots: AdShot[]): number {
  return Math.round(shots.reduce((sum, shot) => sum + shot.duration, 0) * 10) / 10;
}

export function fitShots(shots: AdShot[], total: number): AdShot[] {
  if (shots.length === 0) return shots;
  const parts = splitDuration(total, shots.length);
  return shots.map((shot, index) => ({ ...shot, duration: parts[index] }));
}

export function blankPlan(partial: Partial<AdPlan> = {}): AdPlan {
  const category = partial.category && DIRECTOR_CATEGORIES.includes(partial.category) ? partial.category : 'generic';
  const duration = (AD_DURATIONS.includes(partial.duration as AdDuration) ? partial.duration : 10) as AdDuration;
  const plan: AdPlan = {
    id: partial.id || newId(),
    name: partial.name || 'Untitled ad',
    productName: partial.productName || '',
    productImage: partial.productImage || '',
    goal: partial.goal || 'Launch',
    audience: partial.audience || '',
    vibe: partial.vibe || 'Clean',
    category,
    aspect: partial.aspect || '9:16',
    duration,
    resolution: partial.resolution || '1080p',
    audio: partial.audio ?? true,
    look: partial.look || CATEGORY_SETTING[category],
    lighting: partial.lighting || CATEGORY_LIGHT[category],
    musicMood: partial.musicMood || MUSIC[category],
    shots: [],
    source: partial.source === 'model' ? 'model' : 'template',
    generateMode: partial.generateMode || 'one-shot',
    savedAt: partial.savedAt || 0,
  };
  plan.shots = partial.shots?.length ? fitShots(partial.shots, duration) : templateShots(plan);
  return plan;
}

export function applyPreset(presetId: string, current?: Partial<AdPlan>): AdPlan {
  const preset = AD_PRESETS.find((item) => item.id === presetId) ?? AD_PRESETS[0];
  return blankPlan({
    name: preset.label,
    productName: preset.productName,
    goal: preset.goal,
    audience: preset.audience,
    vibe: preset.vibe,
    category: preset.category,
    productImage: current?.productImage || '',
    aspect: current?.aspect,
    duration: current?.duration,
    resolution: current?.resolution,
    audio: current?.audio,
    generateMode: current?.generateMode,
  });
}

export function templateShots(plan: Pick<AdPlan, 'category' | 'duration' | 'productName' | 'vibe'>): AdShot[] {
  const category = DIRECTOR_CATEGORIES.includes(plan.category) ? plan.category : 'generic';
  const count = shotCountFor(plan.duration);
  const parts = splitDuration(plan.duration, count);
  const titles = TITLES[category];
  const product = plan.productName.trim() || 'The product';
  return parts.map((duration, index) => ({
    id: newId(),
    duration,
    camera: CAMERA_MOVES[index % CAMERA_MOVES.length],
    action: `${product}. ${ACTIONS[index % ACTIONS.length]} Setting: ${CATEGORY_SETTING[category]}.`,
    onScreenText: index === 0 ? product : titles[Math.min(index, titles.length - 1)],
    transition: index === count - 1 ? 'cut' : AD_TRANSITIONS[index % AD_TRANSITIONS.length],
    frameUrl: '',
    from: 'template' as const,
  }));
}

export function templatePlan(plan: AdPlan): AdPlan {
  const category = DIRECTOR_CATEGORIES.includes(plan.category) ? plan.category : 'generic';
  return {
    ...plan,
    category,
    look: CATEGORY_SETTING[category],
    lighting: CATEGORY_LIGHT[category],
    musicMood: MUSIC[category],
    source: 'template',
    shots: templateShots(plan),
  };
}

export function moveShot(shots: AdShot[], index: number, direction: -1 | 1): AdShot[] {
  const next = index + direction;
  if (index < 0 || next < 0 || index >= shots.length || next >= shots.length) return shots;
  const copy = shots.slice();
  const [row] = copy.splice(index, 1);
  copy.splice(next, 0, row);
  return copy;
}

export function removeShot(shots: AdShot[], index: number, total: number): AdShot[] {
  if (shots.length <= 3) return shots;
  return fitShots(shots.filter((_, item) => item !== index), total);
}

export function addShot(plan: AdPlan): AdShot[] {
  if (plan.shots.length >= 6) return plan.shots;
  const extra = templateShots(plan)[plan.shots.length % 3];
  return fitShots([...plan.shots, { ...extra, id: newId(), from: 'template' }], plan.duration);
}

export function rewriteShotFromTemplate(plan: AdPlan, index: number): AdShot[] {
  const sample = templateShots({ ...plan, duration: plan.duration })[index % shotCountFor(plan.duration)];
  return plan.shots.map((shot, item) => (item === index ? { ...shot, camera: sample.camera, action: sample.action, onScreenText: sample.onScreenText, from: 'template' } : shot));
}

interface RawShot {
  camera?: unknown;
  action?: unknown;
  onScreenText?: unknown;
  text?: unknown;
  transition?: unknown;
}

export function parseShotPlan(raw: string): { look: string; lighting: string; musicMood: string; shots: RawShot[] } | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced ? fenced[1] : raw).trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { look?: unknown; lighting?: unknown; musicMood?: unknown; shots?: unknown };
    if (!Array.isArray(parsed.shots) || parsed.shots.length < 3) return null;
    return {
      look: typeof parsed.look === 'string' ? parsed.look : '',
      lighting: typeof parsed.lighting === 'string' ? parsed.lighting : '',
      musicMood: typeof parsed.musicMood === 'string' ? parsed.musicMood : '',
      shots: parsed.shots.slice(0, 6) as RawShot[],
    };
  } catch {
    return null;
  }
}

export function planFromModel(plan: AdPlan, raw: string): AdPlan | null {
  const parsed = parseShotPlan(raw);
  if (!parsed) return null;
  const parts = splitDuration(plan.duration, Math.min(6, parsed.shots.length));
  const shots: AdShot[] = parsed.shots.slice(0, parts.length).map((shot, index) => ({
    id: newId(),
    duration: parts[index],
    camera: textOf(shot.camera, CAMERA_MOVES[index % CAMERA_MOVES.length]),
    action: textOf(shot.action, ACTIONS[index]),
    onScreenText: textOf(shot.onScreenText ?? shot.text, plan.productName || 'The product').slice(0, 42),
    transition: AD_TRANSITIONS.includes(shot.transition as AdTransition) ? shot.transition as AdTransition : 'cut',
    frameUrl: '',
    from: 'model',
  }));
  if (shots.length < 3) return null;
  return {
    ...plan,
    look: parsed.look || plan.look,
    lighting: parsed.lighting || plan.lighting,
    musicMood: parsed.musicMood || plan.musicMood,
    source: 'model',
    shots,
  };
}

function textOf(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text || fallback;
}

export function videoFailureMessage(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim() || 'The video was not created.';
  const message = /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
  const saved = 'The shot list is saved. The on-screen lines are on the timeline.';
  if (/plan limit/i.test(message)) return `${message} ${saved}`;
  const named = /RUNWARE_API_KEY/.test(message) ? message : `${message} Add RUNWARE_API_KEY.`;
  return `${named} ${saved}`;
}

export function estimateCredits(mode: GenerateMode, duration: number, shots: number): number {
  if (mode === 'one-shot') return duration > 8 ? 3 : 2;
  return Math.max(1, Math.min(6, shots)) * 2;
}

export function planToPrompt(plan: AdPlan): string {
  const lines = plan.shots.map((shot, index) => (
    `${index + 1}. ${shot.duration}s ${shot.camera}. ${shot.action} On-screen text: "${shot.onScreenText}". Transition: ${shot.transition}.`
  ));
  return [
    `Product: ${plan.productName || 'the referenced product'}.`,
    `Goal: ${plan.goal}. Audience: ${plan.audience || 'the buyer'}. Vibe: ${plan.vibe}.`,
    `Frame ${plan.aspect}. Duration ${plan.duration}s.`,
    'Exact preservation: the logo, any text, the colours, the materials, and the proportions stay identical.',
    `Look: ${plan.look}.`,
    `Lighting: ${plan.lighting}.`,
    `Music mood: ${plan.musicMood}.`,
    'Shots:',
    ...lines,
    'Negative: no colour shifts, no extra products, no warped or garbled text, no extra limbs.',
  ].join('\n');
}

export function shotToPrompt(plan: AdPlan, shot: AdShot): string {
  return [
    planToPrompt({ ...plan, shots: [shot], duration: Math.min(15, Math.max(5, Math.round(shot.duration))) as AdDuration }),
    `This clip is only shot material: ${shot.camera}, ${shot.duration}s.`,
  ].join('\n');
}

const PLANS_KEY = 'advista.director.plans';
const CURRENT_KEY = 'advista.director.current';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function persistable(plan: AdPlan): AdPlan {
  const keep = (url: string) => (url.startsWith('blob:') ? '' : url);
  return {
    ...plan,
    productImage: keep(plan.productImage),
    shots: plan.shots.map((shot) => ({ ...shot, frameUrl: keep(shot.frameUrl) })),
    savedAt: Date.now(),
  };
}

export function saveCurrentPlan(plan: AdPlan) {
  storage()?.setItem(CURRENT_KEY, JSON.stringify(persistable(plan)));
}

export function readCurrentPlan(): AdPlan | null {
  const raw = storage()?.getItem(CURRENT_KEY);
  if (!raw) return null;
  try {
    return blankPlan(JSON.parse(raw) as Partial<AdPlan>);
  } catch {
    return null;
  }
}

export function saveNamedPlan(plan: AdPlan): AdPlan[] {
  const next = persistable({ ...plan, name: plan.name || plan.productName || 'Untitled ad' });
  const plans = readNamedPlans().filter((item) => item.id !== next.id);
  plans.unshift(next);
  storage()?.setItem(PLANS_KEY, JSON.stringify(plans.slice(0, 12)));
  saveCurrentPlan(next);
  return plans.slice(0, 12);
}

export function readNamedPlans(): AdPlan[] {
  const raw = storage()?.getItem(PLANS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<AdPlan>[];
    return Array.isArray(parsed) ? parsed.map((item) => blankPlan(item)) : [];
  } catch {
    return [];
  }
}
