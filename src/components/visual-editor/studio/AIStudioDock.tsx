import React, { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { readEdgeError } from '@/services/edgeError';
import { StockBrowser } from '@/components/visual-editor/StockBrowser';
import { DIRECTOR_CATEGORIES, type DirectorCategory } from './directorPrompt';
import {
  ASPECTS, INSPIRATIONS, OUTPUT_COUNTS, RESOLUTIONS, STUDIO_MODELS, VIDEO_DURATIONS,
  creditCost, frameSize, initialDraft, modelsFor, pickModel, slotLimits,
  type StudioAspect, type StudioDraft, type StudioMode, type StudioResolution,
} from './studioState';

const DRAFT_KEY = 'advista.studio.draft';

interface SlotItem { id: string; url: string; label: string }

interface ResultItem {
  id: string;
  kind: 'image' | 'video';
  url: string;
  prompt: string;
}

export const AIStudioDock: React.FC<{
  canvasWidth: number;
  canvasHeight: number;
  compact?: boolean;
  embedded?: boolean;
  selectedUrl?: string | null;
  onAddImage: (url: string) => void;
  onAddVideo: (url: string) => void;
  onClose?: () => void;
  onExpand?: () => void;
}> = ({ canvasWidth, canvasHeight, compact = false, embedded = false, selectedUrl, onAddImage, onAddVideo, onClose, onExpand }) => {
  const [draft, setDraft] = useState<StudioDraft>(() => initialDraft(canvasWidth, canvasHeight));
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [images, setImages] = useState<SlotItem[]>([]);
  const [videos, setVideos] = useState<SlotItem[]>([]);
  const [audios, setAudios] = useState<SlotItem[]>([]);
  const [firstFrame, setFirstFrame] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const [library, setLibrary] = useState<null | 'image' | 'video' | 'first' | 'last'>(null);
  const [busy, setBusy] = useState<null | 'enhance' | 'create'>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { prompt?: string; mode?: StudioMode };
      sessionStorage.removeItem(DRAFT_KEY);
      setDraft((current) => ({
        ...current,
        prompt: typeof saved.prompt === 'string' ? saved.prompt : current.prompt,
        mode: saved.mode === 'video' ? 'video' : current.mode,
      }));
    } catch { /* a bad draft should not block the panel */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.functions.invoke('provider-status', { body: { action: 'list' } }).then(({ data }) => {
      if (cancelled || !Array.isArray(data?.providers)) return;
      const next: Record<string, boolean> = {};
      for (const row of data.providers) {
        if (typeof row?.id === 'string') next[row.id] = row.configured === true;
      }
      setConfigured(next);
    });
    return () => { cancelled = true; };
  }, []);

  const models = modelsFor(draft.mode);
  const model = models.find((item) => item.id === draft.modelId) ?? pickModel(draft.mode, configured);
  const slots = slotLimits(model, draft.mode);
  const cost = creditCost(draft.mode, draft.outputs, draft.duration);
  const size = useMemo(() => frameSize(draft.aspect, draft.resolution), [draft.aspect, draft.resolution]);

  const set = <K extends keyof StudioDraft>(key: K, value: StudioDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const switchMode = (mode: StudioMode) => {
    const next = pickModel(mode, configured);
    setDraft((current) => ({ ...current, mode, modelId: modelsFor(mode).some((item) => item.id === current.modelId) ? current.modelId : next.id }));
  };

  const addSlot = (kind: 'image' | 'video' | 'audio', url: string, label: string) => {
    const limits = { image: slots.images, video: slots.video, audio: slots.audio };
    const lists = { image: setImages, video: setVideos, audio: setAudios };
    lists[kind]((current) => current.length >= limits[kind] ? current : [...current, { id: crypto.randomUUID(), url, label }]);
    setLibrary(null);
  };

  const enhance = async () => {
    setBusy('enhance');
    setError('');
    setStatus('Writing the director prompt…');
    const { data, error: invokeError } = await supabase.functions.invoke('enhance-prompt', {
      body: {
        prompt: draft.prompt,
        category: draft.category,
        mode: draft.mode,
        duration: draft.duration,
        aspect: draft.aspect,
        references: [firstFrame, ...images.map((item) => item.url)].filter((url): url is string => typeof url === 'string' && url.startsWith('http')),
      },
    });
    setBusy(null);
    setStatus('');
    if (invokeError || typeof data?.prompt !== 'string') {
      setError(await studioError(invokeError, data, 'Enhance did not return a prompt. Deploy the enhance-prompt function. It uses GROQ_API_KEY, OPENAI_API_KEY, GOOGLE_GEMINI_API_KEY, ANTHROPIC_API_KEY, or LOVABLE_API_KEY.'));
      return;
    }
    set('prompt', data.prompt);
  };

  const create = async () => {
    if (!draft.prompt.trim()) {
      setError('Write a prompt first.');
      return;
    }
    if (!model.implemented) {
      setError(`${model.label} is not connected. Add ${model.secret}. Nothing was generated.`);
      return;
    }
    if (configured[model.id] === false) {
      setError(`Add ${model.secret}.`);
      return;
    }
    setBusy('create');
    setError('');
    setStatus(draft.mode === 'video' ? 'Sending the clip to Runware…' : 'Creating…');
    const references = images.map((item) => item.url).filter((url) => url.startsWith('http'));
    try {
      if (draft.mode === 'image') {
        const { data, error: invokeError } = await supabase.functions.invoke('generate-ad-image', {
          body: { prompt: draft.prompt, product: draft.prompt, provider: model.id, width: size.width, height: size.height, count: draft.outputs, references },
        });
        if (invokeError || !data?.imageUrl) throw new Error(await studioError(invokeError, data, 'No image was returned.'));
        const urls: string[] = Array.isArray(data.images) ? data.images : [data.imageUrl];
        setResults((current) => [
          ...urls.filter((url) => typeof url === 'string').map((url) => ({ id: crypto.randomUUID(), kind: 'image' as const, url, prompt: draft.prompt })),
          ...current,
        ]);
      } else if (model.id !== 'runware') {
        const { data, error: invokeError } = await supabase.functions.invoke(`generate-${model.id}`, { body: { prompt: draft.prompt } });
        if (invokeError || !data?.videoUrl) throw new Error(await studioError(invokeError, data, `${model.label} did not return a video.`));
        setResults((current) => [{ id: crypto.randomUUID(), kind: 'video', url: data.videoUrl, prompt: draft.prompt }, ...current]);
      } else {
        const { data, error: invokeError } = await supabase.functions.invoke('generate-ad-video', {
          body: {
            prompt: draft.prompt, product: draft.prompt, width: size.width, height: size.height, duration: draft.duration,
            audio: draft.audio && slots.audio > 0, references, firstFrame, lastFrame,
          },
        });
        if (invokeError) throw new Error(await studioError(invokeError, data, 'Video was not started. Add RUNWARE_API_KEY.'));
        let payload = data;
        for (let attempt = 0; attempt < 6 && payload?.pending && payload?.taskUUID; attempt += 1) {
          setStatus('Runware is still rendering…');
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const next = await supabase.functions.invoke('generate-ad-video', { body: { taskUUID: payload.taskUUID } });
          if (next.error) throw new Error(await readEdgeError(next.error, 'The video status check failed.'));
          payload = next.data;
        }
        if (!payload?.videoUrl) throw new Error(payload?.error || 'The video is still rendering. Try again in a moment.');
        setResults((current) => [{ id: crypto.randomUUID(), kind: 'video', url: payload.videoUrl, prompt: draft.prompt }, ...current]);
      }
      setStatus('');
    } catch (failure) {
      setStatus('');
      setError(failure instanceof Error ? failure.message : 'Create failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div data-testid="ai-studio-dock" className="flex h-full min-h-0 flex-col gap-3 text-studio-text">
      {!embedded && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">AI Studio</p>
          {onClose && (
            <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-studio-muted hover:bg-white/10" aria-label="Close AI Studio">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {!compact && (
        <>
          <div className="flex gap-1 rounded-lg bg-[#1A1A1A] p-1">
            {(['image', 'video'] as StudioMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => switchMode(mode)} className={`h-8 flex-1 rounded-md text-xs font-semibold capitalize ${draft.mode === mode ? 'bg-[#6E56F5] text-white' : 'text-[#CCCCCC]'}`}>
                {mode}
              </button>
            ))}
          </div>
          <label className="block text-[11px] text-[#AAAAAA]">
            Model
            <select
              value={model.id}
              onChange={(event) => set('modelId', event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-[#555555] bg-[#2D2D2D] px-2 text-sm text-white"
            >
              {models.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}{configured[item.id] === false ? ` · needs ${item.secret}` : ''}{!item.implemented ? ' · not connected' : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-1 rounded-lg bg-[#1A1A1A] p-1">
            {(['reference', 'keyframe'] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => set('tab', tab)} className={`h-8 flex-1 rounded-md text-xs font-semibold capitalize ${draft.tab === tab ? 'bg-[#3D3D3D] text-white' : 'text-[#AAAAAA]'}`}>
                {tab}
              </button>
            ))}
          </div>
          {draft.tab === 'reference' ? (
            <div className="space-y-2">
              <SlotLine label="Images" count={images.length} max={slots.images} onUpload={(url) => addSlot('image', url, 'Upload')} onCanvas={selectedUrl ? () => addSlot('image', selectedUrl, 'Canvas') : undefined} onLibrary={() => setLibrary('image')} />
              <SlotLine label="Video" count={videos.length} max={slots.video} accept="video/*" onUpload={(url) => addSlot('video', url, 'Upload')} onCanvas={selectedUrl ? () => addSlot('video', selectedUrl, 'Canvas') : undefined} onLibrary={() => setLibrary('video')} />
              <SlotLine label="Audio" count={audios.length} max={slots.audio} accept="audio/*" onUpload={(url) => addSlot('audio', url, 'Upload')} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <FrameSlot label="First frame" url={firstFrame} enabled={slots.keyframes} onUpload={setFirstFrame} onCanvas={selectedUrl ? () => setFirstFrame(selectedUrl) : undefined} onLibrary={() => setLibrary('first')} />
              <FrameSlot label="Last frame" url={lastFrame} enabled={slots.keyframes} onUpload={setLastFrame} onCanvas={selectedUrl ? () => setLastFrame(selectedUrl) : undefined} onLibrary={() => setLibrary('last')} />
            </div>
          )}
          {library && (
            <StockBrowser
              kind={library === 'video' ? 'video' : 'image'}
              canvas={null}
              onPick={(url) => {
                if (library === 'first') setFirstFrame(url);
                else if (library === 'last') setLastFrame(url);
                else addSlot(library, url, 'Library');
                setLibrary(null);
              }}
            />
          )}
        </>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#AAAAAA]">Prompt</span>
          <div className="flex items-center gap-2">
            {!compact && (
              <select
                aria-label="Inspirations"
                value=""
                onChange={(event) => {
                  const category = event.target.value as DirectorCategory;
                  if (!category) return;
                  set('category', category);
                  set('prompt', INSPIRATIONS[category]);
                }}
                className="h-7 rounded-md border border-[#555555] bg-[#2D2D2D] px-1 text-[11px] text-white"
              >
                <option value="">Inspirations</option>
                {DIRECTOR_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            )}
            {compact && onExpand && (
              <button type="button" onClick={onExpand} className="text-[11px] font-semibold text-[#C8BEFF]">All settings</button>
            )}
            <button type="button" data-testid="studio-enhance" onClick={() => void enhance()} disabled={busy !== null} className="inline-flex h-7 items-center gap-1 rounded-md border border-[#555555] px-2 text-[11px] font-semibold text-white disabled:opacity-50">
              {busy === 'enhance' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Enhance
            </button>
          </div>
        </div>
        <textarea
          value={draft.prompt}
          onChange={(event) => set('prompt', event.target.value)}
          rows={compact ? 2 : 5}
          placeholder="Describe the shot."
          className="w-full resize-none rounded-lg border border-[#555555] bg-[#1A1A1A] p-2 text-sm text-white outline-none"
        />
        {!compact && (
          <select aria-label="Category" value={draft.category} onChange={(event) => set('category', event.target.value as DirectorCategory)} className="h-8 w-full rounded-lg border border-[#555555] bg-[#2D2D2D] px-2 text-xs text-white">
            {DIRECTOR_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        )}
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-1.5">
          {ASPECTS.map((aspect) => (
            <Chip key={aspect} active={draft.aspect === aspect} onClick={() => set('aspect', aspect as StudioAspect)}>{aspect}</Chip>
          ))}
          {RESOLUTIONS.map((resolution) => (
            <Chip key={resolution} active={draft.resolution === resolution} onClick={() => set('resolution', resolution as StudioResolution)}>{resolution}</Chip>
          ))}
          {draft.mode === 'video' && VIDEO_DURATIONS.map((duration) => (
            <Chip key={duration} active={draft.duration === duration} onClick={() => set('duration', duration)}>{duration}s</Chip>
          ))}
          {OUTPUT_COUNTS.map((count) => (
            <Chip key={count} active={draft.outputs === count} onClick={() => set('outputs', count)}>{count}×</Chip>
          ))}
          {draft.mode === 'video' && slots.audio > 0 && (
            <Chip active={draft.audio} onClick={() => set('audio', !draft.audio)}>Audio</Chip>
          )}
        </div>
      )}

      <button type="button" data-testid="studio-create" onClick={() => void create()} disabled={busy !== null} className={`h-11 rounded-xl bg-[#6E56F5] text-sm font-semibold text-white disabled:opacity-60 ${compact ? 'sticky bottom-0' : ''}`}>
        {busy === 'create' ? 'Working…' : `Create · ${cost} ${cost === 1 ? 'credit' : 'credits'}`}
      </button>
      {status && <p className="text-xs text-[#C8BEFF]">{status}</p>}
      {error && <p data-testid="studio-error" className="rounded-lg border border-[#6B3A3A] bg-[#2A1A1A] px-3 py-2 text-xs leading-snug text-[#F3C7C7]">{error}</p>}

      {results.length > 0 && (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {results.map((result) => (
            <div key={result.id} className="rounded-lg border border-[#3D3D3D] bg-[#1A1A1A] p-2">
              {result.kind === 'image' ? (
                <img src={result.url} alt="" className="mb-2 aspect-video w-full rounded-md object-cover" />
              ) : (
                <video src={result.url} className="mb-2 aspect-video w-full rounded-md" controls />
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => result.kind === 'video' ? onAddVideo(result.url) : onAddImage(result.url)} className="h-8 flex-1 rounded-md bg-[#3D3D3D] text-[11px] font-semibold text-white">
                  {result.kind === 'video' ? 'Add to timeline' : 'Add to canvas'}
                </button>
                <a href={result.url} download target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-md bg-[#3D3D3D] text-white" aria-label="Download">
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

async function studioError(invokeError: unknown, data: { error?: string } | null, fallback: string): Promise<string> {
  const fromBody = typeof data?.error === 'string' ? data.error : '';
  const fromEdge = await readEdgeError(invokeError, '');
  const raw = fromBody || fromEdge;
  if (!raw || /non-2xx|not found|failed to send/i.test(raw)) return fallback;
  if (/not configured/i.test(raw) && !/API_KEY/.test(raw)) return `${raw} The image key is OPENAI_API_KEY. The video key is RUNWARE_API_KEY.`;
  return raw;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`h-7 rounded-full px-2.5 text-[11px] font-semibold ${active ? 'bg-[#6E56F5] text-white' : 'bg-[#2D2D2D] text-[#DDDDDD]'}`}>
      {children}
    </button>
  );
}

function SlotLine({ label, count, max, accept = 'image/*', onUpload, onCanvas, onLibrary }: {
  label: string; count: number; max: number; accept?: string;
  onUpload: (url: string) => void; onCanvas?: () => void; onLibrary?: () => void;
}) {
  if (max <= 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-[11px] text-[#AAAAAA]">{label} {count}/{max}</span>
      <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-dashed border-[#666666] text-[#DDDDDD]">
        <Plus className="h-4 w-4" />
        <input type="file" accept={accept} className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onUpload(URL.createObjectURL(file));
        }} />
      </label>
      {onCanvas && <button type="button" onClick={onCanvas} className="h-9 rounded-lg bg-[#2D2D2D] px-2 text-[11px] text-white">Canvas</button>}
      {onLibrary && <button type="button" onClick={onLibrary} className="h-9 rounded-lg bg-[#2D2D2D] px-2 text-[11px] text-white">Library</button>}
    </div>
  );
}

function FrameSlot({ label, url, enabled, onUpload, onCanvas, onLibrary }: {
  label: string; url: string | null; enabled: boolean;
  onUpload: (url: string) => void; onCanvas?: () => void; onLibrary: () => void;
}) {
  return (
    <div className={`rounded-lg border border-[#3D3D3D] p-2 ${enabled ? '' : 'opacity-40'}`}>
      <p className="mb-1 text-[11px] text-[#AAAAAA]">{label}</p>
      {url && <img src={url} alt="" className="mb-2 h-14 w-full rounded object-cover" />}
      <div className="flex gap-1">
        <label className={`grid h-8 flex-1 cursor-pointer place-items-center rounded bg-[#2D2D2D] text-[11px] text-white ${enabled ? '' : 'pointer-events-none'}`}>
          Upload
          <input type="file" accept="image/*" className="hidden" disabled={!enabled} onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onUpload(URL.createObjectURL(file));
          }} />
        </label>
        {onCanvas && <button type="button" disabled={!enabled} onClick={onCanvas} className="h-8 rounded bg-[#2D2D2D] px-2 text-[11px] text-white">Canvas</button>}
        <button type="button" disabled={!enabled} onClick={onLibrary} className="h-8 rounded bg-[#2D2D2D] px-2 text-[11px] text-white">Library</button>
      </div>
    </div>
  );
}
