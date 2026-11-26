import React, { useRef, useState } from 'react';
import { ArrowUpDown, Image as ImageIcon, Minus, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MAX_SCENES, MIN_SCENES, MAX_SCENE_SECONDS, MIN_SCENE_SECONDS, SCENE_TYPES, addScene, canAddScene, canRemoveScene,
  formatClock, moveScene, planChips, removeScene, sceneStarts, updateMeta, updateScene,
  type Scene, type SceneType, type StudioPlan,
} from '@/lib/adStudio/plan';

interface Props {
  plan: StudioPlan;
  product: string;
  onChange: (plan: StudioPlan) => void;
  onApprove: () => void;
  onRegenerate: () => void;
  onClose: () => void;
  approving?: boolean;
}

const fieldClass = 'h-10 w-full min-w-0 rounded-lg border border-white/10 bg-[#15151b] px-3 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#7d5cff]';

function Thumb({ scene }: { scene: Scene }) {
  if (scene.imageUrl) {
    return <img src={scene.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2a2548] to-[#14121f]" aria-hidden>
      <ImageIcon className="h-6 w-6 text-white/25" />
    </div>
  );
}

export const PlanReview: React.FC<Props> = ({ plan, product, onChange, onApprove, onRegenerate, onClose, approving }) => {
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const rows = useRef<Array<HTMLElement | null>>([]);
  const starts = sceneStarts(plan.scenes);
  const timed = plan.kind === 'video';

  const targetIndex = (clientY: number, fallback: number) => {
    for (let index = 0; index < plan.scenes.length; index += 1) {
      const rect = rows.current[index]?.getBoundingClientRect();
      if (rect && clientY >= rect.top && clientY <= rect.bottom) return index;
    }
    return fallback;
  };

  const handleDown = (event: React.PointerEvent<HTMLButtonElement>, index: number) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(index);
  };
  const handleMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragging === null) return;
    const next = targetIndex(event.clientY, dragging);
    if (next !== dragging) {
      onChange(moveScene(plan, dragging, next));
      setDragging(next);
    }
  };
  const handleUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(null);
  };
  const handleKey = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onChange(moveScene(plan, index, index - 1));
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      onChange(moveScene(plan, index, index + 1));
    }
  };

  return (
    <section
      data-testid="plan-review"
      aria-label="Ad plan"
      className="mx-auto flex w-full max-w-[520px] flex-col rounded-[28px] border border-white/[0.06] bg-[#0c0c11] px-5 pb-5 pt-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden />
      <header className="relative flex h-10 items-center justify-between">
        <button type="button" onClick={onClose} aria-label="Close plan" className="grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10">
          <X className="h-6 w-6" />
        </button>
        <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-white">Ad plan</h2>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          aria-pressed={editing}
          className="h-10 rounded-lg px-1 text-[15px] font-semibold text-[#8b6cf0] hover:text-[#a78bfa]"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </header>

      <div className="mt-4">
        {editing ? (
          <div className="space-y-2">
            <input aria-label="Plan title" value={plan.title} onChange={(event) => onChange(updateMeta(plan, { title: event.target.value }))} className={cn(fieldClass, 'text-[18px] font-bold')} />
            <textarea
              aria-label="Plan description"
              value={plan.description}
              rows={2}
              onChange={(event) => onChange(updateMeta(plan, { description: event.target.value }))}
              className={cn(fieldClass, 'h-auto resize-none py-2')}
            />
          </div>
        ) : (
          <>
            <h3 className="text-[20px] font-bold leading-tight tracking-tight text-white">{plan.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-white/55">{plan.description}</p>
          </>
        )}
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Plan details">
          {planChips(plan).map((chip) => (
            <span key={chip} className="rounded-full bg-[#1b1b22] px-3 py-1.5 text-[13px] font-medium text-white/85">{chip}</span>
          ))}
        </div>
      </div>

      {plan.source === 'template' && plan.note && (
        <p data-testid="plan-fallback-note" className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-[12px] leading-snug text-amber-200/90">
          {plan.note}
        </p>
      )}

      <ol data-testid="scene-list" className="mt-4 border-b border-white/[0.07]">
        {plan.scenes.map((scene, index) => (
          <li
            key={scene.id}
            ref={(element) => { rows.current[index] = element; }}
            className={cn('border-t border-white/[0.07] py-4 transition-colors', dragging === index && 'bg-white/[0.04]')}
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label={`Reorder scene ${index + 1}, ${scene.type}. Drag, or use the up and down arrow keys.`}
                onPointerDown={(event) => handleDown(event, index)}
                onPointerMove={handleMove}
                onPointerUp={handleUp}
                onPointerCancel={handleUp}
                onKeyDown={(event) => handleKey(event, index)}
                className="grid h-10 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-white/80 hover:bg-white/10 active:cursor-grabbing"
              >
                <ArrowUpDown className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-medium text-[#8b6cf0]">
                  {scene.type}
                  {timed && <span className="font-normal text-white/60"> · {formatClock(starts[index])}</span>}
                </p>
                <p className="mt-0.5 break-words text-[16px] leading-snug text-white">{scene.text || <span className="text-white/35">Add a line</span>}</p>
              </div>
              <div className="h-[84px] w-[100px] shrink-0 overflow-hidden rounded-[10px] bg-[#15151b] sm:h-[100px] sm:w-[117px]">
                <Thumb scene={scene} />
              </div>
            </div>

            {editing && (
              <div className="mt-3 grid gap-2 pl-12" data-testid={`scene-editor-${index}`}>
                <label className="block text-[12px] text-white/50">
                  On-screen text
                  <input
                    aria-label={`Scene ${index + 1} text`}
                    value={scene.text}
                    maxLength={60}
                    onChange={(event) => onChange(updateScene(plan, scene.id, { text: event.target.value }))}
                    className={cn(fieldClass, 'mt-1')}
                  />
                </label>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block text-[12px] text-white/50">
                    Scene type
                    <select
                      aria-label={`Scene ${index + 1} type`}
                      value={scene.type}
                      onChange={(event) => onChange(updateScene(plan, scene.id, { type: event.target.value as SceneType }))}
                      className={cn(fieldClass, 'mt-1 w-auto pr-8')}
                    >
                      {SCENE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  {timed && (
                    <div className="text-[12px] text-white/50">
                      Length
                      <div className="mt-1 flex h-10 items-center rounded-lg border border-white/10 bg-[#15151b]">
                        <button
                          type="button"
                          aria-label={`Shorten scene ${index + 1}`}
                          disabled={scene.duration <= MIN_SCENE_SECONDS}
                          onClick={() => onChange(updateScene(plan, scene.id, { duration: scene.duration - 0.5 }))}
                          className="grid h-10 w-9 place-items-center text-white/80 hover:text-white disabled:opacity-30"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[3rem] text-center text-[14px] tabular-nums text-white" aria-label={`Scene ${index + 1} length`}>{scene.duration}s</span>
                        <button
                          type="button"
                          aria-label={`Lengthen scene ${index + 1}`}
                          disabled={scene.duration >= MAX_SCENE_SECONDS}
                          onClick={() => onChange(updateScene(plan, scene.id, { duration: scene.duration + 0.5 }))}
                          className="grid h-10 w-9 place-items-center text-white/80 hover:text-white disabled:opacity-30"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove scene ${index + 1}`}
                    disabled={!canRemoveScene(plan)}
                    onClick={() => onChange(removeScene(plan, scene.id))}
                    className="ml-auto grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>

      {editing && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onChange(addScene(plan, product))}
            disabled={!canAddScene(plan)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-[14px] font-medium text-white hover:bg-white/10 disabled:opacity-35"
          >
            <Plus className="h-4 w-4" /> Add scene
          </button>
          <p className="text-[12px] text-white/45">{plan.scenes.length} of {MIN_SCENES}–{MAX_SCENES} scenes</p>
        </div>
      )}

      <button
        type="button"
        onClick={onRegenerate}
        className="mt-5 h-12 w-full rounded-xl border border-white/[0.08] bg-[#111116] text-[15px] font-medium text-[#8b6cf0] hover:bg-[#17171e]"
      >
        Regenerate plan
      </button>
      <button
        type="button"
        onClick={onApprove}
        disabled={approving || plan.scenes.every((scene) => !scene.text.trim())}
        className="ad-studio-primary mt-3 h-[52px] w-full rounded-xl text-[16px] font-semibold transition hover:brightness-110 disabled:cursor-not-allowed"
      >
        Approve plan
      </button>
    </section>
  );
};
