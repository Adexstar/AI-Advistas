/** Pure timeline math for the studio. The canvas stores the same clip on each object. */

export const MIN_CLIP = 0.2;

export type ClipKind = 'video' | 'image' | 'text' | 'audio' | 'shape';

export type TimelineClip = {
  id: string;
  trackId: string;
  start: number;
  duration: number;
  trimIn: number;
  sourceDuration: number;
  kind: ClipKind;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  animateIn: string;
  animateOut: string;
};

const round = (value: number) => Math.round(value * 100) / 100;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clipEnd = (clip: TimelineClip) => clip.start + clip.duration;

export const overlaps = (a: TimelineClip, b: TimelineClip) =>
  a.start < clipEnd(b) - 0.001 && clipEnd(a) > b.start + 0.001;

export function clipVisible(clip: TimelineClip, time: number) {
  return time >= clip.start - 0.001 && time < clipEnd(clip) - 0.001;
}

export function mediaLocalTime(clip: TimelineClip, time: number) {
  const local = clip.trimIn + Math.max(0, time - clip.start);
  const max = Math.max(clip.trimIn, (clip.sourceDuration || local) - 0.04);
  return clamp(local, clip.trimIn, max);
}

export function projectDuration(clips: TimelineClip[], minimum = 10) {
  const ends = clips.map(clipEnd);
  return round(Math.max(minimum, ...ends, 0));
}

export function formatTimecode(seconds: number) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function defaultClip(partial: Partial<TimelineClip> & Pick<TimelineClip, 'id' | 'kind'>): TimelineClip {
  const still = partial.kind === 'image' || partial.kind === 'text' || partial.kind === 'shape';
  return {
    trackId: partial.kind === 'audio' ? 'audio' : partial.kind === 'text' ? 'text' : 'media-1',
    start: 0,
    duration: still ? 10 : 5,
    trimIn: 0,
    sourceDuration: still ? 600 : 10,
    volume: 1,
    fadeIn: 0,
    fadeOut: 0,
    animateIn: 'none',
    animateOut: 'none',
    ...partial,
  };
}

export function splitClip(clip: TimelineClip, at: number, newId: string): [TimelineClip, TimelineClip] | null {
  const local = at - clip.start;
  if (local < MIN_CLIP || clip.duration - local < MIN_CLIP) return null;
  const left: TimelineClip = { ...clip, duration: round(local) };
  const right: TimelineClip = {
    ...clip,
    id: newId,
    start: round(clip.start + local),
    duration: round(clip.duration - local),
    trimIn: round(clip.trimIn + local),
  };
  return [left, right];
}

export function trimClip(clip: TimelineClip, edge: 'start' | 'end', time: number): TimelineClip {
  if (edge === 'start') {
    const start = clamp(time, 0, clipEnd(clip) - MIN_CLIP);
    const delta = start - clip.start;
    const trimIn = clamp(clip.trimIn + delta, 0, Math.max(0, clip.sourceDuration - MIN_CLIP));
    return { ...clip, start: round(start), duration: round(clipEnd(clip) - start), trimIn: round(trimIn) };
  }
  const mediaCap = clip.sourceDuration > 0 ? clip.start + Math.max(MIN_CLIP, clip.sourceDuration - clip.trimIn) : time;
  const end = clamp(time, clip.start + MIN_CLIP, mediaCap);
  return { ...clip, duration: round(end - clip.start) };
}

/** Stack overlapping pictures and video onto separate media lanes. Text and audio stay on their own lanes. */
export function layoutTracks(clips: TimelineClip[]): TimelineClip[] {
  const lanes: TimelineClip[][] = [];
  return [...clips]
    .sort((a, b) => a.start - b.start || a.id.localeCompare(b.id))
    .map((clip) => {
      if (clip.kind === 'audio') return { ...clip, trackId: 'audio' };
      if (clip.kind === 'text') return { ...clip, trackId: 'text' };
      let lane = lanes.findIndex((row) => row.every((other) => !overlaps(other, clip)));
      if (lane < 0) {
        lane = lanes.length;
        lanes.push([]);
      }
      const next = { ...clip, trackId: `media-${lane + 1}` };
      lanes[lane].push(next);
      return next;
    });
}

export function audibleVolume(clip: TimelineClip, localTime: number) {
  let volume = clip.volume ?? 1;
  if (clip.fadeIn > 0 && localTime < clip.fadeIn) volume *= Math.max(0, localTime / clip.fadeIn);
  const remaining = clip.duration - localTime;
  if (clip.fadeOut > 0 && remaining < clip.fadeOut) volume *= Math.max(0, remaining / clip.fadeOut);
  return clamp(volume, 0, 1);
}

export function animationFactor(clip: TimelineClip, localTime: number) {
  const enter = clip.animateIn;
  const exit = clip.animateOut;
  let factor = 1;
  if (enter === 'fade-in' || enter === 'rise' || enter === 'pop') {
    factor *= Math.min(1, localTime / (enter === 'pop' ? 0.2 : 0.45));
  }
  if (exit === 'fade-out') factor *= Math.min(1, Math.max(0, clip.duration - localTime) / 0.45);
  return clamp(factor, 0, 1);
}

export function kindFromObject(object: { type?: string; advistaKind?: string } | null | undefined): ClipKind {
  const marked = object?.advistaKind;
  if (marked === 'video' || marked === 'image' || marked === 'text' || marked === 'audio' || marked === 'shape') return marked;
  const type = String(object?.type ?? '').toLowerCase();
  if (type === 'textbox' || type === 'text' || type === 'i-text') return 'text';
  if (type === 'image') return 'image';
  return 'shape';
}
