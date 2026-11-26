import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';
import {
  Pause, Play, Plus, LayoutGrid, Music, Maximize2, HelpCircle, Grid3X3, PanelTop,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isOverlayScrim } from '@/services/templates/loadIntoCanvas';
import { ensureObjectClip, writeClip } from './placeMedia';
import { primeMedia, syncMedia } from './playback';
import {
  clipEnd,
  formatTimecode,
  isElementKind,
  layoutTracks,
  projectDuration,
  trimClip,
  type TimelineClip,
} from './videoTimeline';

type Props = {
  canvas: FabricCanvas | null;
  version: number;
  selectedId?: string | null;
  onSelect: (object: any) => void;
  onChanged: () => void;
  /** Opens the Elements panel. */
  onAddElements: () => void;
  /** Opens the Uploads panel. */
  onOpenUploads: () => void;
  /** Opens the file picker (used by the + on a populated media track). */
  onAddMedia: () => void;
  /** Opens the audio list. */
  onAddAudio: () => void;
  /** Files dropped on the media track. */
  onDropMedia: (files: File[]) => void;
  onExportVideo: () => void;
  exporting?: boolean;
  onTime: (time: number) => void;
  pageLabel?: string;
  onTogglePages?: () => void;
  onToggleGrid?: () => void;
  onFullscreen?: () => void;
  onHelp?: () => void;
};

const MIN_SPAN = 10;
const TICK_STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60];
/** Zoom 100% fits the whole project into the timeline width; larger values zoom in and scroll. */
const MAX_ZOOM = 400;

const formatTick = (second: number, step: number) => {
  if (second === 0) return '0s';
  return step < 5 ? `${second.toFixed(1)}s` : `${Math.round(second)}s`;
};

export const StudioTimeline: React.FC<Props> = ({
  canvas, version, selectedId, onSelect, onChanged, onAddElements, onOpenUploads, onAddMedia, onAddAudio,
  onDropMedia, onExportVideo, exporting, onTime, pageLabel = 'Pages', onTogglePages, onToggleGrid, onFullscreen, onHelp,
}) => {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(100);
  const [dropping, setDropping] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  /** While dragging an element: the row it would land on ('new' = a fresh row above all others). */
  const [dragTarget, setDragTarget] = useState<number | 'new' | null>(null);
  const [viewWidth, setViewWidth] = useState(800);
  const playingRef = useRef(false);
  const timeRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const objects = canvas?.getObjects?.() ?? [];
  const clips = useMemo(() => {
    const raw = objects
      .filter((object: any) => !isOverlayScrim(object))
      .map((object: any) => ensureObjectClip(object));
    return layoutTracks(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, version, objects.length]);

  const duration = Math.max(5, projectDuration(clips, 5));

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;
    // Subtract the scroller's horizontal padding (px-2 = 8px each side) so the ruler never overflows.
    const measure = () => setViewWidth(Math.max(240, element.clientWidth - 16));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Fit: the ruler spans the project (at least 10s) so everything is visible at once on any screen width.
  const span = Math.max(MIN_SPAN, Math.ceil(duration));
  const fitPxPerSec = viewWidth / span;
  const pxPerSec = fitPxPerSec * (timelineZoom / 100);
  const px = span * pxPerSec;

  const elementClips = clips.filter((clip) => isElementKind(clip.kind));
  // One row per occupied lane, newest (top layer) first like the design mockup.
  const elementRows = useMemo(
    () => Array.from(new Set(elementClips.map((clip) => clip.lane ?? 0))).sort((a, b) => b - a),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clips],
  );
  const mediaClips = clips.filter((clip) => clip.kind === 'video' || clip.kind === 'image');
  const audioClips = clips.filter((clip) => clip.kind === 'audio');

  const step = TICK_STEPS.find((candidate) => candidate * pxPerSec >= 56) ?? 60;
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let s = 0; s <= span + 1e-6; s += step) out.push(Math.round(s * 100) / 100);
    return out;
  }, [span, step]);

  // Lock in each element's row so later z-order changes or deletions never reshuffle the rows.
  useEffect(() => {
    clips.forEach((clip) => {
      if (!isElementKind(clip.kind)) return;
      const object = (canvas?.getObjects?.() ?? []).find((item: any) => item.advistaClip?.id === clip.id) as any;
      if (object && object.advistaClip && !Number.isInteger(object.advistaClip.lane)) {
        writeClip(object, { ...object.advistaClip, lane: clip.lane });
      }
    });
  }, [clips, canvas]);

  useEffect(() => { onTime(time); timeRef.current = time; }, [time, onTime]);

  useEffect(() => {
    syncMedia(canvas, time, playing);
  }, [canvas, time, playing, version]);

  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = timeRef.current + (now - last) / 1000;
      last = now;
      if (next >= duration) {
        playingRef.current = false;
        setPlaying(false);
        setTime(duration);
        return;
      }
      setTime(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration]);

  const toggle = async () => {
    if (playing) {
      playingRef.current = false;
      setPlaying(false);
      return;
    }
    if (time >= duration - 0.05) setTime(0);
    await primeMedia(canvas);
    playingRef.current = true;
    setPlaying(true);
  };

  const timeAt = (clientX: number) => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.min(span, Math.max(0, (clientX - rect.left) / pxPerSec));
  };

  /** Jump to the pointer, then follow it until release. Works on an empty project too. */
  const beginScrub = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    playingRef.current = false;
    setPlaying(false);
    setScrubbing(true);
    setTime(timeAt(event.clientX));
    const move = (ev: PointerEvent) => setTime(timeAt(ev.clientX));
    const up = () => {
      setScrubbing(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const beginTrim = (clip: TimelineClip, edge: 'start' | 'end', event: React.PointerEvent) => {
    event.stopPropagation();
    const object = objects.find((item: any) => item.advistaId === clip.id || item.advistaClip?.id === clip.id);
    if (!object) return;
    const startX = event.clientX;
    const origin = clip;
    const move = (ev: PointerEvent) => {
      const delta = (ev.clientX - startX) / pxPerSec;
      const next = trimClip(origin, edge, edge === 'start' ? origin.start + delta : clipEnd(origin) + delta);
      writeClip(object, next);
      onChanged();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /** Which element row is under the pointer; 'new' when it is above every row. */
  const laneAtPoint = (clientY: number): number | 'new' | null => {
    const rows = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[data-element-lane]') ?? []);
    if (!rows.length) return null;
    if (clientY < rows[0].getBoundingClientRect().top - 2) return 'new';
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY >= rect.top - 2 && clientY <= rect.bottom + 2) return Number(row.dataset.elementLane);
    }
    return null;
  };

  /** Drag a clip sideways to retime it; drag an element up or down to put it on another row. */
  const beginMove = (clip: TimelineClip, event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const object = objects.find((item: any) => item.advistaClip?.id === clip.id);
    if (!object) return;
    event.stopPropagation();
    onSelect(object);
    const element = isElementKind(clip.kind);
    const origin = clip;
    const startX = event.clientX;
    const startY = event.clientY;
    const topLane = elementRows[0] ?? 0;
    const latestStart = Math.max(0, span - origin.duration);
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientX - startX) < 3 && Math.abs(ev.clientY - startY) < 3) return;
      moved = true;
      const start = Math.min(latestStart, Math.max(0, Math.round((origin.start + (ev.clientX - startX) / pxPerSec) * 100) / 100));
      let lane = origin.lane;
      if (element) {
        const target = laneAtPoint(ev.clientY);
        if (target === 'new') lane = topLane + 1;
        else if (target !== null) lane = target;
        setDragTarget(target);
      }
      writeClip(object, { ...origin, start, lane });
      onChanged();
    };
    const up = () => {
      setDragTarget(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDropping(false);
    const files = Array.from(event.dataTransfer.files || []);
    if (files.length) onDropMedia(files);
  };

  const renderClip = (clip: TimelineClip, tall = false) => (
    <div
      key={clip.id}
      role="button"
      tabIndex={0}
      onPointerDown={(event) => beginMove(clip, event)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        const object = objects.find((item: any) => item.advistaClip?.id === clip.id);
        if (object) onSelect(object);
      }}
      className={cn(
        'absolute top-1 flex cursor-grab touch-none items-center overflow-hidden rounded px-1.5 text-[10px] font-semibold leading-none text-white active:cursor-grabbing',
        tall ? 'h-8' : 'h-5',
        clip.kind === 'audio' ? 'bg-[#0E7C66]' : clip.kind === 'text' ? 'bg-[#0B7A82]' : clip.kind === 'shape' ? 'bg-[#6E56F5]' : 'bg-[#3A4A7A]',
        selectedId === clip.id && 'ring-2 ring-white/80',
      )}
      style={{ left: clip.start * pxPerSec, width: Math.max(14, clip.duration * pxPerSec) }}
    >
      <span
        aria-label={`Trim start ${clip.id}`}
        className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-white/35"
        onPointerDown={(event) => beginTrim(clip, 'start', event)}
      />
      <span className="truncate pl-1.5">{labelForClip(objects, clip)}</span>
      <span
        aria-label={`Trim end ${clip.id}`}
        className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-white/35"
        onPointerDown={(event) => beginTrim(clip, 'end', event)}
      />
    </div>
  );

  const placeholderClass = 'flex w-full items-center gap-2 rounded-lg bg-[#1c1d21] px-2.5 text-left text-[11px] font-medium text-white/70 transition hover:bg-[#232429] hover:text-white';
  const playheadX = Math.min(time, span) * pxPerSec;

  return (
    <div data-testid="studio-timeline" className="studio-timeline flex shrink-0 flex-col border-t border-[#2a2b2d] bg-[#111214] text-white">
      <div className="flex items-center justify-center gap-2.5 py-1.5">
        <span className="min-w-[2.25rem] text-right font-mono text-[11px] tabular-nums text-white">{formatTimecode(time)}</span>
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={playing ? 'Pause' : 'Play'}
          className="grid h-7 w-7 place-items-center rounded-full bg-[#2a2b2f] text-white shadow-sm transition hover:bg-[#35363b]"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white" />}
        </button>
        <span className="min-w-[2.25rem] font-mono text-[11px] tabular-nums text-white/45">{formatTimecode(duration)}</span>
      </div>

      <div ref={scrollRef} className="max-h-[40vh] overflow-auto px-2 pb-1 [scrollbar-width:thin]">
        <div ref={contentRef} className="relative" style={{ width: px }}>
          {/* Ruler: click or drag anywhere to move the playhead */}
          <div
            role="slider"
            aria-label="Timeline ruler"
            aria-valuemin={0}
            aria-valuemax={span}
            aria-valuenow={Math.round(time * 10) / 10}
            data-testid="timeline-ruler"
            className="relative mb-1 h-5 cursor-pointer select-none touch-none"
            onPointerDown={beginScrub}
          >
            {ticks.map((second) => {
              // The last label is right-aligned so it never spills past the scroller's edge.
              const atEnd = second > 0 && second >= ticks[ticks.length - 1] - 1e-6 && second * pxPerSec > px - 24;
              return (
              <React.Fragment key={second}>
                <span
                  className={`pointer-events-none absolute top-0 whitespace-nowrap text-[10px] leading-none text-white/55 ${atEnd ? '-translate-x-full' : '-translate-x-1/2'}`}
                  style={{ left: second * pxPerSec }}
                >
                  {formatTick(second, step)}
                </span>
                <span className="pointer-events-none absolute bottom-0 h-1.5 w-px bg-white/25" style={{ left: second * pxPerSec }} />
              </React.Fragment>
              );
            })}
          </div>

          {/* Elements: every element gets its own row; drop one on another row to share it */}
          <div data-testid="timeline-elements" className="relative">
            {elementClips.length === 0 ? (
              <button type="button" onClick={onAddElements} className={cn(placeholderClass, 'mb-1 h-7 text-[11px]')}>
                <LayoutGrid className="h-3 w-3 text-white/50" />
                Add elements
              </button>
            ) : (
              <>
                {dragTarget === 'new' && (
                  <div className="pointer-events-none absolute -top-1 left-0 right-0 z-20 h-0.5 rounded bg-[#8B3DFF]" aria-hidden />
                )}
                {elementRows.map((lane) => (
                  <div
                    key={lane}
                    data-element-lane={lane}
                    className={cn('relative mb-1 h-7 rounded-lg bg-[#1c1d21] transition-colors', dragTarget === lane && 'bg-[#2a2540] ring-1 ring-[#8B3DFF]')}
                  >
                    {elementClips.filter((clip) => (clip.lane ?? 0) === lane).map((clip) => renderClip(clip))}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Track 2: media — click opens Uploads, drop files here */}
          <div
            data-testid="timeline-media-track"
            className={cn('relative mb-1 rounded-lg transition', dropping && 'ring-1 ring-[#8B3DFF]')}
            onDragOver={(event) => { event.preventDefault(); setDropping(true); }}
            onDragLeave={() => setDropping(false)}
            onDrop={onDrop}
          >
            {mediaClips.length === 0 ? (
              <div
                role="button"
                tabIndex={0}
                onClick={onOpenUploads}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenUploads(); } }}
                className={cn(placeholderClass, 'h-9 cursor-pointer gap-2 text-[11px]')}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-white/10 bg-[#25262b] text-white/80">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                <span className="text-white/50">or drag and drop media</span>
              </div>
            ) : (
              <div className="relative h-10 rounded-lg bg-[#1c1d21]">
                {mediaClips.map((clip) => renderClip(clip, true))}
                <button
                  type="button"
                  onClick={onAddMedia}
                  aria-label="Add media"
                  className="absolute right-1 top-1/2 z-10 grid h-5 w-5 -translate-y-1/2 place-items-center rounded bg-black/50 text-white/80 hover:bg-black/70"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Track 3: audio */}
          <div className="relative">
            {audioClips.length === 0 ? (
              <button type="button" onClick={onAddAudio} className={cn(placeholderClass, 'h-7 text-[11px]')}>
                <Music className="h-3 w-3 text-white/50" />
                Add audio
              </button>
            ) : (
              <div className="relative h-7 rounded-lg bg-[#1c1d21]">
                {audioClips.map((clip) => renderClip(clip))}
              </div>
            )}
          </div>

          {/* Playhead: one handle, one line through every track */}
          <div className="pointer-events-none absolute inset-y-0 z-30" style={{ left: playheadX }} data-testid="timeline-playhead">
            {scrubbing && (
              <span className="absolute left-1/2 top-[-1.25rem] -translate-x-1/2 whitespace-nowrap rounded bg-white px-1 py-px text-[10px] font-semibold tabular-nums text-black shadow">
                {time.toFixed(1)}s
              </span>
            )}
            <span
              role="presentation"
              aria-label="Playhead handle"
              data-testid="playhead-handle"
              onPointerDown={beginScrub}
              className="pointer-events-auto absolute left-1/2 top-0 grid h-3.5 w-3.5 -translate-x-1/2 cursor-ew-resize touch-none place-items-center"
            >
              <span className="h-2.5 w-2.5 rounded-[2px] rounded-b-full bg-white shadow" />
            </span>
            <span className="absolute left-1/2 top-3.5 bottom-0 w-px -translate-x-1/2 bg-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 border-t border-[#2a2b2d] px-2 py-1 text-[11px] text-white/55">
        <label className="flex items-center gap-1.5">
          <PanelTop className="h-3 w-3 text-white/35" aria-hidden />
          <span className="sr-only">Timeline zoom</span>
          <input
            aria-label="Timeline zoom"
            type="range"
            min={100}
            max={MAX_ZOOM}
            value={timelineZoom}
            onChange={(event) => setTimelineZoom(Number(event.target.value))}
            className="w-16 accent-white"
          />
        </label>
        <span className="w-9 tabular-nums text-white/70">{timelineZoom}%</span>
        <button
          type="button"
          onClick={onTogglePages}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1c1d21] px-2.5 py-1 text-white/70 hover:bg-[#25262b] hover:text-white"
        >
          <PanelTop className="h-3 w-3" />
          {pageLabel}
        </button>
        <span className="tabular-nums text-white/55">
          {formatTimecode(time)} / {formatTimecode(duration)}
        </span>
        <button type="button" aria-label="Toggle grid" onClick={onToggleGrid} className="grid h-6 w-6 place-items-center rounded hover:bg-white/10 hover:text-white">
          <Grid3X3 className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Fullscreen" onClick={onFullscreen} className="grid h-6 w-6 place-items-center rounded hover:bg-white/10 hover:text-white">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Help" onClick={onHelp} className="grid h-6 w-6 place-items-center rounded hover:bg-white/10 hover:text-white">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          data-testid="export-video"
          onClick={onExportVideo}
          disabled={exporting}
          className="ml-1 rounded-full bg-[#2a2b2f] px-2 py-0.5 text-[11px] font-semibold text-white/80 hover:bg-[#35363b] disabled:opacity-50"
        >
          {exporting ? 'Exporting…' : 'Export'}
        </button>
      </div>
    </div>
  );
};

function labelForClip(objects: Array<{ advistaClip?: { id?: string }; advistaName?: string }>, clip: { id: string; kind: string }) {
  const object = objects.find((item) => item.advistaClip?.id === clip.id);
  const name = typeof object?.advistaName === 'string' ? object.advistaName.trim() : '';
  return name || clip.kind;
}
