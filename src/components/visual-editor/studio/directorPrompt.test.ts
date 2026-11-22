import { describe, expect, it } from 'vitest';
import { buildDirectorPrompt, DIRECTOR_CATEGORIES, shotPlan } from './directorPrompt';

describe('director prompt', () => {
  it('covers every category the studio offers', () => {
    expect(DIRECTOR_CATEGORIES).toEqual([
      'fashion/sneakers', 'beauty/perfume', 'food & drink', 'real estate',
      'tech/gadgets', 'automotive', 'fitness', 'events', 'generic',
    ]);
  });

  it('writes a video brief with preservation, timed shots, and the negative list', () => {
    const text = buildDirectorPrompt({
      mode: 'video', category: 'fashion/sneakers', prompt: 'white runner', duration: 8, aspect: '9:16',
    });
    expect(text).toContain('Exact preservation');
    expect(text).toContain('logo');
    expect(text).toContain('white runner');
    expect(text).toContain('no colour shifts');
    expect(text).toContain('no extra products');
    expect(text).toContain('no warped or garbled text');
    expect(text).toContain('no extra limbs');
    expect(text).toContain('macro glide');
    expect(text).toContain('crane pull-back');
    expect(text).toContain('9:16');
    const shots = shotPlan(8);
    expect(shots.length).toBeGreaterThanOrEqual(3);
    expect(shots.length).toBeLessThanOrEqual(5);
    expect(shots[0].start).toBe(0);
    expect(shots[shots.length - 1].end).toBe(8);
  });

  it('writes an image brief with composition, lighting, and preservation', () => {
    const text = buildDirectorPrompt({
      mode: 'image', category: 'beauty/perfume', prompt: 'glass bottle', aspect: '1:1',
    });
    expect(text).toContain('Composition');
    expect(text).toContain('Lighting');
    expect(text).toContain('Exact preservation');
    expect(text).toContain('Negative');
    expect(text).not.toContain('Shots:');
  });
});
