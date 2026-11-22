import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';
import { Pause, Play, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isOverlayScrim } from '@/services/templates/loadIntoCanvas';
import { ensureObjectClip, writeClip } from './placeMedia';
import { primeMedia, syncMedia } from './playback';
import {
  clipEnd,
  formatTimecode,
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
  onAddElements: () => void;
  onAddMedia: () => void;
  onAddAudio: () => void;
  onExportVideo: () => void;
  exporting?: boolean;
  onTime: (time: number) => void;
};

const TRACK_LABEL: Record<string, string> = { text: 'Text', audio: 'Audio' };

const labelFor = (trackId: string) => TRACK_LABEL[trackId] ?? (trackId.startsWith('media-') ? `Video ${trackId.slice(6)}` : trackId);

export const StudioTimeline: React.FC<Props> = ({
  canvas, version, selectedId, onSelect, onChanged, onAddElements, onAddMedia, onAddAudio, onExportVideo, exporting, onTime,
}) => {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const playingRef = useRef(false);
  const timeRef = useRef(0);

  const objects = canvas?.getObjects?.() ?? [];
  const clips = useMemo(() => {
    const raw = objects
      .filter((object: any) => !isOverlayScrim(object))
      .map((object: any) => ensureObjectClip(object));
    return layoutTracks(raw);
    // version forces a fresh read after canvas edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, version, objects.length]);

  const duration = projectDuration(clips);
  const tracks = expanded
    ? [...new Set(clips.map((clip) => clip.trackId))]
    : ['mixed'];
  const px = Math.max(640, duration * 52);

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

  const seek = (clientX: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setPlaying(false);
    playingRef.current = false;
    setTime(ratio * duration);
  };

  const beginTrim = (clip: TimelineClip, edge: 'start' | 'end', event: React.PointerEvent) => {
    event.stopPropagation();
    const object = objects.find((item: any) => item.advistaId === clip.id || item.advistaClip?.id === clip.id);
    if (!object) return;
    const startX = event.clientX;
    const origin = clip;
    const move = (ev: PointerEvent) => {
      const delta = ((ev.clientX - startX) / px) * duration;
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

  const rowClips = (trackId: string) => (trackId === 'mixed' ? clips : clips.filter((clip) => clip.trackId === trackId));

  return (
    <div data-testid="studio-timeline" className="border-t border-[#3D3D3D] bg-[#161616] text-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={onAddElements} className="rounded-full bg-[#2D2D2D] px-3 py-1.5 text-[11px] font-semibold text-[#DDDDDD]">
          Add elements
        </button>
        <button type="button" onClick={onAddMedia} aria-label="Add media" className="grid h-9 w-9 place-items-center rounded-full bg-[#6E56F5] text-white">
          <Plus className="h-5 w-5" />
        </button>
        <button type="button" onClick={onAddAudio} className="rounded-full bg-[#2D2D2D] px-3 py-1.5 text-[11px] font-semibold text-[#DDDDDD]">
          Add audio
        </button>
        <button type="button" onClick={() => setExpanded((open) => !open)} className="ml-auto text-[11px] font-semibold text-[#AAAAAA]">
          {expanded ? 'Stack tracks' : 'Show tracks'}
        </button>
      </div>
      <div className="flex items-center gap-3 px-3 pb-2">
        <button type="button" onClick={() => void toggle()} aria-label={playing ? 'Pause' : 'Play'} className="grid h-8 w-8 place-items-center rounded-full bg-white text-black">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <span className="font-mono text-xs text-[#DDDDDD]">{formatTimecode(time)} / {formatTimecode(duration)}</span>
        <button type="button" data-testid="export-video" onClick={onExportVideo} disabled={exporting} className="ml-auto rounded-full bg-[#2D2D2D] px-3 py-1 text-[11px] font-semibold disabled:opacity-50">
          {exporting ? 'Exporting…' : 'Export video'}
        </button>
      </div>
      <div className="max-h-[220px] overflow-auto px-3 pb-3">
        <div className="relative" style={{ width: px }}>
          <button
            type="button"
            aria-label="Timeline ruler"
            className="relative mb-1 h-6 w-full rounded bg-[#222]"
            onPointerDown={(event) => {
              const target = event.currentTarget;
              seek(event.clientX, target);
              const move = (ev: PointerEvent) => seek(ev.clientX, target);
              const up = () => {
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
              };
              window.addEventListener('pointermove', move);
              window.addEventListener('pointerup', up);
            }}
          >
            <span className="pointer-events-none absolute top-0 h-full w-px bg-[#FF4D4F]" style={{ left: `${(time / duration) * 100}%` }} />
          </button>
          {tracks.map((trackId) => (
            <div key={trackId} className="mb-1 flex items-center gap-2">
              {expanded && <span className="w-14 shrink-0 truncate text-[10px] text-[#888888]">{labelFor(trackId)}</span>}
              <div className="relative h-10 flex-1 rounded bg-[#242424]">
                {rowClips(trackId).map((clip) => (
                  <div
                    key={clip.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      const object = objects.find((item: any) => item.advistaClip?.id === clip.id);
                      if (object) onSelect(object);
                    }}
                    className={cn(
                      'absolute top-1 flex h-8 items-center overflow-hidden rounded-md px-2 text-[10px] font-semibold',
                      clip.kind === 'audio' ? 'bg-[#0E7C66]' : clip.kind === 'text' ? 'bg-[#6E56F5]' : 'bg-[#3A4A7A]',
                      selectedId === clip.id && 'ring-2 ring-white',
                    )}
                    style={{ left: `${(clip.start / duration) * 100}%`, width: `${Math.max(1.5, (clip.duration / duration) * 100)}%` }}
                  >
                    <span
                      aria-label={`Trim start ${clip.id}`}
                      className="absolute inset-y-0 left-0 w-2 cursor-ew-resize bg-white/40"
                      onPointerDown={(event) => beginTrim(clip, 'start', event)}
                    />
                    <span className="truncate pl-2">{labelForClip(objects, clip)}</span>
                    <span
                      aria-label={`Trim end ${clip.id}`}
                      className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-white/40"
                      onPointerDown={(event) => beginTrim(clip, 'end', event)}
                    />
                  </div>
                ))}
                <span className="pointer-events-none absolute top-0 h-full w-px bg-[#FF4D4F]" style={{ left: `${(time / duration) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function labelForClip(objects: Array<{ advistaClip?: { id?: string }; advistaName?: string }>, clip: { id: string; kind: string }) {
  const object = objects.find((item) => item.advistaClip?.id === clip.id);
  const name = typeof object?.advistaName === 'string' ? object.advistaName.trim() : '';
  return name || clip.kind;
}
