// State for the compact AI Studio dock. The panel renders this; it does
// not invent a second set of rules about slots, aspect, or credit cost.

import { DIRECTOR_CATEGORIES, type DirectorCategory } from './directorPrompt';

export type StudioMode = 'image' | 'video';
export type StudioAspect = '16:9' | '9:16' | '1:1' | '4:5' | '4:3' | '3:4';
export type StudioResolution = '720p' | '1080p';

export interface StudioModel {
  id: string;
  label: string;
  secret: string;
  image: boolean;
  video: boolean;
  audio: boolean;
  maxImages: number;
  maxVideo: number;
  maxAudio: number;
  keyframes: boolean;
  preferred?: boolean;
  implemented: boolean;
}

export const STUDIO_MODELS: StudioModel[] = [
  {
    id: 'runware', label: 'Runware', secret: 'RUNWARE_API_KEY',
    image: true, video: true, audio: true, maxImages: 8, maxVideo: 1, maxAudio: 1,
    keyframes: true, preferred: true, implemented: true,
  },
  {
    id: 'openai', label: 'OpenAI', secret: 'OPENAI_API_KEY',
    image: true, video: false, audio: false, maxImages: 0, maxVideo: 0, maxAudio: 0,
    keyframes: false, implemented: true,
  },
  {
    id: 'runway', label: 'Runway', secret: 'RUNWAY_API_KEY',
    image: false, video: true, audio: false, maxImages: 1, maxVideo: 0, maxAudio: 0,
    keyframes: false, implemented: false,
  },
  {
    id: 'kling', label: 'Kling', secret: 'KLING_API_KEY',
    image: false, video: true, audio: false, maxImages: 1, maxVideo: 0, maxAudio: 0,
    keyframes: true, implemented: false,
  },
  {
    id: 'veo', label: 'Veo', secret: 'VEO_API_KEY',
    image: false, video: true, audio: false, maxImages: 1, maxVideo: 0, maxAudio: 0,
    keyframes: false, implemented: false,
  },
];

export const ASPECTS: StudioAspect[] = ['16:9', '9:16', '1:1', '4:5', '4:3', '3:4'];
export const RESOLUTIONS: StudioResolution[] = ['720p', '1080p'];
export const VIDEO_DURATIONS = [5, 8, 10] as const;
export const OUTPUT_COUNTS = [1, 2, 4] as const;

const ASPECT_RATIO: Record<StudioAspect, number> = {
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '1:1': 1,
  '4:5': 4 / 5,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
};

export function aspectFromCanvas(width: number, height: number): StudioAspect {
  const ratio = width > 0 && height > 0 ? width / height : 1;
  return ASPECTS.reduce((best, aspect) => (
    Math.abs(ASPECT_RATIO[aspect] - ratio) < Math.abs(ASPECT_RATIO[best] - ratio) ? aspect : best
  ), '1:1' as StudioAspect);
}

export function snap64(value: number): number {
  return Math.max(64, Math.round(value / 64) * 64);
}

export function frameSize(aspect: StudioAspect, resolution: StudioResolution): { width: number; height: number } {
  const longEdge = resolution === '1080p' ? 1024 : 768;
  const ratio = ASPECT_RATIO[aspect];
  if (ratio >= 1) return { width: snap64(longEdge), height: snap64(longEdge / ratio) };
  return { width: snap64(longEdge * ratio), height: snap64(longEdge) };
}

export function modelsFor(mode: StudioMode): StudioModel[] {
  return STUDIO_MODELS.filter((model) => (mode === 'image' ? model.image : model.video));
}

export function pickModel(mode: StudioMode, configured: Record<string, boolean>): StudioModel {
  const available = modelsFor(mode);
  return available.find((model) => model.preferred && configured[model.id])
    ?? available.find((model) => model.implemented && configured[model.id])
    ?? available.find((model) => model.preferred)
    ?? available[0];
}

export interface SlotLimits {
  images: number;
  video: number;
  audio: number;
  keyframes: boolean;
}

export function slotLimits(model: StudioModel, mode: StudioMode): SlotLimits {
  if (mode === 'image') {
    return { images: model.maxImages, video: 0, audio: 0, keyframes: false };
  }
  return {
    images: model.maxImages,
    video: model.maxVideo,
    audio: model.audio ? model.maxAudio : 0,
    keyframes: model.keyframes,
  };
}

export function creditCost(mode: StudioMode, outputs: number, duration = 5): number {
  const count = Math.min(4, Math.max(1, outputs));
  if (mode === 'image') return count;
  return count * (duration > 8 ? 3 : 2);
}

export interface StudioDraft {
  mode: StudioMode;
  modelId: string;
  prompt: string;
  category: DirectorCategory;
  aspect: StudioAspect;
  resolution: StudioResolution;
  duration: number;
  outputs: number;
  audio: boolean;
  tab: 'reference' | 'keyframe';
  sheet: 'half' | 'full';
}

export function initialDraft(width: number, height: number, prompt = ''): StudioDraft {
  return {
    mode: 'image',
    modelId: 'runware',
    prompt,
    category: 'generic',
    aspect: aspectFromCanvas(width, height),
    resolution: '720p',
    duration: 5,
    outputs: 1,
    audio: false,
    tab: 'reference',
    sheet: 'half',
  };
}

export function halfSheetFields(): Array<keyof StudioDraft> {
  return ['prompt'];
}

export const INSPIRATIONS: Record<DirectorCategory, string> = {
  'fashion/sneakers': 'A single sneaker on a paper sweep, side on, the logo readable.',
  'beauty/perfume': 'One perfume bottle on marble, the cap and the label kept exact.',
  'food & drink': 'One drink in its real glass, on linen, no extra garnish.',
  'real estate': 'The living room as photographed, window light unchanged.',
  'tech/gadgets': 'The device on a matte desk, screen content unchanged.',
  automotive: 'The car in a concrete bay, three-quarter view, paint colour unchanged.',
  fitness: 'One piece of equipment on a gym floor, no extra people.',
  events: 'The venue entrance, the sign text kept exact.',
  generic: 'The product centred, one light, no extra objects.',
};

export { DIRECTOR_CATEGORIES };
