export type ToolSetId = 'create' | 'text' | 'image' | 'video' | 'audio' | 'shape' | 'multi';

type Selectable = { type?: string; advistaKind?: string } | null | undefined;

const PHOTO_IMAGE_ACTIONS = [
  { id: 'edit-image', label: 'Edit' },
  { id: 'replace', label: 'Replace' },
  { id: 'bg-remove', label: 'BG Remover' },
  { id: 'eraser', label: 'Eraser' },
  { id: 'crop', label: 'Crop' },
  { id: 'flip', label: 'Flip' },
  { id: 'border', label: 'Border' },
  { id: 'radius', label: 'Corner' },
  { id: 'opacity', label: 'Transparency' },
  { id: 'animate', label: 'Animate' },
  { id: 'more', label: 'More' },
];

const VIDEO_ACTIONS = [
  { id: 'replace', label: 'Replace' },
  { id: 'split', label: 'Split' },
  { id: 'delete', label: 'Delete' },
  { id: 'duration', label: 'Duration' },
  { id: 'crop', label: 'Crop' },
  { id: 'flip', label: 'Flip' },
  { id: 'adjust', label: 'Adjust' },
  { id: 'filters', label: 'Filters' },
  { id: 'animate', label: 'Animate' },
  { id: 'opacity', label: 'Transparency' },
  { id: 'layers', label: 'Layers' },
  { id: 'position', label: 'Position' },
  { id: 'align', label: 'Align' },
  { id: 'bg-remove', label: 'BG Remover' },
];

/** Which bottom-rail tool set matches the object currently selected on the canvas. */
export function selectionToolSet(selected: Selectable): ToolSetId {
  if (selected?.advistaKind === 'audio') return 'audio';
  if (selected?.advistaKind === 'video') return 'video';
  if (!selected?.type && !selected?.advistaKind) return 'create';
  const type = String(selected?.type ?? '').toLowerCase();
  if (type === 'activeselection') return 'multi';
  if (type === 'textbox' || type === 'text' || type === 'i-text' || selected?.advistaKind === 'text') return 'text';
  if (type === 'image') return 'image';
  if (type === 'video') return 'video';
  if (type === 'audio') return 'audio';
  if (type === 'rect' || type === 'circle' || type === 'ellipse' || type === 'triangle' || type === 'polygon' || type === 'line') return 'shape';
  if (type === 'group') return 'multi';
  return 'create';
}

/** Controls shown while a layer is selected. Each one changes that layer or opens an honest placeholder. */
export const SELECTION_ACTIONS: Record<Exclude<ToolSetId, 'create'>, { id: string; label: string }[]> = {
  text: [
    { id: 'edit-text', label: 'Edit' },
    { id: 'font', label: 'Font' },
    { id: 'font-size', label: 'Font size' },
    { id: 'colour', label: 'Colour' },
    { id: 'format', label: 'Format' },
    { id: 'case', label: 'Case' },
    { id: 'align', label: 'Align' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'opacity', label: 'Transparency' },
    { id: 'effects', label: 'Effects' },
    { id: 'animate', label: 'Animate' },
    { id: 'position', label: 'Position' },
  ],
  image: PHOTO_IMAGE_ACTIONS,
  video: VIDEO_ACTIONS,
  audio: [
    { id: 'volume', label: 'Volume' },
    { id: 'fade', label: 'Fade' },
    { id: 'split', label: 'Split' },
    { id: 'trim', label: 'Trim' },
    { id: 'replace', label: 'Replace' },
    { id: 'delete', label: 'Delete' },
  ],
  shape: [
    { id: 'fill', label: 'Colour' },
    { id: 'border', label: 'Stroke' },
    { id: 'line-style', label: 'Style' },
    { id: 'flip', label: 'Flip' },
    { id: 'radius', label: 'Corners' },
    { id: 'opacity', label: 'Transparency' },
    { id: 'position', label: 'Position' },
    { id: 'layers', label: 'Layers' },
  ],
  multi: [
    { id: 'position', label: 'Position' },
    { id: 'align', label: 'Align' },
    { id: 'opacity', label: 'Transparency' },
    { id: 'delete', label: 'Delete' },
  ],
};
