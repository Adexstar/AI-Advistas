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
  instagramPortrait: { label: 'Instagram Portrait Post · 1080×1350', width: 1080, height: 1350 },
  pinterest: { label: 'Pinterest Pin (2:3) · 1000×1500', width: 1000, height: 1500 },
  reels: { label: 'Instagram Reels / Mobile Video · 1080×1920', width: 1080, height: 1920 },
  tiktok: { label: 'TikTok Video · 1080×1920', width: 1080, height: 1920 },
  instagramSquare: { label: 'Instagram Square · 1080×1080', width: 1080, height: 1080 },
  facebook: { label: 'Facebook Post · 1200×1200', width: 1200, height: 1200 },
  linkedin: { label: 'LinkedIn Landscape · 1200×628', width: 1200, height: 628 },
  youtube: { label: 'YouTube / Desktop · 1920×1080', width: 1920, height: 1080 },
};
