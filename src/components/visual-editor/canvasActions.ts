// Shared, side-effect-free canvas operations for the Visual Editor.
// Every toolbar, panel and shortcut goes through these helpers so behaviour
// stays identical wherever an action is triggered.
import type { Canvas as FabricCanvas } from 'fabric';

type AnyObj = any;

export const getActive = (canvas: FabricCanvas | null): AnyObj | null =>
  canvas?.getActiveObject() ?? null;

export async function duplicateObject(canvas: FabricCanvas | null, obj: AnyObj) {
  if (!canvas || !obj) return null;
  const clone: AnyObj = await obj.clone();
  clone.set({ left: (obj.left || 0) + 16, top: (obj.top || 0) + 16 });
  canvas.add(clone);
  canvas.setActiveObject(clone);
  canvas.requestRenderAll();
  return clone;
}

export function deleteObject(canvas: FabricCanvas | null, obj: AnyObj) {
  if (!canvas || !obj) return;
  if (obj.type === 'activeselection' && Array.isArray(obj._objects)) {
    [...obj._objects].forEach((o: AnyObj) => canvas.remove(o));
  } else {
    canvas.remove(obj);
  }
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}

export function moveLayer(canvas: FabricCanvas | null, obj: AnyObj, dir: 'up' | 'down' | 'front' | 'back') {
  if (!canvas || !obj) return;
  const c = canvas as AnyObj;
  if (dir === 'up') c.bringObjectForward?.(obj);
  else if (dir === 'down') c.sendObjectBackwards?.(obj);
  else if (dir === 'front') c.bringObjectToFront?.(obj);
  else c.sendObjectToBack?.(obj);
  canvas.requestRenderAll();
}

export function reorderLayer(canvas: FabricCanvas | null, obj: AnyObj, index: number) {
  if (!canvas || !obj) return;
  (canvas as AnyObj).moveObjectTo?.(obj, Math.max(0, Math.min(index, canvas.getObjects().length - 1)));
  canvas.requestRenderAll();
}

export function isLocked(obj: AnyObj) {
  return !!(obj?.lockMovementX && obj?.lockMovementY);
}

export function setLocked(canvas: FabricCanvas | null, obj: AnyObj, locked: boolean) {
  if (!canvas || !obj) return;
  obj.set({
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    hasControls: !locked,
    selectable: true,
    editable: obj.type?.includes('text') ? !locked : obj.editable,
  });
  canvas.requestRenderAll();
}

export function setVisible(canvas: FabricCanvas | null, obj: AnyObj, visible: boolean) {
  if (!canvas || !obj) return;
  obj.set({ visible });
  canvas.requestRenderAll();
}

export function alignObject(
  canvas: FabricCanvas | null,
  obj: AnyObj,
  align: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom',
) {
  if (!canvas || !obj) return;
  const cw = canvas.getWidth();
  const ch = canvas.getHeight();
  const w = obj.getScaledWidth?.() ?? obj.width ?? 0;
  const h = obj.getScaledHeight?.() ?? obj.height ?? 0;
  switch (align) {
    case 'left': obj.set({ left: 0 }); break;
    case 'center-h': obj.set({ left: (cw - w) / 2 }); break;
    case 'right': obj.set({ left: cw - w }); break;
    case 'top': obj.set({ top: 0 }); break;
    case 'center-v': obj.set({ top: (ch - h) / 2 }); break;
    case 'bottom': obj.set({ top: ch - h }); break;
  }
  obj.setCoords();
  canvas.requestRenderAll();
}

export const ARTBOARD_PRESETS: Record<string, { label: string; width: number; height: number }> = {
  desktop: { label: 'Desktop', width: 640, height: 360 },
  mobile: { label: 'Mobile', width: 360, height: 640 },
  instagram: { label: 'Instagram', width: 540, height: 540 },
  facebook: { label: 'Facebook', width: 600, height: 315 },
  tiktok: { label: 'TikTok', width: 360, height: 640 },
  linkedin: { label: 'LinkedIn', width: 600, height: 400 },
  youtube: { label: 'YouTube', width: 640, height: 360 },
};
