import React from 'react';
import { AlertTriangle, Check, Download, ExternalLink, Layers, Loader2, Megaphone, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatById, sizeFor } from '@/lib/adStudio/formats';
import { recentLabel, type StudioSession, type StudioResult } from '@/lib/adStudio/sessions';
import { shapeFor } from './FormatTiles';

const card = 'mx-auto w-full max-w-[520px] rounded-[28px] border border-white/[0.08] bg-[#0c0c11] p-6 text-center sm:p-8';
const outline = 'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#7d5cff]/70 px-6 text-[15px] font-semibold text-[#b9a6ff] transition hover:bg-[#7d5cff]/10 disabled:opacity-50';
const filled = 'ad-studio-primary inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition hover:brightness-110';

export function ProgressRing({ percent, size = 112 }: { percent: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} aria-label="Progress">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ad-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7d5cff" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#ad-ring)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)}
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <span className="absolute text-[22px] font-semibold text-white">{Math.round(value)}%</span>
    </div>
  );
}

export const PlanningView: React.FC<{ step: 'reading' | 'planning' }> = ({ step }) => (
  <div className={card} role="status" aria-live="polite" data-testid="planning-view">
    <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#a78bfa]" />
    <h2 className="mt-5 text-[20px] font-semibold text-white">{step === 'reading' ? 'Reading your product…' : 'Planning scenes…'}</h2>
    <p className="mt-2 text-[14px] text-white/50">This takes a few seconds. You can leave this page and come back to it.</p>
    <ol className="mx-auto mt-6 flex max-w-[260px] flex-col gap-2.5 text-left text-[14px]">
      {[['reading', 'Reading your product'], ['planning', 'Planning scenes']].map(([id, label]) => {
        const done = id === 'reading' && step === 'planning';
        const active = id === step;
        return (
          <li key={id} className={cn('flex items-center gap-2.5', done || active ? 'text-white' : 'text-white/35')}>
            <span className={cn('grid h-5 w-5 place-items-center rounded-full border', done ? 'border-[#7d5cff] bg-[#7d5cff]' : active ? 'border-[#a78bfa]' : 'border-white/20')}>
              {done ? <Check className="h-3 w-3 text-white" /> : active ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a78bfa]" /> : null}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  </div>
);

export const PlanReadyCard: React.FC<{ title: string; chips: string[]; note?: string; onReview: () => void }> = ({ title, chips, note, onReview }) => (
  <div className={card} data-testid="plan-ready">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#7d5cff]/20 text-[#a78bfa]"><Check className="h-6 w-6" /></span>
    <h2 className="mt-4 text-[22px] font-semibold text-white">Your ad plan is ready</h2>
    <p className="mt-1.5 text-[15px] text-white/70">{title}</p>
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {chips.map((chip) => <span key={chip} className="rounded-full bg-[#1b1b22] px-3 py-1 text-[13px] text-white/80">{chip}</span>)}
    </div>
    {note && <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-3 py-2 text-left text-[13px] text-amber-100/90" data-testid="plan-fallback-note">{note}</p>}
    <button type="button" onClick={onReview} className={cn(filled, 'mt-6 w-full')}>Review plan</button>
  </div>
);

export const ErrorCard: React.FC<{ title: string; message: string; onRetry: () => void; retryLabel?: string }> = ({ title, message, onRetry, retryLabel = 'Try again' }) => (
  <div className={card} role="alert" data-testid="error-card">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-500/15 text-red-300"><AlertTriangle className="h-6 w-6" /></span>
    <h2 className="mt-4 text-[20px] font-semibold text-white">{title}</h2>
    <p className="mt-2 break-words text-[14px] text-white/60">{message}</p>
    <p className="mt-1 text-[13px] text-white/40">Your description and files are kept.</p>
    <button type="button" onClick={onRetry} className={cn(filled, 'mt-6')}><RefreshCw className="h-4 w-4" /> {retryLabel}</button>
  </div>
);

export const BuildingView: React.FC<{ percent: number; label: string }> = ({ percent, label }) => (
  <div className={card} role="status" aria-live="polite" data-testid="building-view">
    <div className="flex justify-center"><ProgressRing percent={percent} /></div>
    <h2 className="mt-6 text-[20px] font-semibold text-white">Building your ad…</h2>
    <p className="mt-2 text-[14px] text-white/55">{label}</p>
    <p className="mt-1 text-[13px] text-white/35">It keeps going if you leave this page.</p>
  </div>
);

interface ResultProps {
  session: StudioSession;
  result: StudioResult;
  busy: null | 'variations' | 'download';
  progress?: { percent: number; label: string } | null;
  onOpenEditor: (designId: string) => void;
  onVariations: () => void;
  onDownload: () => void;
  onCampaign: () => void;
  onNew: () => void;
}

export const ResultScreen: React.FC<ResultProps> = ({ session, result, busy, progress, onOpenEditor, onVariations, onDownload, onCampaign, onNew }) => {
  const format = formatById(session.formatId);
  const shape = shapeFor(sizeFor(format, session.ratio).ratio, 220);
  return (
    <div className="mx-auto w-full max-w-[560px]" data-testid="result-screen">
      <div className="text-center">
        <h2 className="text-[24px] font-semibold text-white">Your ad is ready</h2>
        <p className="mt-1 text-[14px] text-white/55">{session.plan?.title ?? session.title}</p>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#14141b] shadow-[0_30px_80px_-40px_rgba(125,92,255,0.6)]" style={{ width: shape.width, maxWidth: '100%' }}>
          {result.previewUrl ? <img src={result.previewUrl} alt="Your finished ad" className="block h-auto w-full" /> : <div className="aspect-[4/5] w-full" />}
        </div>
      </div>

      {result.videoUrl && (
        <video src={result.videoUrl} controls playsInline className="mx-auto mt-4 max-h-[320px] max-w-full rounded-2xl border border-white/10" aria-label="Rendered video" />
      )}

      {result.notes.length > 0 && (
        <ul className="mt-5 space-y-2" data-testid="result-notes">
          {result.notes.map((note) => (
            <li key={note} className="rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-3 py-2 text-[13px] text-amber-100/90">{note}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => onOpenEditor(result.designId)} className={filled}><ExternalLink className="h-4 w-4" /> Open in editor</button>
        <button type="button" onClick={onVariations} disabled={busy !== null} className={outline}>
          {busy === 'variations' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />} Make variations
        </button>
        <button type="button" onClick={onDownload} disabled={busy !== null} className={outline}>
          {busy === 'download' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download
        </button>
        <button type="button" onClick={onCampaign} className={outline}><Megaphone className="h-4 w-4" /> Create campaign</button>
      </div>

      {busy && progress && <p className="mt-3 text-center text-[13px] text-white/55" role="status">{progress.label}</p>}

      {(result.variations?.length ?? 0) > 0 && (
        <section className="mt-8" aria-label="Variations" data-testid="variations">
          <h3 className="mb-3 text-[15px] font-semibold text-white">Variations</h3>
          <ul className="grid grid-cols-3 gap-3">
            {result.variations!.map((variation) => (
              <li key={variation.designId} className="min-w-0">
                <button type="button" onClick={() => onOpenEditor(variation.designId)} className="block w-full text-left" aria-label={`Open ${variation.label} in editor`}>
                  <span className="block aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#14141b]">
                    <img src={variation.previewUrl} alt="" className="h-full w-full object-cover" />
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-white/70">{variation.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 text-center">
        <button type="button" onClick={onNew} className="text-[14px] text-white/60 underline-offset-2 hover:text-white hover:underline">Make another ad</button>
      </div>
    </div>
  );
};

export const RecentStrip: React.FC<{ sessions: StudioSession[]; onOpen: (session: StudioSession) => void }> = ({ sessions, onOpen }) => {
  if (!sessions.length) return null;
  return (
    <section aria-label="Recent" data-testid="recent-strip">
      <h2 className="mb-3 text-[15px] font-semibold text-white">Recent</h2>
      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {sessions.map((session) => {
          const label = recentLabel(session);
          const preview = session.result?.previewUrl || session.files.find((file) => file.kind !== 'video')?.url;
          return (
            <li key={session.id} className="w-[132px] shrink-0">
              <button type="button" onClick={() => onOpen(session)} className="block w-full text-left" aria-label={`${session.title}, ${label}`}>
                <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#2a1f5c] to-[#14141b]">
                  {preview && <img src={preview} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  <span className={cn(
                    'absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    label === 'Ready' ? 'bg-emerald-400/90 text-emerald-950' : label === 'Building' ? 'bg-amber-300/90 text-amber-950' : 'bg-[#7d5cff] text-white',
                  )}>{label}</span>
                </span>
                <span className="mt-1.5 block truncate text-[13px] text-white/80">{session.plan?.title ?? session.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
