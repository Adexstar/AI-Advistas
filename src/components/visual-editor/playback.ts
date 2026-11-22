import type { Canvas as FabricCanvas } from 'fabric';
import {
  animationFactor,
  audibleVolume,
  clipVisible,
  type TimelineClip,
} from './videoTimeline';

type ClipObject = {
  advistaClip?: TimelineClip;
  advistaAudio?: HTMLMediaElement;
  advistaMedia?: HTMLMediaElement;
  advistaBaseOpacity?: number;
  visible?: boolean;
  opacity?: number;
  getElement?: () => HTMLElement | undefined;
  set?: (props: Record<string, unknown>) => void;
};

export function mediaElement(object: ClipObject | null | undefined): HTMLMediaElement | null {
  if (!object) return null;
  if (object.advistaAudio) return object.advistaAudio;
  if (object.advistaMedia) return object.advistaMedia;
  const element = object.getElement?.();
  if (element instanceof HTMLVideoElement || element instanceof HTMLAudioElement) return element;
  return null;
}

const seek = (element: HTMLMediaElement, time: number) => {
  if (!Number.isFinite(time)) return;
  if (Math.abs(element.currentTime - time) < 0.12) return;
  try {
    element.currentTime = time;
  } catch {
    /* The element may not have metadata yet. The next frame tries again. */
  }
};

/** Show, hide, seek and play every clip so the artboard matches the playhead. */
export function syncMedia(canvas: FabricCanvas | null, time: number, playing: boolean) {
  if (!canvas) return;
  for (const object of canvas.getObjects() as ClipObject[]) {
    const clip = object.advistaClip;
    if (!clip) continue;
    const visible = clipVisible(clip, time);
    const element = mediaElement(object);
    const local = Math.max(0, time - clip.start);
    if (element) {
      seek(element, clip.trimIn + local);
      element.volume = audibleVolume(clip, local);
      if (playing && visible) {
        if (element.paused) void element.play().catch(() => { element.muted = true; void element.play().catch(() => undefined); });
      } else if (!element.paused) {
        element.pause();
      }
    }
    (object as { dirty?: boolean }).dirty = true;
    if (object.advistaAudio) continue;
    const base = object.advistaBaseOpacity ?? 1;
    const opacity = visible ? base * animationFactor(clip, local) : 0;
    object.set?.({ opacity, visible: visible || opacity > 0 });
    if (!visible) object.visible = false;
  }
  canvas.requestRenderAll();
}

export async function primeMedia(canvas: FabricCanvas | null) {
  if (!canvas) return;
  for (const object of canvas.getObjects() as ClipObject[]) {
    const element = mediaElement(object);
    if (!element) continue;
    element.muted = false;
    try {
      await element.play();
      element.pause();
    } catch {
      element.muted = true;
    }
  }
}
