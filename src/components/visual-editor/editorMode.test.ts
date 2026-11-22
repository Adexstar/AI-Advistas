import { describe, expect, it } from 'vitest';
import { designHasVideo, resolveEditorMode, templateIsVideo, visibleTemplates } from './editorMode';

const photo = { id: 'p', name: 'Morning coffee', category: 'food', format: 'image' };
const reel = { id: 'v', name: 'Product reel', category: 'video', format: 'video', template_json: { objects: [{ type: 'image', advistaKind: 'video' }] } };
const story = { id: 's', name: 'Shop the drop', description: 'A still layout', format: 'post' };

describe('editor mode', () => {
  it('starts as a photo design until a video object exists', () => {
    expect(designHasVideo([])).toBe(false);
    expect(designHasVideo([{ type: 'textbox' }, { type: 'image' }])).toBe(false);
    expect(designHasVideo([{ type: 'image', advistaKind: 'video' }])).toBe(true);
    expect(resolveEditorMode(false, false, false).mode).toBe('photo');
  });

  it('switches to video for a video template and returns once those videos are gone', () => {
    expect(templateIsVideo(photo)).toBe(false);
    expect(templateIsVideo(reel)).toBe(true);
    expect(templateIsVideo({ name: 'TikTok offer', format: 'image' })).toBe(true);
    const opened = resolveEditorMode(false, true, false);
    expect(opened.mode).toBe('video');
    const withClip = resolveEditorMode(true, true, false);
    expect(withClip.sawVideo).toBe(true);
    expect(resolveEditorMode(false, true, true).mode).toBe('photo');
  });

  it('keeps video templates out of a photo search until the filter or the word video', () => {
    const all = [photo, reel, story];
    expect(visibleTemplates(all, '', false).map((item) => item.id)).toEqual(['p', 's']);
    expect(visibleTemplates(all, 'coffee', false).map((item) => item.id)).toEqual(['p']);
    expect(visibleTemplates(all, 'video', false).map((item) => item.id)).toEqual(['v']);
    expect(visibleTemplates(all, '', true).map((item) => item.id)).toEqual(['v']);
  });
});
