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
  if (type === 'rect' || type === 'circle' || type === 'ellipse' || type === 'triangle' || type === 'polygon') return 'shape';
  return 'create';
}
