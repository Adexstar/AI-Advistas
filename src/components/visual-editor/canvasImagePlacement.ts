import { FabricImage } from 'fabric';
import type { Canvas as FabricCanvas } from 'fabric';

type EditableImage = FabricImage & Record<string, any>;

const imageSize = (image: EditableImage) => ({
  width: Math.max(1, Number(image.width) || 1),
  height: Math.max(1, Number(image.height) || 1),
});

export const scaleImageToCover = (
  image: EditableImage,
  frame: { left: number; top: number; width: number; height: number; angle?: number },
) => {
  const source = imageSize(image);
  const scale = Math.max(frame.width / source.width, frame.height / source.height);
  image.set({
    left: frame.left + (frame.width - source.width * scale) / 2,
    top: frame.top + (frame.height - source.height * scale) / 2,
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

export const replaceImageKeepingFrame = async (
  canvas: FabricCanvas,
  target: EditableImage,
  url: string,
) => {
  const next = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' }) as EditableImage;
  const frame = target.getBoundingRect();
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