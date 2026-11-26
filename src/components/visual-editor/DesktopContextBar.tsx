import React from 'react';
import type { Canvas as FabricCanvas } from 'fabric';
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Italic, Minus, Plus, Underline,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectionToolSet } from '@/components/visual-editor/editorTools';

export type ContextToolItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TEXT_INLINE_FONTS = [
  'Outfit', 'Poppins', 'Inter', 'Roboto', 'Montserrat', 'Lato', 'Playfair Display', 'Bebas Neue',
];

type Props = {
  selected: any;
  tools: ContextToolItem[];
  activeTool: string | null;
  onTool: (id: string) => void;
  onChanged: () => void;
  canvas: FabricCanvas | null;
};

/** Canva-style floating property bar — sits over the canvas when a layer is selected. */
export function DesktopContextBar({
  selected,
  tools,
  activeTool,
  onTool,
  onChanged,
  canvas,
}: Props) {
  const setId = selectionToolSet(selected);

  const paint = (props: Record<string, unknown>) => {
    if (!selected || !canvas) return;
    selected.set(props);
    selected.setCoords?.();
    canvas.requestRenderAll();
    onChanged();
  };

  const fontFamily = String(selected?.fontFamily || 'Outfit');
  const fontSize = Math.round(Number(selected?.fontSize) || 24);
  const fill = typeof selected?.fill === 'string' ? selected.fill : '#ffffff';
  const fillHex = /^#(?:[0-9a-f]{6})$/i.test(fill) ? fill : '#ffffff';
  const boldOn = /bold|700|800|900/i.test(String(selected?.fontWeight || ''));
  const textTools = tools.filter((tool) => ['spacing', 'effects', 'animate', 'position'].includes(tool.id));
  const imagePrimary = tools.filter((tool) => ['edit-image', 'replace', 'bg-remove'].includes(tool.id));
  const imageRest = tools.filter((tool) => !['edit-image', 'replace', 'bg-remove'].includes(tool.id));

  const pill = (tool: ContextToolItem, emphasize = false) => {
    const Icon = tool.icon;
    const on = activeTool === tool.id;
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => onTool(tool.id)}
        className={cn(
          'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors',
          on ? 'bg-white text-neutral-900' : 'text-white/95 hover:bg-white/10',
          emphasize && !on ? 'bg-white/[0.08]' : null,
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="whitespace-nowrap">{tool.label}</span>
      </button>
    );
  };

  const iconBtn = (
    toolId: string,
    Icon: React.ComponentType<{ className?: string }>,
    title: string,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      key={toolId}
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
        active || activeTool === toolId ? 'bg-white text-neutral-900' : 'text-white/90 hover:bg-white/10',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  const divider = (
    <span key="divider" className="mx-0.5 h-5 w-px shrink-0 bg-white/15" aria-hidden="true" />
  );

  return (
    <div
      data-testid="context-toolbar"
      className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3"
    >
      <div className="pointer-events-auto flex max-w-[min(100%,52rem)] items-center gap-0.5 overflow-x-auto rounded-xl border border-white/10 bg-[#252627] px-1.5 py-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {setId === 'text' ? (
          <>
            <label className="sr-only" htmlFor="desktop-font-family">Font</label>
            <select
              id="desktop-font-family"
              value={fontFamily}
              onChange={(event) => paint({ fontFamily: event.target.value })}
              className="h-8 max-w-[9.5rem] shrink-0 truncate rounded-lg border-0 bg-white/10 px-2 text-[12px] font-medium text-white outline-none hover:bg-white/15"
              style={{ fontFamily }}
            >
              {!TEXT_INLINE_FONTS.includes(fontFamily) ? (
                <option value={fontFamily}>{fontFamily}</option>
              ) : null}
              {TEXT_INLINE_FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
              ))}
            </select>
            <div className="flex h-8 items-center rounded-lg bg-white/10">
              <button
                type="button"
                aria-label="Decrease font size"
                className="grid h-8 w-7 place-items-center text-white/80 hover:text-white"
                onClick={() => paint({ fontSize: Math.max(8, fontSize - 1) })}
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                aria-label="Font size"
                type="number"
                min={8}
                max={400}
                value={fontSize}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next)) paint({ fontSize: Math.min(400, Math.max(8, next)) });
                }}
                className="h-8 w-10 border-0 bg-transparent text-center text-[12px] font-semibold tabular-nums text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                aria-label="Increase font size"
                className="grid h-8 w-7 place-items-center text-white/80 hover:text-white"
                onClick={() => paint({ fontSize: Math.min(400, fontSize + 1) })}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {divider}
            <label className="sr-only" htmlFor="desktop-text-color">Colour</label>
            <input
              id="desktop-text-color"
              type="color"
              value={fillHex}
              onChange={(event) => paint({ fill: event.target.value })}
              className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-white/20 bg-transparent p-0.5"
              title="Colour"
            />
            {iconBtn('format-bold', Bold, 'Bold', boldOn, () => paint({ fontWeight: boldOn ? 'normal' : 'bold' }))}
            {iconBtn(
              'format-italic',
              Italic,
              'Italic',
              String(selected?.fontStyle || '') === 'italic',
              () => paint({ fontStyle: selected?.fontStyle === 'italic' ? 'normal' : 'italic' }),
            )}
            {iconBtn(
              'format-underline',
              Underline,
              'Underline',
              !!selected?.underline,
              () => paint({ underline: !selected?.underline }),
            )}
            {iconBtn('align-left', AlignLeft, 'Align left', selected?.textAlign === 'left', () => paint({ textAlign: 'left' }))}
            {iconBtn(
              'align-center',
              AlignCenter,
              'Align center',
              selected?.textAlign === 'center' || !selected?.textAlign,
              () => paint({ textAlign: 'center' }),
            )}
            {iconBtn('align-right', AlignRight, 'Align right', selected?.textAlign === 'right', () => paint({ textAlign: 'right' }))}
            {divider}
            {textTools.map((tool) => pill(tool))}
          </>
        ) : null}

        {setId === 'image' ? (
          <>
            {imagePrimary.map((tool) => pill(tool, true))}
            {divider}
            {imageRest.map((tool) => pill(tool))}
          </>
        ) : null}

        {setId !== 'text' && setId !== 'image' ? tools.map((tool) => pill(tool)) : null}
      </div>
    </div>
  );
}
