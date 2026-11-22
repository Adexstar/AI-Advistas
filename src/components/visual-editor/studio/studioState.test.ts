import { describe, expect, it } from 'vitest';
import {
  aspectFromCanvas, creditCost, frameSize, halfSheetFields, initialDraft, pickModel, slotLimits, STUDIO_MODELS,
} from './studioState';

describe('studio panel state', () => {
  it('defaults the aspect from the canvas', () => {
    expect(aspectFromCanvas(1080, 1350)).toBe('4:5');
    expect(aspectFromCanvas(1920, 1080)).toBe('16:9');
    expect(aspectFromCanvas(1080, 1920)).toBe('9:16');
    expect(initialDraft(1080, 1080).aspect).toBe('1:1');
  });

  it('hides slots the chosen model does not support', () => {
    const runware = STUDIO_MODELS.find((model) => model.id === 'runware')!;
    const openai = STUDIO_MODELS.find((model) => model.id === 'openai')!;
    expect(slotLimits(runware, 'video')).toMatchObject({ images: 8, video: 1, audio: 1, keyframes: true });
    expect(slotLimits(openai, 'image')).toMatchObject({ images: 0, video: 0, audio: 0, keyframes: false });
    expect(slotLimits(runware, 'image').keyframes).toBe(false);
  });

  it('prefers a configured Runware model and prices the button', () => {
    expect(pickModel('video', { runware: true }).id).toBe('runware');
    expect(pickModel('image', { openai: true }).id).toBe('openai');
    expect(pickModel('video', {}).id).toBe('runware');
    expect(creditCost('image', 4)).toBe(4);
    expect(creditCost('video', 1, 5)).toBe(2);
    expect(creditCost('video', 2, 10)).toBe(6);
  });

  it('keeps the half sheet to the prompt', () => {
    expect(halfSheetFields()).toEqual(['prompt']);
    const size = frameSize('16:9', '720p');
    expect(size.width % 64).toBe(0);
    expect(size.height % 64).toBe(0);
    expect(size.width).toBeGreaterThan(size.height);
  });
});
