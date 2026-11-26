import { describe, expect, it } from 'vitest';
import {
  MAX_SCENES, MIN_SCENES, addScene, arcFor, canAddScene, canRemoveScene, deriveProduct, fallbackPlan, findOffer, formatClock,
  moveScene, planChips, removeScene, sceneStarts, totalSeconds, updateScene, variationsOf, type PlanInput,
} from './plan';
import { ADVISTA_STYLES, linkStyleDraft, nameForLink, parseAdLink, styleById } from './styles';
import { AD_FORMATS, formatById, nearestLength, sceneCountForLength, sizeFor } from './formats';
import { blankSession, canSend, recentLabel, recentSessions } from './sessions';
import { parseStyleAnswer } from './analyzeLink';
import { checkFile } from './uploads';

const input = (patch: Partial<PlanInput> = {}): PlanInput => ({
  prompt: 'Make a 15s reel for Summer Sneaker Drop with 20% off, lightweight and breathable',
  formatId: 'story',
  ratio: '9:16',
  length: 15,
  style: null,
  imageUrls: [],
  ...patch,
});

describe('reading the description', () => {
  it('finds the product and offer', () => {
    expect(deriveProduct('Make a reel for Summer Sneaker Drop with 20% off')).toBe('Summer Sneaker Drop');
    expect(findOffer('Save 30% this week')).toBe('30% off');
    expect(findOffer('Free shipping on everything')).toBe('Free shipping');
    expect(findOffer('A calm brand film')).toBeNull();
  });

  it('falls back to the brand name, then a neutral label', () => {
    expect(deriveProduct('', 'Acme')).toBe('Acme');
    expect(deriveProduct('')).toBe('Your product');
  });
});

describe('plan', () => {
  it('builds a labelled fallback that fits the length and format', () => {
    const plan = fallbackPlan(input());
    expect(plan.source).toBe('template');
    expect(plan.note).toMatch(/fallback/i);
    expect(plan.scenes).toHaveLength(5);
    expect(plan.scenes[0].type).toBe('Hook');
    expect(plan.scenes.at(-1)?.type).toBe('Call to action');
    expect(totalSeconds(plan.scenes)).toBe(15);
    expect(planChips(plan)).toEqual(['15s', '9:16', '5 scenes']);
  });

  it('keeps the offer in the copy', () => {
    const plan = fallbackPlan(input());
    expect(plan.scenes[0].text).toContain('20% off');
  });

  it('uses the style scene order and attached pictures', () => {
    const style = styleById('before-after')!;
    const plan = fallbackPlan(input({ style, imageUrls: ['https://x/a.jpg', 'https://x/b.jpg'] }));
    expect(plan.scenes.map((scene) => scene.type)).toEqual(arcFor(style, 5));
    expect(plan.scenes[1].type).toBe('Before');
    expect(plan.scenes[0].imageUrl).toBe('https://x/a.jpg');
    expect(plan.scenes[1].imageUrl).toBe('https://x/b.jpg');
  });

  it('keeps scene count between 3 and 6', () => {
    expect(arcFor(null, 1)).toHaveLength(MIN_SCENES);
    expect(arcFor(null, 99)).toHaveLength(MAX_SCENES);
    let plan = fallbackPlan(input({ length: 5 }));
    expect(plan.scenes).toHaveLength(3);
    expect(canRemoveScene(plan)).toBe(false);
    expect(removeScene(plan, plan.scenes[1].id)).toBe(plan);
    while (canAddScene(plan)) plan = addScene(plan, 'Shoe');
    expect(plan.scenes).toHaveLength(MAX_SCENES);
    expect(addScene(plan)).toBe(plan);
    expect(plan.scenes.at(-1)?.type).toBe('Call to action');
  });

  it('keeps the overall length when scenes change, and updates start times', () => {
    let plan = fallbackPlan(input());
    plan = addScene(plan);
    expect(totalSeconds(plan.scenes)).toBe(15);
    plan = removeScene(plan, plan.scenes[1].id);
    expect(totalSeconds(plan.scenes)).toBe(15);
    const starts = sceneStarts(plan.scenes);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBe(plan.scenes[0].duration);
  });

  it('reorders scenes and marks the plan edited', () => {
    const plan = fallbackPlan(input());
    const moved = moveScene(plan, 3, 1);
    expect(moved.scenes[1].id).toBe(plan.scenes[3].id);
    expect(moved.edited).toBe(true);
    expect(moveScene(plan, 0, 99)).toBe(plan);
    expect(plan.edited).toBe(false);
  });

  it('limits a scene length to 1-15 seconds', () => {
    const plan = fallbackPlan(input());
    expect(updateScene(plan, plan.scenes[0].id, { duration: 99 }).scenes[0].duration).toBe(15);
    expect(updateScene(plan, plan.scenes[0].id, { duration: 0 }).scenes[0].duration).toBe(1);
  });

  it('makes variations with a different hook and call to action', () => {
    const plan = fallbackPlan(input());
    const versions = variationsOf(plan, 'Summer Sneaker Drop', '20% off', 3);
    expect(versions).toHaveLength(3);
    for (const version of versions) {
      expect(version.plan.scenes[0].text).not.toBe(plan.scenes[0].text);
      expect(version.plan.scenes.at(-1)?.text).not.toBe(plan.scenes.at(-1)?.text);
    }
    expect(new Set(versions.map((version) => version.plan.scenes[0].text)).size).toBe(3);
  });

  it('formats the clock', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
  });
});

describe('formats', () => {
  it('has the five formats with their sizes', () => {
    expect(AD_FORMATS.map((format) => format.id)).toEqual(['feed', 'story', 'video', 'carousel', 'banner']);
    expect(formatById('feed').sizes[0].ratio).toBe('4:5');
    expect(formatById('video').sizes.map((size) => size.ratio)).toEqual(['9:16', '1:1']);
    expect(formatById('banner').sizes[0].ratio).toBe('16:9');
    expect(sizeFor(formatById('video'), '1:1').preset).toBe('instagramSquare');
    expect(sizeFor(formatById('video'), 'nope').ratio).toBe('9:16');
  });

  it('maps length to scenes and nearest option', () => {
    expect([5, 10, 15].map(sceneCountForLength)).toEqual([3, 4, 5]);
    expect([4, 8, 14, 30].map(nearestLength)).toEqual([5, 10, 15, 15]);
  });
});

describe('styles', () => {
  it('has the six AdVista styles', () => {
    expect(ADVISTA_STYLES.map((style) => style.name)).toEqual(['UGC', 'Product showcase', 'Before and after', 'Sale or promo', 'Testimonial', 'Minimal luxury']);
  });

  it('accepts only Instagram and TikTok links', () => {
    expect(parseAdLink('https://www.instagram.com/reel/abc/')).toMatchObject({ ok: true, host: 'instagram' });
    expect(parseAdLink('vm.tiktok.com/xyz')).toMatchObject({ ok: true, host: 'tiktok' });
    expect(parseAdLink('https://youtube.com/watch?v=1')).toMatchObject({ ok: false });
    expect(parseAdLink('https://evil.com/?u=instagram.com')).toMatchObject({ ok: false });
    expect(parseAdLink('')).toMatchObject({ ok: false });
    expect(parseAdLink('not a link')).toMatchObject({ ok: false });
  });

  it('saves a link style without inventing analysis', () => {
    const link = { url: 'https://www.instagram.com/reel/abc/', host: 'instagram' as const };
    expect(nameForLink(link, 2)).toBe('Instagram style 3');
    const draft = linkStyleDraft(link, 'Mine', { status: 'needs_ai_key', note: 'Needs AI key, add in settings' });
    expect(draft.analysis?.note).toBe('Needs AI key, add in settings');
    expect(draft.textStyle).toBe('');
    expect(draft.direction).toBe('');
  });

  it('reads a style answer and rejects junk', () => {
    const patch = parseStyleAnswer('```json\n{"pacing":"fast","textStyle":"Big captions","sceneOrder":["Offer","Product","Hook","Nope"],"direction":"Quick cuts"}\n```');
    expect(patch).toMatchObject({ pacing: 'fast', textStyle: 'Big captions', middle: ['Offer', 'Product'] });
    expect(parseStyleAnswer('sorry, no')).toBeNull();
  });
});

describe('sessions', () => {
  it('enables send only with text or a file', () => {
    expect(canSend('   ', [])).toBe(false);
    expect(canSend('A shoe ad', [])).toBe(true);
    expect(canSend('', [{ id: '1', kind: 'image', name: 'a.png', url: 'x' }])).toBe(true);
  });

  it('labels only plan, building and ready sessions on the Recent strip', () => {
    const make = (status: any, updatedAt: string) => blankSession({ status, updatedAt });
    expect(recentLabel(make('plan', ''))).toBe('Plan');
    expect(recentLabel(make('building', ''))).toBe('Building');
    expect(recentLabel(make('ready', ''))).toBe('Ready');
    expect(recentLabel(make('draft', ''))).toBeNull();
    expect(recentLabel(make('failed', ''))).toBeNull();
    const list = recentSessions([make('draft', '3'), make('plan', '1'), make('ready', '2')]);
    expect(list.map((item) => item.status)).toEqual(['ready', 'plan']);
  });
});

describe('uploads', () => {
  const file = (name: string, type: string, mb: number) => Object.defineProperty(new File([''], name, { type }), 'size', { value: mb * 1024 * 1024 }) as File;
  it('rejects the wrong type and files that are too large', () => {
    expect(checkFile(file('a.pdf', 'application/pdf', 1), 'image')).toBeTruthy();
    expect(checkFile(file('a.png', 'image/png', 20), 'image')).toBeTruthy();
    expect(checkFile(file('a.png', 'image/png', 2), 'image')).toBeNull();
    expect(checkFile(file('a.png', 'image/png', 2), 'video')).toBeTruthy();
  });
});
