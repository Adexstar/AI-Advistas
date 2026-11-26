/** Bottom create rail. Uploads opens the device picker. AI entries are reserved slots. */
export const CREATE_RAIL = [
  { id: 'templates', label: 'Templates' },
  { id: 'elements', label: 'Elements' },
  { id: 'text', label: 'Text' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'brand', label: 'Brand' },
  { id: 'tools', label: 'Tools' },
  { id: 'projects', label: 'Projects' },
  { id: 'background', label: 'Background' },
  { id: 'studio-slot', label: 'AI Studio' },
] as const;

/** Shown on the mobile rail only while the design is a video. */
export const VIDEO_RAIL = [
  { id: 'ai-voice', label: 'AI Voice' },
  { id: 'captions', label: 'Captions' },
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

/** Camera roll and Tools stay as aliases so older entry points still open a real panel. */
export function panelForCreateTool(id: string) {
  if (id === 'camera') return 'uploads';
  if (id === 'tools') return 'tools';
  // Mobile rail "AI Studio" and desktop left rail share the same left-panel tab.
  if (id === 'studio-slot') return 'ai-studio';
  return id;
}

export const ELEMENT_CATEGORIES = [
  { id: 'audio', label: 'Audio', items: [] as string[] },
  { id: 'videos', label: 'Videos', items: [] as string[] },
  { id: 'photos', label: 'Photos', items: [] as string[] },
  { id: 'graphics', label: 'Graphics', items: ['star', 'badge', 'blob'] },
  { id: 'shapes', label: 'Shapes', items: ['rectangle', 'rounded', 'circle', 'triangle', 'line'] },
  { id: 'frames', label: 'Frames', items: ['frame-square', 'frame-circle', 'frame-torn', 'frame-blob', 'frame-device', 'frame-arch'] },
  { id: 'grids', label: 'Grids', items: ['grid-2', 'grid-3', 'grid-4', 'grid-6', 'grid-8', 'grid-9'] },
  { id: 'mockups', label: 'Mockups', items: ['mock-phone', 'mock-browser'] },
  { id: 'animations', label: 'Animations', items: ['anim-fade', 'anim-rise', 'anim-pop'] },
] as const;

export const ELEMENT_LABELS: Record<string, string> = {
  rectangle: 'Rectangle',
  rounded: 'Rounded',
  circle: 'Circle',
  triangle: 'Triangle',
  line: 'Line',
  star: 'Star',
  badge: 'Badge bar',
  blob: 'Blob',
  'frame-square': 'Square frame',
  'frame-circle': 'Circle frame',
  'frame-torn': 'Torn paper',
  'frame-blob': 'Blob frame',
  'frame-device': 'Device frame',
  'frame-arch': 'Arch frame',
  'grid-2': '2 slots',
  'grid-3': '3 slots',
  'grid-4': '4 slots',
  'grid-6': '6 slots',
  'grid-8': '8 slots',
  'grid-9': '9 slots',
  'mock-phone': 'Phone',
  'mock-browser': 'Browser',
  'anim-fade': 'Fade',
  'anim-rise': 'Rise',
  'anim-pop': 'Pop',
};
