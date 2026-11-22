import { describe, expect, it } from 'vitest';
import {
  animationFactor,
  audibleVolume,
  clipVisible,
  defaultClip,
  formatTimecode,
  layoutTracks,
  mediaLocalTime,
  projectDuration,
  splitClip,
  trimClip,
} from './videoTimeline';

const video = (id: string, start: number, duration: number) =>
  defaultClip({ id, kind: 'video', start, duration, sourceDuration: 30, trackId: 'media-1' });

describe('timeline split and trim', () => {
  it('splits a clip at the playhead and keeps the source in point on the right half', () => {
    const clip = video('a', 1, 8);
    const parts = splitClip(clip, 4, 'b');
    expect(parts).not.toBeNull();
    const [left, right] = parts!;
    expect(left.duration).toBe(3);
    expect(right.start).toBe(4);
    expect(right.duration).toBe(5);
    expect(right.trimIn).toBe(3);
    expect(left.id).toBe('a');
    expect(right.id).toBe('b');
  });

  it('refuses a split that would leave a sliver', () => {
    expect(splitClip(video('a', 0, 5), 0.05, 'b')).toBeNull();
    expect(splitClip(video('a', 0, 5), 4.9, 'b')).toBeNull();
    expect(splitClip(video('a', 0, 5), 8, 'b')).toBeNull();
  });

  it('trims the in and out points without stretching past the source', () => {
    const clip = video('a', 2, 6);
    const trimmedIn = trimClip(clip, 'start', 3.5);
    expect(trimmedIn.start).toBe(3.5);
    expect(trimmedIn.duration).toBe(4.5);
    expect(trimmedIn.trimIn).toBe(1.5);

    const trimmedOut = trimClip({ ...clip, sourceDuration: 7, trimIn: 2 }, 'end', 20);
    expect(trimmedOut.start).toBe(2);
    expect(trimmedOut.duration).toBe(5);
  });
});

describe('timeline playback window', () => {
  it('shows only clips under the playhead and seeks inside the trimmed source', () => {
    const clip = video('a', 2, 4);
    expect(clipVisible(clip, 1.9)).toBe(false);
    expect(clipVisible(clip, 2)).toBe(true);
    expect(clipVisible(clip, 5.9)).toBe(true);
    expect(clipVisible(clip, 6)).toBe(false);
    expect(mediaLocalTime({ ...clip, trimIn: 1.5 }, 3)).toBe(2.5);
  });

  it('stacks overlapping videos onto separate tracks and keeps text and audio on their own', () => {
    const laid = layoutTracks([
      video('v1', 0, 5),
      video('v2', 1, 5),
      video('v3', 2, 5),
      defaultClip({ id: 't', kind: 'text', start: 0, duration: 10 }),
      defaultClip({ id: 's', kind: 'audio', start: 0, duration: 8, sourceDuration: 8 }),
    ]);
    const track = (id: string) => laid.find((clip) => clip.id === id)?.trackId;
    expect(track('v1')).toBe('media-1');
    expect(track('v2')).toBe('media-2');
    expect(track('v3')).toBe('media-3');
    expect(track('t')).toBe('text');
    expect(track('s')).toBe('audio');
    expect(projectDuration(laid)).toBe(10);
    expect(formatTimecode(0)).toBe('0:00');
    expect(formatTimecode(65)).toBe('1:05');
  });

  it('ramps volume and entrance opacity from the clip settings', () => {
    const clip = defaultClip({ id: 'a', kind: 'audio', duration: 4, fadeIn: 1, fadeOut: 1, volume: 0.5, animateIn: 'fade-in' });
    expect(audibleVolume(clip, 0)).toBe(0);
    expect(audibleVolume(clip, 1)).toBe(0.5);
    expect(audibleVolume(clip, 3.5)).toBeCloseTo(0.25);
    expect(animationFactor({ ...clip, kind: 'text', animateIn: 'fade-in' }, 0)).toBe(0);
    expect(animationFactor({ ...clip, kind: 'text', animateIn: 'fade-in' }, 0.45)).toBe(1);
  });
});
