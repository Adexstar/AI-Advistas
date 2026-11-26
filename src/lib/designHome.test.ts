import { describe, expect, it } from 'vitest';
import {
  designStatusOf,
  designTypeOf,
  editorStartUrl,
  formatEditedAgo,
  readyToLaunch,
  usedInCampaign,
} from './designHome';

describe('designHome helpers', () => {
  it('reads design type from content and falls back to photo', () => {
    expect(designTypeOf({ content: { designType: 'video' }, canvas_data: null })).toBe('video');
    expect(designTypeOf({ content: {}, canvas_data: null })).toBe('photo');
    expect(designTypeOf({
      content: {},
      canvas_data: { objects: [{ advistaKind: 'video' }] },
    })).toBe('video');
  });

  it('treats published status as finished', () => {
    expect(designStatusOf({ status: 'draft', content: {} })).toBe('draft');
    expect(designStatusOf({ status: 'published', content: {} })).toBe('finished');
    expect(designStatusOf({ status: 'draft', content: { designStatus: 'finished' } })).toBe('finished');
  });

  it('builds editor start urls for presets and custom sizes', () => {
    expect(editorStartUrl({ preset: 'instagramPortrait' })).toBe('/visual-editor?preset=instagramPortrait');
    expect(editorStartUrl({ preset: 'reels', mode: 'video' })).toBe('/visual-editor?preset=reels&mode=video');
    expect(editorStartUrl({ width: 800, height: 600 })).toBe('/visual-editor?w=800&h=600&preset=custom');
    expect(editorStartUrl({ adId: 'abc' })).toBe('/visual-editor?adId=abc');
  });

  it('formats relative edit times', () => {
    const now = Date.parse('2026-11-22T12:00:00Z');
    expect(formatEditedAgo('2026-11-22T10:00:00Z', now)).toBe('Edited 2h ago');
    expect(formatEditedAgo('2026-11-22T11:45:00Z', now)).toBe('Edited 15m ago');
  });

  it('marks finished designs without a campaign as ready to launch', () => {
    expect(usedInCampaign({ campaign_id: 'c1' })).toBe(true);
    expect(usedInCampaign({ campaign_id: null })).toBe(false);
    expect(readyToLaunch({ status: 'finished', content: { designStatus: 'finished' }, campaign_id: null })).toBe(true);
    expect(readyToLaunch({ status: 'draft', content: {}, campaign_id: null })).toBe(false);
    expect(readyToLaunch({ status: 'finished', content: { designStatus: 'finished' }, campaign_id: 'c1' })).toBe(false);
  });
});
