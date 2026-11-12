import { Gradient } from 'fabric';
import { isOverlayScrim } from './loadIntoCanvas';

/**
 * A contrast scrim is a black wash behind the type. The top of the wash is
 * fully transparent so the photo shows through and the rectangle has no edge.
 * Object opacity is the intensity control and multiplies every stop.
 */
export const SCRIM_STOPS = [
  { offset: 0, color: 'rgba(0,0,0,0)' },
  { offset: 0.08, color: 'rgba(0,0,0,0.12)' },
  { offset: 0.28, color: 'rgba(0,0,0,0.34)' },
  { offset: 1, color: 'rgba(0,0,0,0.55)' },
] as const;

type ScrimLike = {
  name?: string;
  meta?: { role?: string };
  width?: number;
  height?: number;
  fill?: unknown;
  opacity?: number;
  dirty?: boolean;
  lockMovementX?: boolean;
  lockMovementY?: boolean;
  set?: (props: Record<string, unknown>) => void;
  setCoords?: () => void;
};

export const isGradientFill = (fill: unknown): fill is { type?: string; coords?: Record<string, number>; colorStops?: unknown[] } =>
  !!fill && typeof fill === 'object' && Array.isArray((fill as { colorStops?: unknown }).colorStops);

/**
 * Percentage units run from the top of the rect to its bottom. Pixel coords
 * are measured from the center, which collapses this fade into a flat plate.
 */
export const contrastScrimFillJSON = () => ({
  type: 'linear' as const,
  gradientUnits: 'percentage' as const,
  coords: { x1: 0, y1: 0, x2: 0, y2: 1 },
  colorStops: SCRIM_STOPS.map((stop) => ({ offset: stop.offset, color: stop.color })),
});

export const contrastScrimGradient = () => new Gradient(contrastScrimFillJSON());

const canonicalFade = (fill: { gradientUnits?: string; coords?: Record<string, number>; colorStops?: { color?: string }[] }) =>
  fill.gradientUnits === 'percentage'
  && fill.coords?.y1 === 0
  && fill.coords?.y2 === 1
  && fill.colorStops?.[0]?.color === 'rgba(0,0,0,0)';

/**
 * Replace a solid plate with the fade. A fade that is already in place is left
 * alone, so a resized box and the chosen opacity survive.
 */
const interactionProps = (object: ScrimLike) => {
  const locked = !!(object.lockMovementX && object.lockMovementY);
  return {
    perPixelTargetFind: true,
    selectable: true,
    evented: true,
    hasControls: !locked,
    hasBorders: true,
    hoverCursor: locked ? 'default' : 'move',
  };
};

export const ensureContrastScrim = (object: ScrimLike | null | undefined) => {
  if (!object) return;
  const fill = object.fill;
  if (!isGradientFill(fill) || !canonicalFade(fill)) {
    object.set?.({
      fill: contrastScrimGradient(),
      stroke: null,
      strokeWidth: 0,
      ...interactionProps(object),
    });
  } else {
    object.set?.({ ...interactionProps(object) });
  }
  object.dirty = true;
};

/** Full-bleed wash from a clear top to the bottom of the artboard, so the plate has no edge. */
export const placeContrastScrim = (
  object: ScrimLike | null | undefined,
  frame: { width: number; height: number },
) => {
  if (!object || frame.width < 2 || frame.height < 2) return;
  const top = Math.round(frame.height * 0.34);
  object.set?.({
    originX: 'left',
    originY: 'top',
    left: 0,
    top,
    width: frame.width,
    height: Math.max(1, frame.height - top),
    scaleX: 1,
    scaleY: 1,
    angle: 0,
  });
  ensureContrastScrim(object);
  object.setCoords?.();
};

/** Apply the fade to every scrim already on a canvas. Safe to call after load, undo, and page changes. */
export const prepareLoadedScrims = (canvas: { getObjects: () => ScrimLike[] } | null | undefined) => {
  canvas?.getObjects().forEach((object) => {
    if (!isOverlayScrim(object)) return;
    ensureContrastScrim(object);
    object.setCoords?.();
  });
};
