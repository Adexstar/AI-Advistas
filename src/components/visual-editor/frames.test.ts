import { describe, expect, it } from 'vitest';
import { FRAME_MASKS, gridCountFromId, gridSlots, maskPoints } from './frames';

describe('frames and grids', () => {
  it('builds 2 to 10 slots that stay inside the layout box', () => {
    for (const count of [2, 3, 4, 6, 8, 9, 10]) {
      const slots = gridSlots(count, 300, 300, 8);
      expect(slots).toHaveLength(count);
      for (const slot of slots) {
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.y).toBeGreaterThanOrEqual(0);
        expect(slot.x + slot.w).toBeLessThanOrEqual(300.01);
        expect(slot.y + slot.h).toBeLessThanOrEqual(300.01);
        expect(slot.w).toBeGreaterThan(10);
      }
    }
    expect(gridCountFromId('grid-7')).toBe(7);
    expect(gridCountFromId('grid-1')).toBeNull();
    expect(gridCountFromId('grid-11')).toBeNull();
  });

  it('gives irregular frames a closed point list and keeps device frames parametric', () => {
    expect(FRAME_MASKS.map((frame) => frame.mask)).toEqual(['square', 'circle', 'torn', 'blob', 'device', 'arch']);
    expect(maskPoints('torn')!.length).toBeGreaterThan(8);
    expect(maskPoints('blob')!.every((point) => point.x >= 0 && point.x <= 100)).toBe(true);
    expect(maskPoints('device')).toBeNull();
    expect(maskPoints('square')).toBeNull();
  });
});
