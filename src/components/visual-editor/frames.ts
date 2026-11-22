/** Built-in frame masks and grid slots. Geometry only — the canvas applies it. */

export type FrameMask = 'square' | 'circle' | 'torn' | 'blob' | 'device' | 'arch';

export type GridSlot = { x: number; y: number; w: number; h: number };

export const FRAME_MASKS: { id: string; label: string; mask: FrameMask }[] = [
  { id: 'frame-square', label: 'Square', mask: 'square' },
  { id: 'frame-circle', label: 'Circle', mask: 'circle' },
  { id: 'frame-torn', label: 'Torn paper', mask: 'torn' },
  { id: 'frame-blob', label: 'Blob', mask: 'blob' },
  { id: 'frame-device', label: 'Device', mask: 'device' },
  { id: 'frame-arch', label: 'Arch', mask: 'arch' },
];

export function gridSlots(count: number, width = 300, height = 300, gap = 8): GridSlot[] {
  const total = Math.min(10, Math.max(2, Math.round(count)));
  const cols = total <= 3 ? total : total <= 4 ? 2 : total <= 6 ? 3 : total <= 8 ? 4 : 5;
  const rows = Math.ceil(total / cols);
  const cellW = (width - gap * (cols - 1)) / cols;
  const cellH = (height - gap * (rows - 1)) / rows;
  return Array.from({ length: total }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: col * (cellW + gap),
      y: row * (cellH + gap),
      w: cellW,
      h: cellH,
    };
  });
}

export function gridCountFromId(id: string) {
  const count = Number(id.replace('grid-', ''));
  return count >= 2 && count <= 10 ? count : null;
}

/** Points in a 0–100 box. The canvas scales them onto the frame. */
export function maskPoints(mask: FrameMask): { x: number; y: number }[] | null {
  if (mask === 'torn') {
    const steps = 12;
    const jitter = (i: number) => ((i * 37) % 9) - 4;
    const top = Array.from({ length: steps + 1 }, (_, i) => ({ x: (i / steps) * 100, y: 6 + jitter(i) }));
    const right = [{ x: 96, y: 50 }];
    const bottom = Array.from({ length: steps + 1 }, (_, i) => ({ x: ((steps - i) / steps) * 100, y: 94 - jitter(i + 2) }));
    const left = [{ x: 4, y: 48 }];
    return [...top, ...right, ...bottom, ...left];
  }
  if (mask === 'blob') {
    return Array.from({ length: 14 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 14;
      const radius = 34 + ((i * 13) % 16);
      return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius * 0.86 };
    });
  }
  if (mask === 'arch') {
    const top = Array.from({ length: 10 }, (_, i) => {
      const angle = Math.PI + (Math.PI * i) / 9;
      return { x: 50 + Math.cos(angle) * 46, y: 52 + Math.sin(angle) * 42 };
    });
    return [...top, { x: 92, y: 96 }, { x: 8, y: 96 }];
  }
  return null;
}

export function scalePoints(points: { x: number; y: number }[], width: number, height: number) {
  return points.map((point) => ({ x: (point.x / 100) * width, y: (point.y / 100) * height }));
}
