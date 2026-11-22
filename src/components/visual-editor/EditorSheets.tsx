import React, { useEffect, useRef, useState } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';
import { speechProviders } from './speechProvider';
import { ensureObjectClip, writeClip } from './placeMedia';

export const KeySlot: React.FC<{ title: string; detail: string }> = ({ title, detail }) => (
  <div className="rounded-xl border border-[#3D3D3D] bg-[#1A1A1A] p-4">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-[#CCCCCC]">{detail}</p>
  </div>
);

const clipOf = (selected: any) => selected?.advistaClip ?? (selected ? ensureObjectClip(selected) : null);

export const DurationPanel: React.FC<{ selected: any; canvas: FabricCanvas | null; onChanged: () => void }> = ({ selected, canvas, onChanged }) => {
  const clip = clipOf(selected);
  const max = Math.max(0.5, Math.min(60, (clip?.sourceDuration ?? 30) - (clip?.trimIn ?? 0)));
  return (
    <label className="block text-xs text-[#CCCCCC]">
      Seconds on the timeline ({clip ? clip.duration.toFixed(1) : '0'})
      <input
        type="range"
        min={0.4}
        max={max}
        step={0.1}
        value={clip?.duration ?? 1}
        onChange={(event) => {
          if (!clip) return;
          writeClip(selected, { ...clip, duration: Number(event.target.value) });
          canvas?.requestRenderAll();
          onChanged();
        }}
        className="mt-2 w-full accent-[#6E56F5]"
      />
    </label>
  );
};

export const VolumePanel: React.FC<{ selected: any; onChanged: () => void }> = ({ selected, onChanged }) => {
  const clip = clipOf(selected);
  return (
    <label className="block text-xs text-[#CCCCCC]">
      Volume {Math.round((clip?.volume ?? 1) * 100)}%
      <input
        type="range" min={0} max={1} step={0.05} value={clip?.volume ?? 1}
        onChange={(event) => {
          if (!clip) return;
          const volume = Number(event.target.value);
          writeClip(selected, { ...clip, volume });
          if (selected.advistaAudio) selected.advistaAudio.volume = volume;
          onChanged();
        }}
        className="mt-2 w-full accent-[#6E56F5]"
      />
    </label>
  );
};

export const FadePanel: React.FC<{ selected: any; onChanged: () => void }> = ({ selected, onChanged }) => {
  const clip = clipOf(selected);
  const set = (key: 'fadeIn' | 'fadeOut', value: number) => {
    if (!clip) return;
    writeClip(selected, { ...clip, [key]: value });
    onChanged();
  };
  return (
    <div className="space-y-3 text-xs text-[#CCCCCC]">
      <label className="block">Fade in {clip?.fadeIn ?? 0}s
        <input type="range" min={0} max={3} step={0.1} value={clip?.fadeIn ?? 0} onChange={(event) => set('fadeIn', Number(event.target.value))} className="mt-1 w-full accent-[#6E56F5]" />
      </label>
      <label className="block">Fade out {clip?.fadeOut ?? 0}s
        <input type="range" min={0} max={3} step={0.1} value={clip?.fadeOut ?? 0} onChange={(event) => set('fadeOut', Number(event.target.value))} className="mt-1 w-full accent-[#6E56F5]" />
      </label>
    </div>
  );
};

export const TrimPanel: React.FC<{ selected: any; onChanged: () => void }> = ({ selected, onChanged }) => {
  const clip = clipOf(selected);
  return (
    <div className="space-y-2 text-xs text-[#CCCCCC]">
      <p>Drag either edge of the block on the timeline. The numbers below are the in point and the length.</p>
      <label className="block">Trim in {clip?.trimIn?.toFixed(1) ?? 0}s
        <input type="range" min={0} max={Math.max(0, (clip?.sourceDuration ?? 1) - 0.4)} step={0.1} value={clip?.trimIn ?? 0}
          onChange={(event) => {
            if (!clip) return;
            const trimIn = Number(event.target.value);
            const duration = Math.max(0.4, Math.min(clip.duration, clip.sourceDuration - trimIn));
            writeClip(selected, { ...clip, trimIn, duration });
            onChanged();
          }}
          className="mt-1 w-full accent-[#6E56F5]" />
      </label>
    </div>
  );
};

const PRESETS = [
  { id: 'none', label: 'None' },
  { id: 'fade-in', label: 'Fade in' },
  { id: 'rise', label: 'Rise' },
  { id: 'pop', label: 'Pop' },
  { id: 'fade-out', label: 'Fade out' },
];

export const AnimatePresets: React.FC<{ selected: any; canvas: FabricCanvas | null; onChanged: () => void }> = ({ selected, canvas, onChanged }) => {
  const clip = clipOf(selected);
  const choose = (id: string) => {
    if (!clip) return;
    const next = id === 'fade-out'
      ? { ...clip, animateOut: 'fade-out' }
      : { ...clip, animateIn: id, animateOut: clip.animateOut };
    writeClip(selected, next);
    canvas?.requestRenderAll();
    onChanged();
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((preset) => (
        <button key={preset.id} type="button" onClick={() => choose(preset.id)}
          className={`rounded-lg border px-3 py-3 text-left text-xs font-semibold ${(clip?.animateIn === preset.id || (preset.id === 'fade-out' && clip?.animateOut === 'fade-out')) ? 'border-[#6E56F5] bg-[#6E56F5]/20 text-white' : 'border-[#3D3D3D] text-[#DDDDDD]'}`}>
          {preset.label}
        </button>
      ))}
    </div>
  );
};

export const AudioAddSheet: React.FC<{ onAdd: (url: string, name: string) => void }> = ({ onAdd }) => {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => () => {
    recorder.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  const fromFile = (file: File | undefined) => {
    if (!file) return;
    onAdd(URL.createObjectURL(file), file.name);
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        onAdd(URL.createObjectURL(blob), 'Voiceover');
      };
      rec.start();
      recorder.current = rec;
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The microphone could not be opened.');
    }
  };

  const stop = () => {
    recorder.current?.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-4 text-sm text-[#DDDDDD]">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Music and effects</h3>
        <p className="mt-1 text-xs leading-snug text-[#AAAAAA]">There is no licensed music catalog in the app. Upload a track you have the rights to use.</p>
        <label className="mt-2 flex h-10 cursor-pointer items-center justify-center rounded-lg bg-[#2D2D2D] text-xs font-semibold">
          Upload music or a sound effect
          <input type="file" accept="audio/*" className="hidden" onChange={(event) => { fromFile(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Record voiceover</h3>
        <button type="button" onClick={() => (recording ? stop() : void start())}
          className={`mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white ${recording ? 'bg-[#B42318]' : 'bg-[#E11D2E]'}`}>
          <span className="h-3 w-3 rounded-full bg-white" />
          {recording ? 'Stop and place on the timeline' : 'Record'}
        </button>
        {error && <p className="mt-2 text-xs text-[#F5D7A1]">{error}</p>}
      </section>
      <KeySlot
        title="AI Voice"
        detail={`Text to speech needs a key before it can speak. Add ${speechProviders.map((provider) => provider.secret).join(' or ')} on the server. This button does not invent audio. The provider list is ready for that key.`}
      />
    </div>
  );
};

export const ElementMenu: React.FC<{
  x: number;
  y: number;
  onAction: (id: string) => void;
  onClose: () => void;
}> = ({ x, y, onAction, onClose }) => {
  const items = [
    ['copy', 'Copy'],
    ['paste', 'Paste'],
    ['duplicate', 'Duplicate'],
    ['delete', 'Delete'],
    ['lock', 'Lock'],
    ['up', 'Layer up'],
    ['down', 'Layer down'],
    ['align', 'Align'],
    ['detach', 'Detach from frame'],
    ['style', 'Copy style'],
  ] as const;
  return (
    <div className="fixed inset-0 z-[80]" onClick={onClose} onContextMenu={(event) => { event.preventDefault(); onClose(); }}>
      <div
        role="menu"
        className="absolute w-52 overflow-hidden rounded-xl border border-[#3D3D3D] bg-[#1C1C1C] py-1 shadow-2xl"
        style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 360) }}
        onClick={(event) => event.stopPropagation()}
      >
        {items.map(([id, label]) => (
          <button key={id} type="button" role="menuitem" onClick={() => { onAction(id); onClose(); }}
            className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
