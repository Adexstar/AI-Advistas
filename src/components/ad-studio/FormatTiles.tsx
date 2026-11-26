import React from 'react';
import { cn } from '@/lib/utils';
import { AD_FORMATS, formatById, sizeFor, VIDEO_LENGTHS, type FormatId } from '@/lib/adStudio/formats';

export interface FormatChoice {
  formatId: FormatId;
  ratio: string;
  length: number;
}

/** Real shape of a tile: the ratio drawn inside a fixed 44px box. */
export function shapeFor(ratio: string, box = 44): { width: number; height: number } {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return { width: box, height: box };
  return w >= h
    ? { width: box, height: Math.round((box * h) / w) }
    : { width: Math.round((box * w) / h), height: box };
}

const chip = (active: boolean) => cn(
  'h-8 rounded-full px-3 text-[13px] font-medium transition',
  active ? 'bg-[#7d5cff] text-white' : 'bg-[#1b1b22] text-white/75 hover:bg-[#23232c]',
);

export const FormatTiles: React.FC<{ value: FormatChoice; onChange: (value: FormatChoice) => void }> = ({ value, onChange }) => {
  const selected = formatById(value.formatId);
  const size = sizeFor(selected, value.ratio);

  const pick = (id: FormatId) => {
    const format = formatById(id);
    onChange({
      formatId: id,
      ratio: format.sizes[0].ratio,
      length: format.kind === 'video' ? (format.lengths.includes(value.length) ? value.length : format.defaultLength) : 0,
    });
  };

  return (
    <div data-testid="format-tiles">
      <div role="radiogroup" aria-label="Ad format" className="grid grid-cols-5 gap-2 sm:gap-3">
        {AD_FORMATS.map((format) => {
          const active = format.id === value.formatId;
          const ratio = active ? size.ratio : format.sizes[0].ratio;
          const shape = shapeFor(ratio);
          return (
            <button
              key={format.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${format.label}, ${format.sizes.map((item) => item.ratio).join(' or ')}`}
              onClick={() => pick(format.id)}
              className={cn(
                'flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-1 py-3 text-center transition',
                active
                  ? 'border-[#7d5cff] bg-[#7d5cff]/[0.12] shadow-[0_0_0_1px_rgba(125,92,255,0.35)]'
                  : 'border-white/[0.07] bg-[#121218] hover:border-white/20',
              )}
            >
              <span className="grid h-11 w-11 place-items-center">
                <span
                  aria-hidden
                  style={{ width: shape.width, height: shape.height }}
                  className={cn('rounded-[5px] border', active ? 'border-[#a78bfa] bg-[#7d5cff]/40' : 'border-white/25 bg-white/[0.06]')}
                />
              </span>
              <span className="min-w-0 px-0.5">
                <span className="block truncate text-[12px] font-semibold text-white sm:text-[13px]">{format.label}</span>
                <span className="mt-0.5 block truncate text-[11px] text-white/45">{format.sizes.map((item) => item.ratio).join(' · ')}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="format-options">
        <p className="mr-1 text-[12px] text-white/45">{selected.description}</p>
        {selected.sizes.length > 1 && (
          <div role="group" aria-label="Size" className="flex gap-2">
            {selected.sizes.map((item) => (
              <button key={item.ratio} type="button" aria-pressed={item.ratio === size.ratio} onClick={() => onChange({ ...value, ratio: item.ratio })} className={chip(item.ratio === size.ratio)}>
                {item.ratio}
              </button>
            ))}
          </div>
        )}
        {selected.kind === 'video' && (
          <div role="group" aria-label="Length" className="flex gap-2">
            {VIDEO_LENGTHS.map((seconds) => (
              <button key={seconds} type="button" aria-pressed={value.length === seconds} onClick={() => onChange({ ...value, length: seconds })} className={chip(value.length === seconds)}>
                {seconds}s
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
