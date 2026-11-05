import { FabricImage } from 'fabric';
import type { Canvas as FabricCanvas } from 'fabric';

type EditableImage = FabricImage & Record<string, any>;

const imageSize = (image: EditableImage) => ({
  width: Math.max(1, Number(image.width) || 1),
  height: Math.max(1, Number(image.height) || 1),
});

export type ArtboardFrame = { width: number; height: number };

const LONG_EDGE = 1080;

/** A design size that keeps the source aspect and puts the long side on a standard edge. */
export const frameFromAspect = (width: number, height: number, longEdge = LONG_EDGE): ArtboardFrame => {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const scale = longEdge / Math.max(w, h);
  return {
    width: Math.max(2, Math.round(w * scale)),
    height: Math.max(2, Math.round(h * scale)),
  };
};

const objectBox = (object: any) => {
  const width = Math.max(1, object.getScaledWidth?.() ?? (Number(object.width) || 0) * (Number(object.scaleX) || 1));
  const height = Math.max(1, object.getScaledHeight?.() ?? (Number(object.height) || 0) * (Number(object.scaleY) || 1));
  const originX = object.originX || 'left';
  const originY = object.originY || 'top';
  const left = (Number(object.left) || 0) - (originX === 'center' ? width / 2 : originX === 'right' ? width : 0);
  const top = (Number(object.top) || 0) - (originY === 'center' ? height / 2 : originY === 'bottom' ? height : 0);
  return { left, top, width, height, area: width * height };
};

export const measureContentBounds = (canvas: FabricCanvas) => {
  const objects = canvas.getObjects();
  if (!objects.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  objects.forEach((object) => {
    const box = objectBox(object);
    minX = Math.min(minX, box.left);
    minY = Math.min(minY, box.top);
    maxX = Math.max(maxX, box.left + box.width);
    maxY = Math.max(maxY, box.top + box.height);
  });
  const width = maxX - minX;
  const height = maxY - minY;
  if (!(width > 1 && height > 1)) return null;
  return { left: minX, top: minY, width, height };
};

/**
 * The artboard is the template's own width and height when those exist.
 * Otherwise it follows the artwork, so a photo or an unsized template still
 * gets a canvas of its own shape.
 */
export const frameForTemplate = (
  declared: { width?: number | null; height?: number | null },
  content: { width: number; height: number } | null,
): ArtboardFrame => {
  const declaredWidth = Number(declared.width) || 0;
  const declaredHeight = Number(declared.height) || 0;
  if (declaredWidth > 1 && declaredHeight > 1) return { width: Math.round(declaredWidth), height: Math.round(declaredHeight) };
  if (content) return frameFromAspect(content.width, content.height);
  return { width: LONG_EDGE, height: LONG_EDGE };
};

/** Scale every layer, uniformly, so the design fills `frame` and stays fully visible. */
export const fitContentToFrame = (canvas: FabricCanvas, frame: ArtboardFrame) => {
  const bounds = measureContentBounds(canvas);
  if (!bounds) return;
  const scale = Math.min(frame.width / bounds.width, frame.height / bounds.height);
  const offsetX = (frame.width - bounds.width * scale) / 2 - bounds.left * scale;
  const offsetY = (frame.height - bounds.height * scale) / 2 - bounds.top * scale;
  canvas.getObjects().forEach((object: any) => {
    const originX = object.originX || 'left';
    const originY = object.originY || 'top';
    const width = object.getScaledWidth?.() ?? (Number(object.width) || 0) * (Number(object.scaleX) || 1);
    const height = object.getScaledHeight?.() ?? (Number(object.height) || 0) * (Number(object.scaleY) || 1);
    const left = (Number(object.left) || 0) - (originX === 'center' ? width / 2 : originX === 'right' ? width : 0);
    const top = (Number(object.top) || 0) - (originY === 'center' ? height / 2 : originY === 'bottom' ? height : 0);
    const nextWidth = width * scale;
    const nextHeight = height * scale;
    const nextLeft = left * scale + offsetX;
    const nextTop = top * scale + offsetY;
    object.set({
      originX: 'left',
      originY: 'top',
      left: nextLeft,
      top: nextTop,
      scaleX: (Number(object.scaleX) || 1) * scale,
      scaleY: (Number(object.scaleY) || 1) * scale,
    });
    if (originX === 'center') object.set({ left: nextLeft + nextWidth / 2, originX: 'center' });
    if (originX === 'right') object.set({ left: nextLeft + nextWidth, originX: 'right' });
    if (originY === 'center') object.set({ top: nextTop + nextHeight / 2, originY: 'center' });
    if (originY === 'bottom') object.set({ top: nextTop + nextHeight, originY: 'bottom' });
    object.setCoords?.();
  });
  // The largest photo fills whatever frame the design landed in, so a template
  // image cannot sit in the middle of an empty artboard.
  const images = canvas.getObjects().filter((object: any) => object.type === 'image');
  const hero = images.reduce<any>((best, object) => {
    const box = objectBox(object);
    return !best || box.area > best.area ? { object, area: box.area } : best;
  }, null);
  if (hero) {
    scaleImageToCover(hero.object, { left: 0, top: 0, width: frame.width, height: frame.height });
    hero.object.set({ mediaFit: 'cover' });
    const stack = canvas as FabricCanvas & { moveObjectTo?: (object: unknown, index: number) => void; sendObjectToBack?: (object: unknown) => void };
    if (stack.sendObjectToBack) stack.sendObjectToBack(hero.object);
    else stack.moveObjectTo?.(hero.object, 0);
  }
  canvas.requestRenderAll();
};

export const publishArtboard = (canvas: FabricCanvas, frame: ArtboardFrame) => {
  canvas.setDimensions({ width: frame.width, height: frame.height });
  (canvas as FabricCanvas & { fire: (name: string, payload?: unknown) => void }).fire('advista:artboard', frame);
};

export const scaleImageToCover = (
  image: EditableImage,
  frame: { left: number; top: number; width: number; height: number; angle?: number },
) => {
  const source = imageSize(image);
  const scale = Math.max(frame.width / source.width, frame.height / source.height);
  const drawnW = source.width * scale;
  const drawnH = source.height * scale;
  image.set({
    originX: 'left',
    originY: 'top',
    left: frame.left + (frame.width - drawnW) / 2,
    top: frame.top + (frame.height - drawnH) / 2,
    scaleX: scale,
    scaleY: scale,
    angle: frame.angle ?? 0,
  });
  image.setCoords();
  return image;
};

export const addImageCoveringCanvas = async (canvas: FabricCanvas, url: string) => {
  const image = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' }) as EditableImage;
  scaleImageToCover(image, {
    left: 0,
    top: 0,
    width: canvas.getWidth(),
    height: canvas.getHeight(),
  });
  image.set({ name: 'Full-bleed image', mediaFit: 'cover' });
  canvas.add(image);
  canvas.setActiveObject(image);
  canvas.requestRenderAll();
  return image;
};

/**
 * An image dropped on an empty canvas becomes the artboard: same aspect, filled edge to edge.
 * An image dropped onto an existing design is fitted inside the current artboard, whole image visible.
 */
export const placeFittedImage = async (canvas: FabricCanvas, url: string) => {
  const image = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' }) as EditableImage;
  const source = imageSize(image);
  if (canvas.getObjects().length === 0) {
    const frame = frameFromAspect(source.width, source.height);
    publishArtboard(canvas, frame);
    scaleImageToCover(image, { left: 0, top: 0, width: frame.width, height: frame.height });
    image.set({ name: 'Full-bleed image', mediaFit: 'cover' });
  } else {
    const frameWidth = canvas.getWidth() || LONG_EDGE;
    const frameHeight = canvas.getHeight() || LONG_EDGE;
    const scale = Math.min(frameWidth / source.width, frameHeight / source.height);
    image.set({
      left: (frameWidth - source.width * scale) / 2,
      top: (frameHeight - source.height * scale) / 2,
      scaleX: scale,
      scaleY: scale,
      name: 'Image layer',
      mediaFit: 'contain',
    });
  }
  image.setCoords();
  canvas.add(image);
  canvas.setActiveObject(image);
  canvas.requestRenderAll();
  return image;
};

export const replaceImageKeepingFrame = async (
  canvas: FabricCanvas,
  target: EditableImage,
  url: string,
) => {
  const next = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' }) as EditableImage;
  const frame = {
    left: Number(target.left) || 0,
    top: Number(target.top) || 0,
    width: target.getScaledWidth(),
    height: target.getScaledHeight(),
  };
  const metadata = {
    name: target.name,
    id: target.id,
    variableKey: target.variableKey,
    brandReplaceable: target.brandReplaceable,
    aiReplaceable: target.aiReplaceable,
    brandCompliant: target.brandCompliant,
    mediaFit: 'cover',
  };
  scaleImageToCover(next, {
    left: frame.left,
    top: frame.top,
    width: frame.width,
    height: frame.height,
    angle: Number(target.angle) || 0,
  });
  next.set(metadata);
  const index = canvas.getObjects().indexOf(target);
  canvas.remove(target);
  canvas.add(next);
  if (index >= 0) (canvas as FabricCanvas & { moveObjectTo?: (object: FabricImage, index: number) => void }).moveObjectTo?.(next, index);
  canvas.setActiveObject(next);
  canvas.requestRenderAll();
  return next;
};