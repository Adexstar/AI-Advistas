/** Mobile create rail. Each id opens a sheet that changes the canvas or a saved design. */
export const CREATE_RAIL = [
  { id: 'templates', label: 'Templates' },
  { id: 'elements', label: 'Elements' },
  { id: 'text', label: 'Text' },
  { id: 'camera', label: 'Camera Roll' },
  { id: 'brand', label: 'Brand' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'tools', label: 'Tools' },
] as const;

export type CreateToolId = (typeof CREATE_RAIL)[number]['id'];

/** Extra editor areas reached from the Tools sheet. */
export const EDITOR_TOOLS = [
  { id: 'background', label: 'Background', hint: 'Colour the canvas' },
  { id: 'layers', label: 'Layers', hint: 'Reorder, hide, and lock layers' },
  { id: 'ai-studio', label: 'AI Studio', hint: 'Generate an image from a prompt' },
  { id: 'projects', label: 'Projects', hint: 'Open a saved design' },
  { id: 'media', label: 'Media', hint: 'Photos and video in your library' },
] as const;

export type TextStyle = {
  id: string;
  label: string;
  text: string;
  size: number;
  weight: string;
  fontFamily: string;
};

export const TEXT_STYLES: TextStyle[] = [
  { id: 'box', label: 'Add a text box', text: 'Your headline', size: 36, weight: '700', fontFamily: 'Outfit' },
  { id: 'heading', label: 'Add a heading', text: 'Add a heading', size: 36, weight: '700', fontFamily: 'Outfit' },
  { id: 'sub', label: 'Add a subheading', text: 'Add a subheading', size: 22, weight: '600', fontFamily: 'Figtree' },
  { id: 'body', label: 'Add a little bit of body text', text: 'Add a little bit of body text', size: 16, weight: '400', fontFamily: 'Figtree' },
];

export const FONT_COMBOS: TextStyle[] = [
  { id: 'offer', label: 'Limited offer', text: 'Limited offer', size: 32, weight: '700', fontFamily: 'Outfit' },
  { id: 'story', label: 'Your story', text: 'Your story', size: 28, weight: '500', fontFamily: 'Georgia' },
  { id: 'shop', label: 'Shop the drop', text: 'Shop the drop', size: 26, weight: '700', fontFamily: 'Figtree' },
  { id: 'order', label: 'Order now', text: 'Order now', size: 30, weight: '800', fontFamily: 'Outfit' },
];

export function matchTextStyle(query: string, item: TextStyle) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.label, item.text, item.fontFamily].some((part) => part.toLowerCase().includes(q));
}

/** Camera roll and Tools are sheet entry points, not separate canvas object types. */
export function panelForCreateTool(id: string) {
  if (id === 'camera') return 'uploads';
  if (id === 'tools') return 'tools';
  return id;
}

export const ELEMENT_CATEGORIES = [
  { id: 'shapes', label: 'Shapes', items: ['rectangle', 'rounded', 'circle', 'triangle', 'line', 'star'] },
  { id: 'frames', label: 'Frames', items: ['frame', 'badge'] },
  { id: 'grids', label: 'Grids', items: ['grid-2', 'grid-3', 'grid-hero'] },
  { id: 'photos', label: 'Photos', items: [] as string[] },
] as const;

export const ELEMENT_LABELS: Record<string, string> = {
  rectangle: 'Rectangle',
  rounded: 'Rounded',
  circle: 'Circle',
  triangle: 'Triangle',
  line: 'Line',
  star: 'Star',
  badge: 'Badge bar',
  frame: 'Frame',
  'grid-2': 'Two columns',
  'grid-3': 'Three columns',
  'grid-hero': 'Hero and caption',
};
