import type { Creative } from '@/services/creative/CreativeService';

export type DesignType = 'photo' | 'video';
export type DesignStatus = 'draft' | 'finished';

export type DesignContent = {
  designType?: DesignType;
  designStatus?: DesignStatus;
  durationSec?: number;
  [key: string]: unknown;
};

export function asDesignContent(content: unknown): DesignContent {
  return content && typeof content === 'object' && !Array.isArray(content)
    ? (content as DesignContent)
    : {};
}

/** Infer photo/video from saved content, falling back to canvas clues. */
export function designTypeOf(creative: Pick<Creative, 'content' | 'canvas_data'>): DesignType {
  const content = asDesignContent(creative.content);
  if (content.designType === 'video' || content.designType === 'photo') return content.designType;
  if (content.videoUrl || content.durationSec) return 'video';
  const doc = creative.canvas_data as Record<string, unknown> | null;
  if (doc && typeof doc === 'object') {
    const objects = Array.isArray(doc.objects) ? doc.objects : [];
    if (objects.some((object) => {
      if (!object || typeof object !== 'object') return false;
      const item = object as Record<string, unknown>;
      return item.advistaKind === 'video' || item.type === 'video';
    })) return 'video';
  }
  return 'photo';
}

export function designStatusOf(creative: Pick<Creative, 'status' | 'content'>): DesignStatus {
  const content = asDesignContent(creative.content);
  if (content.designStatus === 'finished' || content.designStatus === 'draft') return content.designStatus;
  if (creative.status === 'published' || creative.status === 'finished' || creative.status === 'ready') return 'finished';
  return 'draft';
}

/** Finished designs that are not attached to a campaign are ready to launch. */
export function usedInCampaign(creative: Pick<Creative, 'campaign_id'>): boolean {
  return !!creative.campaign_id;
}

export function readyToLaunch(creative: Pick<Creative, 'status' | 'content' | 'campaign_id'>): boolean {
  return designStatusOf(creative) === 'finished' && !usedInCampaign(creative);
}

export function designDurationLabel(creative: Pick<Creative, 'content'>): string | null {
  const sec = Number(asDesignContent(creative.content).durationSec);
  if (!Number.isFinite(sec) || sec <= 0) return null;
  const whole = Math.round(sec);
  const minutes = Math.floor(whole / 60);
  const seconds = whole % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatEditedAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'Edited recently';
  const minutes = Math.max(0, Math.round((now - then) / 60_000));
  if (minutes < 1) return 'Edited just now';
  if (minutes < 60) return `Edited ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Edited ${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `Edited ${days}d ago`;
  return `Edited ${new Date(iso).toLocaleDateString()}`;
}

export const START_PRESETS = [
  {
    id: 'instagram-post',
    label: 'Instagram Post',
    ratio: '4:5',
    preset: 'instagramPortrait',
    mode: 'photo' as const,
  },
  {
    id: 'story',
    label: 'Story',
    ratio: '9:16',
    preset: 'reels',
    mode: 'photo' as const,
  },
  {
    id: 'square',
    label: 'Square',
    ratio: '1:1',
    preset: 'instagramSquare',
    mode: 'photo' as const,
  },
  {
    id: 'video',
    label: 'Video',
    ratio: null,
    preset: 'reels',
    mode: 'video' as const,
  },
] as const;

export function editorStartUrl(options: {
  preset?: string;
  mode?: DesignType;
  width?: number;
  height?: number;
  adId?: string;
  upload?: boolean;
}): string {
  const params = new URLSearchParams();
  if (options.adId) {
    params.set('adId', options.adId);
    return `/visual-editor?${params.toString()}`;
  }
  if (options.preset) params.set('preset', options.preset);
  if (options.mode === 'video') params.set('mode', 'video');
  if (options.width && options.height) {
    params.set('w', String(Math.round(options.width)));
    params.set('h', String(Math.round(options.height)));
    params.set('preset', 'custom');
  }
  if (options.upload) params.set('upload', '1');
  const query = params.toString();
  return query ? `/visual-editor?${query}` : '/visual-editor';
}

let pendingUpload: File | null = null;

export function setPendingEditorUpload(file: File | null) {
  pendingUpload = file;
}

export function takePendingEditorUpload(): File | null {
  const file = pendingUpload;
  pendingUpload = null;
  return file;
}
