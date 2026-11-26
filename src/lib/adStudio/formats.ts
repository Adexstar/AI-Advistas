// Ad formats offered on the Ad Studio opening screen. Each format decides the
// output size, whether the result is a photo design or a video timeline, and
// which length options make sense.

export type FormatId = 'feed' | 'story' | 'video' | 'carousel' | 'banner';
export type OutputKind = 'photo' | 'video';

export interface FormatSize {
  ratio: string;
  width: number;
  height: number;
  /** Matches a key of ARTBOARD_PRESETS in the editor. */
  preset: string;
}

export interface AdFormat {
  id: FormatId;
  label: string;
  kind: OutputKind;
  sizes: FormatSize[];
  /** Video lengths in seconds. Empty for photo formats. */
  lengths: number[];
  defaultLength: number;
  /** Number of scenes (or slides) the first plan starts with. */
  defaultScenes: number;
  description: string;
}

const SIZE_4_5: FormatSize = { ratio: '4:5', width: 1080, height: 1350, preset: 'instagramPortrait' };
const SIZE_9_16: FormatSize = { ratio: '9:16', width: 1080, height: 1920, preset: 'reels' };
const SIZE_1_1: FormatSize = { ratio: '1:1', width: 1080, height: 1080, preset: 'instagramSquare' };
const SIZE_16_9: FormatSize = { ratio: '16:9', width: 1920, height: 1080, preset: 'youtube' };

export const VIDEO_LENGTHS = [5, 10, 15] as const;

export const AD_FORMATS: AdFormat[] = [
  {
    id: 'feed',
    label: 'Feed post',
    kind: 'photo',
    sizes: [SIZE_4_5],
    lengths: [],
    defaultLength: 0,
    defaultScenes: 3,
    description: 'One image with a headline, a supporting line and a button.',
  },
  {
    id: 'story',
    label: 'Story or Reel',
    kind: 'video',
    sizes: [SIZE_9_16],
    lengths: [...VIDEO_LENGTHS],
    defaultLength: 15,
    defaultScenes: 5,
    description: 'A vertical video built from scenes on the timeline.',
  },
  {
    id: 'video',
    label: 'Video ad',
    kind: 'video',
    sizes: [SIZE_9_16, SIZE_1_1],
    lengths: [...VIDEO_LENGTHS],
    defaultLength: 15,
    defaultScenes: 5,
    description: 'A video ad in tall or square format.',
  },
  {
    id: 'carousel',
    label: 'Carousel',
    kind: 'photo',
    sizes: [SIZE_1_1],
    lengths: [],
    defaultLength: 0,
    defaultScenes: 5,
    description: 'Swipeable slides, one per scene.',
  },
  {
    id: 'banner',
    label: 'Banner',
    kind: 'photo',
    sizes: [SIZE_16_9],
    lengths: [],
    defaultLength: 0,
    defaultScenes: 3,
    description: 'A wide banner for display placements.',
  },
];

export const DEFAULT_FORMAT: FormatId = 'story';

export function formatById(id: string | null | undefined): AdFormat {
  return AD_FORMATS.find((format) => format.id === id) ?? AD_FORMATS.find((format) => format.id === DEFAULT_FORMAT)!;
}

export function sizeFor(format: AdFormat, ratio?: string | null): FormatSize {
  return format.sizes.find((size) => size.ratio === ratio) ?? format.sizes[0];
}

/** Scene count that fits a video length. */
export function sceneCountForLength(length: number): number {
  if (length <= 5) return 3;
  if (length <= 10) return 4;
  return 5;
}

export function initialSceneCount(format: AdFormat, length: number): number {
  return format.kind === 'video' ? sceneCountForLength(length) : format.defaultScenes;
}

/** Where the editor should open for a finished or in-progress ad. */
export function editorTarget(format: AdFormat, size: FormatSize): { preset: string; mode: OutputKind } {
  return { preset: size.preset, mode: format.kind };
}

export function nearestLength(seconds: number): 5 | 10 | 15 {
  if (seconds <= 7) return 5;
  if (seconds <= 12) return 10;
  return 15;
}
