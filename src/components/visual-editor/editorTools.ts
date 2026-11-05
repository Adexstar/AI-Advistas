export type ToolSetId = 'create' | 'text' | 'image' | 'video' | 'shape' | 'multi';

type Selectable = { type?: string } | null | undefined;

/** Which bottom-rail tool set matches the object currently selected on the canvas. */
export function selectionToolSet(selected: Selectable): ToolSetId {
  if (!selected?.type) return 'create';
  const type = String(selected.type).toLowerCase();
  if (type === 'activeselection') return 'multi';
  if (type === 'textbox' || type === 'text' || type === 'i-text') return 'text';
  if (type === 'image') return 'image';
  if (type === 'video') return 'video';
  if (type === 'rect' || type === 'circle' || type === 'ellipse' || type === 'triangle' || type === 'polygon' || type === 'line') return 'shape';
  if (type === 'group') return 'multi';
  return 'create';
}

/** Controls shown while a layer is selected. Each one changes that layer. */
export const SELECTION_ACTIONS: Record<Exclude<ToolSetId, 'create'>, { id: string; label: string }[]> = {
  text: [
    { id: 'edit-text', label: 'Edit' },
    { id: 'font', label: 'Font' },
    { id: 'text-style', label: 'Styles' },
    { id: 'font-size', label: 'Size' },
    { id: 'colour', label: 'Colour' },
    { id: 'opacity', label: 'Opacity' },
  ],
  image: [
    { id: 'replace', label: 'Replace' },
    { id: 'flip', label: 'Flip' },
    { id: 'crop', label: 'Crop' },
    { id: 'adjust', label: 'Adjust' },
    { id: 'position', label: 'Position' },
    { id: 'opacity', label: 'Opacity' },
  ],
  shape: [
    { id: 'fill', label: 'Colour' },
    { id: 'border', label: 'Stroke' },
    { id: 'radius', label: 'Corners' },
    { id: 'flip', label: 'Flip' },
    { id: 'position', label: 'Position' },
    { id: 'opacity', label: 'Opacity' },
  ],
  video: [
    { id: 'position', label: 'Position' },
    { id: 'opacity', label: 'Opacity' },
  ],
  multi: [
    { id: 'position', label: 'Position' },
    { id: 'align', label: 'Align' },
    { id: 'opacity', label: 'Opacity' },
  ],
};
