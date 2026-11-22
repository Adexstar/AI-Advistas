import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { readEdgeError } from '@/services/edgeError';
import { StockBrowser } from '@/components/visual-editor/StockBrowser';
import type { DirectorSequence } from '@/components/visual-editor/placeMedia';
import { DIRECTOR_CATEGORIES, ENHANCE_SECRETS, type DirectorCategory } from './directorPrompt';
import {
  AD_ASPECTS, AD_DURATIONS, AD_GOALS, AD_PRESETS, AD_TRANSITIONS, AD_VIBES,
  addShot, applyPreset, blankPlan, estimateCredits, fitShots, moveShot, planFromModel,
  planToPrompt, readCurrentPlan, readNamedPlans, removeShot, rewriteShotFromTemplate, videoFailureMessage,
  saveCurrentPlan, saveNamedPlan, shotToPrompt, templatePlan,
  type AdAspect, type AdDuration, type AdGoal, type AdPlan, type AdShot, type AdStep, type AdTransition, type AdVibe, type GenerateMode,
} from './adVideoPlan';

const TEMPLATE_NOTE = `Template. The text model was not available. Add ${ENHANCE_SECRETS.join(', ')}.`;
const VIDEO_KEY = 'RUNWARE_API_KEY';

export const AdVideoFlow: React.FC<{
  compact?: boolean;
  selectedUrl?: string | null;
  configured: Record<string, boolean>;
  onPlace: (sequence: DirectorSequence) => Promise<void> | void;
}> = ({ compact = false, selectedUrl, configured, onPlace }) => {
  const [plan, setPlan] = useState<AdPlan>(() => readCurrentPlan() ?? blankPlan());
  const [presetId, setPresetId] = useState('');
  const [step, setStep] = useState<AdStep>('product');
  const [saved, setSaved] = useState<AdPlan[]>(() => readNamedPlans());
  const [library, setLibrary] = useState<null | 'product' | number>(null);
  const [busy, setBusy] = useState<null | 'direct' | 'shot' | 'frame' | 'generate'>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [shotNote, setShotNote] = useState<Record<string, string>>({});

  useEffect(() => { saveCurrentPlan(plan); }, [plan]);

  const patch = (partial: Partial<AdPlan>) => setPlan((current) => ({ ...current, ...partial }));
  const editShot = (index: number, partial: Partial<AdShot>) => {
    setPlan((current) => ({
      ...current,
      shots: current.shots.map((shot, item) => (item === index ? { ...shot, ...partial } : shot)),
    }));
  };

  const direct = async () => {
    setBusy('direct');
    setError('');
    const local = templatePlan(plan);
    const { data, error: invokeError } = await supabase.functions.invoke('enhance-prompt', {
      body: {
        format: 'shots',
        mode: 'video',
        prompt: `${plan.productName}. ${plan.goal} for ${plan.audience || 'the buyer'}. Vibe: ${plan.vibe}.`,
        category: plan.category,
        duration: plan.duration,
        aspect: plan.aspect,
        references: plan.productImage.startsWith('http') ? [plan.productImage] : [],
      },
    });
    setBusy(null);
    const modelled = !invokeError && typeof data?.prompt === 'string' ? planFromModel(plan, data.prompt) : null;
    if (modelled) {
      setPlan(modelled);
      setNotice('');
    } else {
      setPlan({ ...local, productImage: plan.productImage, shots: local.shots.map((shot, index) => ({ ...shot, frameUrl: plan.shots[index]?.frameUrl || '' })) });
      setNotice(TEMPLATE_NOTE);
    }
    setStep('shots');
  };

  const rewrite = async (index: number) => {
    setBusy('shot');
    const shot = plan.shots[index];
    const { data, error: invokeError } = await supabase.functions.invoke('enhance-prompt', {
      body: { format: 'shots', mode: 'video', prompt: `Rewrite this one shot: ${shot.action}`, category: plan.category, duration: plan.duration, aspect: plan.aspect },
    });
    setBusy(null);
    const modelled = !invokeError && typeof data?.prompt === 'string' ? planFromModel(plan, data.prompt) : null;
    if (!modelled) {
      setPlan((current) => ({ ...current, shots: rewriteShotFromTemplate(current, index) }));
      setShotNote((current) => ({ ...current, [shot.id]: 'Template line. The text model did not rewrite this shot.' }));
      return;
    }
    const next = modelled.shots[0];
    editShot(index, { camera: next.camera, action: next.action, onScreenText: next.onScreenText, transition: next.transition, from: 'model' });
    setShotNote((current) => ({ ...current, [shot.id]: '' }));
  };

  const frameFor = async (index: number) => {
    setBusy('frame');
    const shot = plan.shots[index];
    const { data, error: invokeError } = await supabase.functions.invoke('generate-ad-image', {
      body: { prompt: shot.action, product: plan.productName || shot.action, provider: configured.openai && !configured.runware ? 'openai' : 'runware', width: 768, height: plan.aspect === '16:9' ? 432 : plan.aspect === '1:1' ? 768 : 1024 },
    });
    setBusy(null);
    if (invokeError || typeof data?.imageUrl !== 'string') {
      const message = await readEdgeError(invokeError, data?.error || 'Add RUNWARE_API_KEY or OPENAI_API_KEY for this frame.');
      setShotNote((current) => ({ ...current, [shot.id]: message }));
      return;
    }
    editShot(index, { frameUrl: data.imageUrl });
    setShotNote((current) => ({ ...current, [shot.id]: '' }));
  };

  const generate = async () => {
    setBusy('generate');
    setError('');
    saveCurrentPlan(plan);
    const credits = estimateCredits(plan.generateMode, plan.duration, plan.shots.length);
    if (configured.runware === false) {
      setError(`Add ${VIDEO_KEY}. No video was created (${credits} credits were not used). The shot list is saved, and the on-screen lines are on the timeline.`);
      await onPlace(sequenceFor(plan, {}));
      setBusy(null);
      return;
    }
    const videos: Record<string, string> = {};
    try {
      const size = outputSize(plan.aspect, plan.resolution);
      if (plan.generateMode === 'one-shot') {
        const url = await renderClip(planToPrompt(plan), plan.duration, firstUrl(plan), lastUrl(plan), plan.audio, size);
        if (url) videos[plan.shots[0]?.id || 'film'] = url;
      } else {
        for (const shot of plan.shots) {
          const url = await renderClip(shotToPrompt(plan, shot), 5, https(shot.frameUrl) || https(plan.productImage), '', false, size);
          if (url) videos[shot.id] = url;
        }
      }
      const made = Object.keys(videos).length;
      if (!made) throw new Error(`No video was returned. Add ${VIDEO_KEY}.`);
      await onPlace(sequenceFor(plan, videos));
      setError('');
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'The video was not created.';
      setError(videoFailureMessage(message));
      await onPlace(sequenceFor(plan, videos));
    } finally {
      setBusy(null);
    }
  };

  const cost = estimateCredits(plan.generateMode, plan.duration, plan.shots.length);

  return (
    <div data-testid="ad-video-flow" className="flex min-w-0 flex-col gap-3">
      <div className="flex gap-1">
        {(['product', 'brief', 'shots'] as AdStep[]).map((item, index) => (
          <button key={item} type="button" onClick={() => setStep(item)} className={`h-7 min-w-0 flex-1 rounded-md text-[11px] font-semibold capitalize ${step === item ? 'bg-[#6E56F5] text-white' : 'bg-[#2D2D2D] text-[#DDDDDD]'}`}>
            {index + 1} {item}
          </button>
        ))}
      </div>

      {step === 'product' && (
        <div className="space-y-2">
          <Field label="Product name" value={plan.productName} onChange={(productName) => patch({ productName })} placeholder="Court Runner" />
          <p className="text-[11px] text-[#AAAAAA]">Product picture</p>
          {plan.productImage && <img src={plan.productImage} alt="" className="h-16 w-full rounded-md object-cover" />}
          <div className="flex flex-wrap gap-1.5">
            <FileButton label="Upload" onFile={(url) => patch({ productImage: url })} />
            <Mini onClick={() => selectedUrl && patch({ productImage: selectedUrl })} disabled={!selectedUrl}>Canvas</Mini>
            <Mini onClick={() => setLibrary('product')}>Library</Mini>
          </div>
          <button type="button" onClick={() => setStep('brief')} className={`h-10 w-full rounded-xl bg-[#6E56F5] text-sm font-semibold text-white ${compact ? 'sticky bottom-0 z-10' : ''}`}>Next: brief</button>
        </div>
      )}

      {step === 'brief' && (
        <div className="space-y-2">
          <label className="block text-[11px] text-[#AAAAAA]">
            Inspirations
            <select aria-label="Inspirations" className={selectClass} value={presetId} onChange={(event) => { setPresetId(event.target.value); if (event.target.value) setPlan((current) => applyPreset(event.target.value, current)); }}>
              <option value="">Choose a starter</option>
              {AD_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
          </label>
          <ChipRow label="Goal" values={AD_GOALS} active={plan.goal} onPick={(goal) => patch({ goal: goal as AdGoal })} />
          <Field label="Audience" value={plan.audience} onChange={(audience) => patch({ audience })} placeholder="Who is this for?" />
          <ChipRow label="Vibe" values={AD_VIBES} active={plan.vibe} onPick={(vibe) => patch({ vibe: vibe as AdVibe })} />
          <label className="block text-[11px] text-[#AAAAAA]">
            Category
            <select aria-label="Category" className={selectClass} value={plan.category} onChange={(event) => patch({ category: event.target.value as DirectorCategory })}>
              {DIRECTOR_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <button type="button" data-testid="ad-direct" onClick={() => void direct()} disabled={busy !== null} className={`h-10 w-full rounded-xl bg-[#6E56F5] text-sm font-semibold text-white disabled:opacity-60 ${compact ? 'sticky bottom-0 z-10' : ''}`}>
            {busy === 'direct' ? 'Directing…' : 'Direct'}
          </button>
        </div>
      )}

      {step === 'shots' && (
        <div className="min-w-0 space-y-2">
          {plan.source === 'template' && (
            <p data-testid="ad-template-label" className="rounded-lg border border-[#5A4A1E] bg-[#2A2418] px-2 py-1.5 text-[11px] leading-snug text-[#F5D7A1]">
              {notice || `Template from the ${plan.category} director. Direct replaces it when a text model answers.`}
            </p>
          )}
          {plan.source === 'model' && <p className="text-[11px] text-[#C8BEFF]">Written by the text model. You can edit every line.</p>}
          <div className="flex flex-wrap gap-1">
            {AD_ASPECTS.map((aspect) => <Chip key={aspect} active={plan.aspect === aspect} onClick={() => patch({ aspect: aspect as AdAspect })}>{aspect}</Chip>)}
            {AD_DURATIONS.map((duration) => (
              <Chip key={duration} active={plan.duration === duration} onClick={() => setPlan((current) => ({ ...current, duration: duration as AdDuration, shots: fitShots(current.shots, duration) }))}>{duration}s</Chip>
            ))}
            <Chip active={plan.resolution === '1080p'} onClick={() => patch({ resolution: plan.resolution === '1080p' ? '720p' : '1080p' })}>{plan.resolution}</Chip>
            <Chip active={plan.audio} onClick={() => patch({ audio: !plan.audio })}>Audio</Chip>
          </div>
          <Field label="Look" value={plan.look} onChange={(look) => patch({ look })} />
          <Field label="Lighting" value={plan.lighting} onChange={(lighting) => patch({ lighting })} />
          <Field label="Music mood" value={plan.musicMood} onChange={(musicMood) => patch({ musicMood })} />
          <div data-testid="ad-shot-list" className="space-y-2">
            {plan.shots.map((shot, index) => {
              const start = plan.shots.slice(0, index).reduce((sum, item) => sum + item.duration, 0);
              return (
                <article key={shot.id} className="min-w-0 rounded-lg border border-[#3D3D3D] bg-[#1A1A1A] p-2">
                  <p className="text-[11px] text-[#AAAAAA]">{index + 1} · {start.toFixed(1)}s · {shot.duration}s{shot.from === 'template' && plan.source === 'model' ? ' · Template' : ''}</p>
                  <input value={shot.camera} onChange={(event) => editShot(index, { camera: event.target.value })} aria-label={`Camera ${index + 1}`} className={`${inputClass} mt-1`} />
                  <textarea value={shot.action} rows={compact ? 2 : 3} onChange={(event) => editShot(index, { action: event.target.value })} aria-label={`Action ${index + 1}`} className={`${inputClass} mt-1 resize-none`} />
                  <input value={shot.onScreenText} onChange={(event) => editShot(index, { onScreenText: event.target.value })} aria-label={`On-screen text ${index + 1}`} placeholder="On-screen text" className={`${inputClass} mt-1`} />
                  <select aria-label={`Transition ${index + 1}`} value={shot.transition} onChange={(event) => editShot(index, { transition: event.target.value as AdTransition })} className={`${selectClass} mt-1`}>
                    {AD_TRANSITIONS.map((transition) => <option key={transition} value={transition}>{transition}</option>)}
                  </select>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {shot.frameUrl && <img src={shot.frameUrl} alt="" className="h-8 w-8 rounded object-cover" />}
                    <FileButton label="Frame" onFile={(url) => editShot(index, { frameUrl: url })} />
                    <Mini onClick={() => selectedUrl && editShot(index, { frameUrl: selectedUrl })} disabled={!selectedUrl}>Canvas</Mini>
                    <Mini onClick={() => setLibrary(index)}>Library</Mini>
                    <Mini onClick={() => void frameFor(index)} disabled={busy !== null}>{busy === 'frame' ? '…' : 'Generate'}</Mini>
                  </div>
                  {shotNote[shot.id] && <p className="mt-1 text-[11px] leading-snug text-[#F3C7C7]">{shotNote[shot.id]}</p>}
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Mini onClick={() => setPlan((current) => ({ ...current, shots: moveShot(current.shots, index, -1) }))} disabled={index === 0}>Up</Mini>
                    <Mini onClick={() => setPlan((current) => ({ ...current, shots: moveShot(current.shots, index, 1) }))} disabled={index === plan.shots.length - 1}>Down</Mini>
                    <Mini onClick={() => void rewrite(index)} disabled={busy !== null}>Rewrite</Mini>
                    <Mini onClick={() => setPlan((current) => ({ ...current, shots: removeShot(current.shots, index, current.duration) }))} disabled={plan.shots.length <= 3}>Delete</Mini>
                  </div>
                </article>
              );
            })}
          </div>
          <Mini onClick={() => setPlan((current) => ({ ...current, shots: addShot(current) }))} disabled={plan.shots.length >= 6}>Add shot</Mini>
          <div className="flex gap-1">
            {(['one-shot', 'per-shot'] as GenerateMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => patch({ generateMode: mode })} className={`h-8 min-w-0 flex-1 rounded-md text-[11px] font-semibold ${plan.generateMode === mode ? 'bg-[#3D3D3D] text-white' : 'text-[#AAAAAA]'}`}>
                {mode === 'one-shot' ? 'One film' : 'A clip per shot'}
              </button>
            ))}
          </div>
          <button type="button" data-testid="ad-generate" onClick={() => void generate()} disabled={busy !== null} className={`h-11 w-full rounded-xl bg-[#6E56F5] text-sm font-semibold text-white disabled:opacity-60 ${compact ? 'sticky bottom-0 z-10' : ''}`}>
            {busy === 'generate' ? 'Working…' : `Create · ${cost} ${cost === 1 ? 'credit' : 'credits'}`}
          </button>
          <div className="flex min-w-0 gap-1">
            <input value={plan.name} onChange={(event) => patch({ name: event.target.value })} aria-label="Draft name" className={inputClass} />
            <Mini onClick={() => setSaved(saveNamedPlan(plan))}>Save draft</Mini>
          </div>
          {saved.length > 0 && (
            <select aria-label="Saved drafts" className={selectClass} value="" onChange={(event) => {
              const found = saved.find((item) => item.id === event.target.value);
              if (found) setPlan(found);
            }}>
              <option value="">Open a saved plan</option>
              {saved.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          )}
        </div>
      )}

      {library !== null && (
        <StockBrowser
          kind="image"
          canvas={null}
          onPick={(url) => {
            if (library === 'product') patch({ productImage: url });
            else editShot(library, { frameUrl: url });
            setLibrary(null);
          }}
        />
      )}
      {busy === 'direct' && <p className="text-xs text-[#C8BEFF]"><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />Writing the shot list…</p>}
      {error && <p data-testid="ad-error" className="rounded-lg border border-[#6B3A3A] bg-[#2A1A1A] px-3 py-2 text-xs leading-snug text-[#F3C7C7]">{error}</p>}
    </div>
  );
};

function sequenceFor(plan: AdPlan, videos: Record<string, string>): DirectorSequence {
  let start = 0;
  const sequence: DirectorSequence = { videos: [], stills: [], titles: [] };
  const film = videos[plan.shots[0]?.id || 'film'];
  if (plan.generateMode === 'one-shot' && film) {
    sequence.videos.push({ url: film, start: 0, duration: plan.duration });
  }
  for (const shot of plan.shots) {
    if (plan.generateMode === 'per-shot' && videos[shot.id]) sequence.videos.push({ url: videos[shot.id], start, duration: shot.duration });
    else if (shot.frameUrl && !(plan.generateMode === 'one-shot' && film)) sequence.stills.push({ url: shot.frameUrl, start, duration: shot.duration });
    if (shot.onScreenText.trim()) sequence.titles.push({ text: shot.onScreenText, start, duration: shot.duration });
    start = Math.round((start + shot.duration) * 10) / 10;
  }
  return sequence;
}

function outputSize(aspect: AdAspect, resolution: AdPlan['resolution']) {
  const edge = resolution === '720p' ? 720 : 1080;
  if (aspect === '1:1') return { width: edge, height: edge };
  if (aspect === '16:9') return { width: edge, height: Math.round((edge * 9) / 16) };
  return { width: Math.round((edge * 9) / 16), height: edge };
}

async function renderClip(prompt: string, duration: number, firstFrame: string, lastFrame: string, audio: boolean, size: { width: number; height: number }): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-ad-video', {
    body: { prompt, product: prompt, duration, firstFrame, lastFrame, audio, width: size.width, height: size.height },
  });
  if (error) throw new Error(await readEdgeError(error, `Add ${VIDEO_KEY}.`));
  let payload = data;
  for (let attempt = 0; attempt < 4 && payload?.pending && payload?.taskUUID; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const next = await supabase.functions.invoke('generate-ad-video', { body: { taskUUID: payload.taskUUID } });
    if (next.error) throw new Error(await readEdgeError(next.error, 'The video status check failed.'));
    payload = next.data;
  }
  if (typeof payload?.videoUrl !== 'string') throw new Error(payload?.error || `No video was returned. Add ${VIDEO_KEY}.`);
  return payload.videoUrl;
}

const https = (url: string) => (url.startsWith('http') ? url : '');
const firstUrl = (plan: AdPlan) => https(plan.shots.find((shot) => shot.frameUrl)?.frameUrl || '') || https(plan.productImage);
const lastUrl = (plan: AdPlan) => https([...plan.shots].reverse().find((shot) => shot.frameUrl)?.frameUrl || '');

const inputClass = 'h-8 w-full min-w-0 rounded-md border border-[#555555] bg-[#2D2D2D] px-2 text-xs text-white outline-none';
const selectClass = 'mt-1 h-8 w-full min-w-0 rounded-md border border-[#555555] bg-[#2D2D2D] px-2 text-xs text-white';

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block min-w-0 text-[11px] text-[#AAAAAA]">
      {label}
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${inputClass} mt-1`} />
    </label>
  );
}

function ChipRow({ label, values, active, onPick }: { label: string; values: readonly string[]; active: string; onPick: (value: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-[11px] text-[#AAAAAA]">{label}</p>
      <div className="flex flex-wrap gap-1">
        {values.map((value) => <Chip key={value} active={active === value} onClick={() => onPick(value)}>{value}</Chip>)}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`h-7 rounded-full px-2.5 text-[11px] font-semibold ${active ? 'bg-[#6E56F5] text-white' : 'bg-[#2D2D2D] text-[#DDDDDD]'}`}>{children}</button>
  );
}

function Mini({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="h-8 rounded-md bg-[#2D2D2D] px-2 text-[11px] font-semibold text-white disabled:opacity-40">{children}</button>
  );
}

function FileButton({ label, onFile }: { label: string; onFile: (url: string) => void }) {
  return (
    <label className="inline-flex h-8 cursor-pointer items-center rounded-md bg-[#2D2D2D] px-2 text-[11px] font-semibold text-white">
      {label}
      <input type="file" accept="image/*" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) onFile(URL.createObjectURL(file));
      }} />
    </label>
  );
}
