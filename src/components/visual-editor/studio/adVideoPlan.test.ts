import { describe, expect, it } from 'vitest';
import {
  addShot, applyPreset, estimateCredits, fitShots, moveShot, parseShotPlan, planFromModel,
  planToPrompt, removeShot, templatePlan, totalDuration, blankPlan, videoFailureMessage,
} from './adVideoPlan';

describe('ad video director plan', () => {
  it('builds a template shot list whose times add up to the chosen length', () => {
    for (const duration of [5, 10, 15] as const) {
      const plan = templatePlan(blankPlan({ duration, category: 'fashion/sneakers', productName: 'Court Runner' }));
      expect(plan.source).toBe('template');
      expect(plan.shots.length).toBeGreaterThanOrEqual(3);
      expect(plan.shots.length).toBeLessThanOrEqual(6);
      expect(totalDuration(plan.shots)).toBe(duration);
      expect(plan.shots.every((shot) => shot.from === 'template' && shot.camera && shot.action && shot.onScreenText)).toBe(true);
    }
    expect(templatePlan(blankPlan({ duration: 15 })).shots).toHaveLength(6);
    expect(templatePlan(blankPlan({ duration: 5 })).shots).toHaveLength(3);
  });

  it('keeps the total when shots are reordered, removed, or added', () => {
    const plan = templatePlan(blankPlan({ duration: 10, productName: 'Bowl' }));
    const moved = moveShot(plan.shots, 0, 1);
    expect(moved[0].id).toBe(plan.shots[1].id);
    expect(totalDuration(moved)).toBe(10);
    const shorter = removeShot(plan.shots, 1, 10);
    expect(shorter).toHaveLength(3);
    expect(totalDuration(shorter)).toBe(10);
    expect(removeShot(templatePlan(blankPlan({ duration: 5 })).shots, 0, 5)).toHaveLength(3);
    const longer = addShot({ ...plan, shots: shorter });
    expect(longer).toHaveLength(4);
    expect(totalDuration(longer)).toBe(10);
  });

  it('reads a model shot list and ignores prose', () => {
    const base = blankPlan({ duration: 10, productName: 'Court Runner', category: 'fashion/sneakers' });
    expect(parseShotPlan('not json')).toBeNull();
    const raw = JSON.stringify({
      look: 'paper sweep',
      lighting: 'soft left',
      musicMood: 'dry pulse',
      shots: [
        { camera: 'macro glide', action: 'The shoe is still.', onScreenText: 'Court Runner', transition: 'cut' },
        { camera: 'orbit', action: 'It turns.', onScreenText: 'Same last', transition: 'dissolve' },
        { camera: 'reveal', action: 'The pair.', onScreenText: 'Shop the drop', transition: 'cut' },
        { camera: 'crane pull-back', action: 'Wide.', onScreenText: 'Friday', transition: 'cut' },
      ],
    });
    const plan = planFromModel(base, `Here you go\n\`\`\`json\n${raw}\n\`\`\``);
    expect(plan?.source).toBe('model');
    expect(plan?.shots).toHaveLength(4);
    expect(totalDuration(plan!.shots)).toBe(10);
    expect(plan?.shots[0].from).toBe('model');
    expect(planToPrompt(plan!)).toContain('macro glide');
    expect(planToPrompt(plan!)).toContain('no warped or garbled text');
  });

  it('prefills a starter and prices the button', () => {
    const sneaker = applyPreset('sneaker-drop', { productImage: 'blob:kept', duration: 15, aspect: '1:1' });
    expect(sneaker.productName).toBe('Court Runner');
    expect(sneaker.productImage).toBe('blob:kept');
    expect(sneaker.duration).toBe(15);
    expect(sneaker.aspect).toBe('1:1');
    expect(sneaker.category).toBe('fashion/sneakers');
    expect(estimateCredits('one-shot', 10, 4)).toBe(3);
    expect(estimateCredits('per-shot', 10, 4)).toBe(8);
    expect(videoFailureMessage('Plan limit reached')).toBe('Plan limit reached. The shot list is saved. The on-screen lines are on the timeline.');
    expect(videoFailureMessage('Unauthorized')).toContain('RUNWARE_API_KEY');
    expect(videoFailureMessage('Add RUNWARE_API_KEY.')).not.toContain('Add RUNWARE_API_KEY. Add');
    const refit = fitShots(sneaker.shots, 15);
    expect(totalDuration(refit)).toBe(15);
  });
});
