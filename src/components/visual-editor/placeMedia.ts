import { Circle, FabricImage, Polygon, Rect, Textbox, type Canvas as FabricCanvas } from 'fabric';
import { placeFittedImage } from './canvasImagePlacement';
import { FRAME_MASKS, gridCountFromId, gridSlots, maskPoints, scalePoints, type FrameMask } from './frames';
import { defaultClip, kindFromObject, type TimelineClip } from './videoTimeline';

type AnyObj = Record<string, any>;

const waitForMedia = (element: HTMLMediaElement) => new Promise<void>((resolve, reject) => {
  if (element.readyState >= 1) {
    resolve();
    return;
  }
  const ok = () => { cleanup(); resolve(); };
  const fail = () => { cleanup(); reject(new Error('The file could not be read.')); };
  const cleanup = () => {
    element.removeEventListener('loadedmetadata', ok);
    element.removeEventListener('error', fail);
  };
  element.addEventListener('loadedmetadata', ok);
  element.addEventListener('error', fail);
});

export function ensureObjectClip(object: AnyObj): TimelineClip {
  if (object.advistaClip) return object.advistaClip as TimelineClip;
  const kind = kindFromObject(object);
  const id = object.advistaId || (object.advistaId = crypto.randomUUID());
  const clip = defaultClip({ id, kind });
  object.advistaClip = clip;
  if (typeof object.opacity === 'number') object.advistaBaseOpacity = object.opacity;
  else object.advistaBaseOpacity = 1;
  return clip;
}

export function writeClip(object: AnyObj, clip: TimelineClip) {
  object.advistaClip = clip;
  object.advistaId = clip.id;
}

export function isFrameTarget(object: AnyObj | null | undefined) {
  return Boolean(object?.advistaFrame) && !object?.advistaMedia && !object?.advistaAudio;
}

const boxOf = (object: AnyObj) => {
  const width = Math.max(1, object.getScaledWidth?.() ?? (Number(object.width) || 1) * (Number(object.scaleX) || 1));
  const height = Math.max(1, object.getScaledHeight?.() ?? (Number(object.height) || 1) * (Number(object.scaleY) || 1));
  return { left: Number(object.left) || 0, top: Number(object.top) || 0, width, height };
};

export function applyFrameMask(object: AnyObj, mask: FrameMask) {
  const box = boxOf(object);
  const localW = box.width / (Number(object.scaleX) || 1);
  const localH = box.height / (Number(object.scaleY) || 1);
  const points = maskPoints(mask);
  let clipPath: AnyObj;
  if (points) {
    clipPath = new Polygon(scalePoints(points, localW, localH), {
      originX: 'center',
      originY: 'center',
      absolutePositioned: false,
    });
  } else if (mask === 'circle') {
    clipPath = new Circle({
      radius: Math.min(localW, localH) / 2,
      originX: 'center',
      originY: 'center',
      absolutePositioned: false,
    });
  } else if (mask === 'device') {
    clipPath = new Rect({
      width: localW,
      height: localH,
      rx: Math.min(28, localW * 0.08),
      ry: Math.min(28, localH * 0.08),
      originX: 'center',
      originY: 'center',
      absolutePositioned: false,
    });
  } else {
    clipPath = new Rect({
      width: localW,
      height: localH,
      originX: 'center',
      originY: 'center',
      absolutePositioned: false,
    });
  }
  object.clipPath = clipPath;
  object.advistaFrame = mask;
  object.dirty = true;
}

const fitInto = (object: AnyObj, box: { left: number; top: number; width: number; height: number }) => {
  const width = Math.max(1, Number(object.width) || 1);
  const height = Math.max(1, Number(object.height) || 1);
  const scale = Math.max(box.width / width, box.height / height);
  object.set?.({
    left: box.left + box.width / 2,
    top: box.top + box.height / 2,
    originX: 'center',
    originY: 'center',
    scaleX: scale,
    scaleY: scale,
  });
  object.setCoords?.();
};

export async function addTimelineVideo(canvas: FabricCanvas, url: string, frame?: AnyObj | null) {
  const video = document.createElement('video');
  video.src = url;
  if (!url.startsWith('blob:')) video.crossOrigin = 'anonymous';
  video.playsInline = true;
  video.muted = true;
  video.preload = 'auto';
  await waitForMedia(video);
  video.width = video.videoWidth || 480;
  video.height = video.videoHeight || 360;
  const image = new FabricImage(video, {
    left: 48,
    top: 48,
    objectCaching: false,
    width: video.videoWidth || 480,
    height: video.videoHeight || 360,
  });
  const scale = Math.min(300 / Math.max(1, video.videoWidth || 300), 340 / Math.max(1, video.videoHeight || 340));
  image.scale(scale);
  const clip = ensureObjectClip(image);
  writeClip(image, {
    ...clip,
    kind: 'video',
    duration: Math.min(10, Math.max(1, video.duration || 5)),
    sourceDuration: video.duration || 10,
  });
  (image as AnyObj).advistaKind = 'video';
  (image as AnyObj).advistaMedia = video;
  if (frame && isFrameTarget(frame)) {
    fitInto(image, boxOf(frame));
    applyFrameMask(image, frame.advistaFrame as FrameMask);
    canvas.remove(frame as never);
  }
  canvas.add(image);
  canvas.setActiveObject(image);
  canvas.requestRenderAll();
  return image;
}

export async function addTimelineAudio(canvas: FabricCanvas, url: string, name = 'Audio') {
  const audio = document.createElement('audio');
  audio.src = url;
  audio.preload = 'auto';
  await waitForMedia(audio);
  const chip = new Rect({
    left: 24,
    top: 24,
    width: 8,
    height: 8,
    fill: 'transparent',
    opacity: 0,
    selectable: true,
    evented: false,
  });
  const clip = ensureObjectClip(chip);
  writeClip(chip, {
    ...clip,
    kind: 'audio',
    trackId: 'audio',
    duration: Math.min(30, Math.max(0.4, audio.duration || 4)),
    sourceDuration: audio.duration || 8,
  });
  (chip as AnyObj).advistaKind = 'audio';
  (chip as AnyObj).advistaAudio = audio;
  (chip as AnyObj).advistaName = name;
  canvas.add(chip);
  canvas.setActiveObject(chip);
  canvas.requestRenderAll();
  return chip;
}

export async function addTimelinePhoto(canvas: FabricCanvas, url: string, frame?: AnyObj | null) {
  if (frame && isFrameTarget(frame)) {
    const image = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    fitInto(image, boxOf(frame));
    applyFrameMask(image, frame.advistaFrame as FrameMask);
    const clip = ensureObjectClip(image);
    writeClip(image, { ...clip, kind: 'image' });
    (image as AnyObj).advistaKind = 'image';
    canvas.remove(frame as never);
    canvas.add(image);
    canvas.setActiveObject(image);
    canvas.requestRenderAll();
    return image;
  }
  await placeFittedImage(canvas, url);
  const objects = canvas.getObjects() as AnyObj[];
  const image = objects[objects.length - 1];
  if (image) {
    const clip = ensureObjectClip(image);
    writeClip(image, { ...clip, kind: 'image' });
    (image as AnyObj).advistaKind = 'image';
  }
  canvas.requestRenderAll();
  return image;
}

export function addFrame(canvas: FabricCanvas, mask: FrameMask, fill = '#6E56F5') {
  const width = mask === 'device' ? 220 : 300;
  const height = mask === 'device' ? 420 : 340;
  const placed = canvas.getObjects().filter((object) => (object as AnyObj).advistaFrame && !(object as AnyObj).advistaMedia).length;
  const frame = new Rect({
    left: 36 + (placed % 3) * (width + 18),
    top: 36 + Math.floor(placed / 3) * (height + 18),
    width,
    height,
    fill: 'rgba(110,86,245,0.16)',
    stroke: fill,
    strokeWidth: 2,
    strokeDashArray: [6, 4],
  });
  (frame as AnyObj).advistaFrame = mask;
  (frame as AnyObj).advistaKind = 'shape';
  ensureObjectClip(frame);
  canvas.add(frame);
  canvas.setActiveObject(frame);
  canvas.requestRenderAll();
  return frame;
}

export function addGrid(canvas: FabricCanvas, count: number, fill = '#6E56F5') {
  const slots = gridSlots(count, 640, 360, 12);
  const occupied = canvas.getObjects().some((object) => (object as AnyObj).advistaFrame);
  const originTop = occupied ? 420 : 36;
  const frames = slots.map((slot) => {
    const frame = new Rect({
      left: 36 + slot.x,
      top: originTop + slot.y,
      width: slot.w,
      height: slot.h,
      fill: 'rgba(110,86,245,0.16)',
      stroke: fill,
      strokeWidth: 2,
    });
    (frame as AnyObj).advistaFrame = 'square';
    (frame as AnyObj).advistaKind = 'shape';
    (frame as AnyObj).advistaGrid = true;
    ensureObjectClip(frame);
    canvas.add(frame);
    return frame;
  });
  canvas.requestRenderAll();
  return frames;
}

export function detachFrame(object: AnyObj | null | undefined) {
  if (!object) return;
  object.clipPath = undefined;
  object.advistaFrame = undefined;
  object.dirty = true;
}

export const frameMaskById = (id: string) => FRAME_MASKS.find((frame) => frame.id === id)?.mask ?? null;

export { gridCountFromId };

export interface TimedMedia {
  url: string;
  start: number;
  duration: number;
}

export interface DirectorSequence {
  videos: TimedMedia[];
  stills: TimedMedia[];
  titles: Array<{ text: string; start: number; duration: number }>;
}

/** Puts real clips and the shot-list titles on the timeline. A missing url is skipped. */
export async function placeDirectorSequence(canvas: FabricCanvas, sequence: DirectorSequence) {
  const width = canvas.getWidth?.() || 1080;
  const height = canvas.getHeight?.() || 1350;
  for (const video of sequence.videos) {
    if (!video.url) continue;
    try {
      const object = await addTimelineVideo(canvas, video.url) as AnyObj;
      const clip = ensureObjectClip(object);
      const duration = Math.min(video.duration, clip.sourceDuration || video.duration);
      writeClip(object, { ...clip, kind: 'video', start: video.start, duration: Math.max(0.4, duration) });
      object.set?.({ left: 48, top: 80 });
    } catch {
      /* This file did not load. The titles still go down. */
    }
  }
  for (const still of sequence.stills) {
    if (!still.url) continue;
    try {
      const object = await addTimelinePhoto(canvas, still.url) as AnyObj;
      const clip = ensureObjectClip(object);
      writeClip(object, { ...clip, kind: 'image', start: still.start, duration: still.duration, sourceDuration: 600 });
      object.set?.({ left: 48, top: 80 });
    } catch {
      /* A still that fails to load is left off the timeline. */
    }
  }
  sequence.titles.forEach((title, index) => {
    const text = title.text.trim();
    if (!text) return;
    const box = new Textbox(text, {
      left: 36,
      top: Math.round(height * 0.72),
      width: Math.max(120, width - 72),
      fontSize: Math.max(18, Math.round(width * 0.046)),
      fontWeight: '700',
      fill: '#ffffff',
      backgroundColor: 'rgba(12,12,12,0.72)',
      padding: 8,
      fontFamily: 'Inter',
      textAlign: 'center',
    });
    const clip = ensureObjectClip(box);
    writeClip(box, {
      ...clip,
      kind: 'text',
      trackId: 'text',
      start: title.start,
      duration: title.duration,
      sourceDuration: 600,
    });
    (box as AnyObj).advistaKind = 'text';
    (box as AnyObj).advistaName = text;
    canvas.add(box);
    if (index === 0) canvas.setActiveObject(box);
  });
  canvas.requestRenderAll();
}
