// Builds the real design for an approved plan, off screen, using the same
// Fabric objects, clip data and serialisation the editor uses. Photo formats
// become one page per image. Video formats become stills and text layers on
// the timeline, the same output as Studio Video.

import { Canvas, FabricImage, Gradient, Rect, Textbox } from 'fabric';
import { scaleImageToCover } from '@/components/visual-editor/canvasImagePlacement';
import { ensureObjectClip, placeDirectorSequence, writeClip } from '@/components/visual-editor/placeMedia';
import { formatById, sizeFor } from './formats';
import { sceneStarts, totalSeconds, type Scene, type StudioPlan } from './plan';

/** Same list the editor serialises with, so a saved design reopens unchanged. */
export const SERIALIZED_PROPS = ['id', 'name', 'mediaFit', 'variableKey', 'brandReplaceable', 'aiReplaceable', 'brandCompliant', 'perPixelTargetFind', 'advistaClip', 'advistaKind', 'advistaFrame', 'advistaId', 'advistaName'];

export interface BrandContext {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  logoUrl: string | null;
  fontFamily?: string | null;
}

export interface ComposeInput {
  plan: StudioPlan;
  brand: BrandContext | null;
}

export interface Composed {
  width: number;
  height: number;
  pages: Record<string, unknown>[];
  previews: string[];
  notes: string[];
}

type Obj = Record<string, any>;

const DARK = '#0f0f14';
const SOFT = '#c9c9d4';

const isHex = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value.trim());
const accentOf = (brand: BrandContext | null) => (brand && isHex(brand.accent) ? brand.accent : brand && isHex(brand.primary) ? brand.primary : '#6E56F5');
const secondaryOf = (brand: BrandContext | null) => (brand && isHex(brand.secondary) ? brand.secondary : '#3b2a8f');
/** The app's own loaded face. Used whenever a brand font is missing or cannot load. */
const DEFAULT_FONT = 'Figtree';

let resolvedFont = DEFAULT_FONT;
const fontOf = (_brand: BrandContext | null) => resolvedFont;

/** `document.fonts.check` is true for unknown families, so measure against two fallbacks instead. */
function isDrawable(family: string): boolean {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return false;
  const sample = 'mmmmmmmmmwwwwiiiilll 0123456789';
  const width = (font: string) => {
    context.font = `700 40px ${font}`;
    return context.measureText(sample).width;
  };
  return width(`"${family}", monospace`) !== width('monospace') || width(`"${family}", serif`) !== width('serif');
}

/**
 * Picks a font that is really available to the canvas. An unloaded family would
 * silently draw in the browser's serif default.
 */
async function resolveFont(brand: BrandContext | null): Promise<void> {
  const wanted = [brand?.fontFamily?.trim(), DEFAULT_FONT].filter(Boolean) as string[];
  resolvedFont = DEFAULT_FONT;
  if (typeof document === 'undefined' || !document.fonts) return;
  for (const family of wanted) {
    try {
      await document.fonts.load(`700 24px "${family}"`);
      if (isDrawable(family)) {
        resolvedFont = family;
        return;
      }
    } catch {
      /* try the next one */
    }
  }
}

async function loadImage(url: string): Promise<FabricImage | null> {
  try {
    return await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
  } catch {
    return null;
  }
}

function name(object: Obj, label: string) {
  object.name = label;
  object.advistaName = label;
  return object;
}

function placeholderFill(width: number, height: number, brand: BrandContext | null) {
  return new Gradient({
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: width, y2: height },
    colorStops: [
      { offset: 0, color: accentOf(brand) },
      { offset: 1, color: secondaryOf(brand) },
    ],
  });
}

/** Image covering a region, clipped to it so nothing spills. Falls back to a brand-colour block. */
async function addRegion(canvas: Canvas, url: string | undefined, region: { left: number; top: number; width: number; height: number }, brand: BrandContext | null, withImages: boolean) {
  const image = withImages && url ? await loadImage(url) : null;
  if (!image) {
    const block = new Rect({ ...region, fill: placeholderFill(region.width, region.height, brand), selectable: true });
    canvas.add(name(block as Obj, 'Image area') as Rect);
    return;
  }
  scaleImageToCover(image as Obj as never, region);
  image.set({
    mediaFit: 'cover',
    clipPath: new Rect({ ...region, absolutePositioned: true }),
  } as Obj);
  canvas.add(name(image as Obj, 'Product image') as FabricImage);
}

async function addLogo(canvas: Canvas, brand: BrandContext | null, size: number, left: number, top: number, withImages: boolean) {
  if (!withImages || !brand?.logoUrl) return;
  const logo = await loadImage(brand.logoUrl);
  if (!logo) return;
  const scale = Math.min(size / Math.max(1, Number(logo.width) || 1), size / Math.max(1, Number(logo.height) || 1));
  logo.set({ left, top, scaleX: scale, scaleY: scale });
  canvas.add(name(logo as Obj, 'Logo') as FabricImage);
}

interface PageCopy {
  label?: string;
  headline: string;
  support?: string;
  cta?: string;
  imageUrl?: string;
}

async function buildPage(width: number, height: number, copy: PageCopy, brand: BrandContext | null, withImages: boolean) {
  const canvas = new Canvas(document.createElement('canvas'), { width, height, backgroundColor: DARK, renderOnAddRemove: false });
  const landscape = width / height > 1.3;
  const pad = Math.round(Math.min(width, height) * 0.07);
  const region = landscape
    ? { left: 0, top: 0, width: Math.round(width * 0.5), height }
    : { left: 0, top: 0, width, height: Math.round(height * (height / width >= 1.2 ? 0.56 : 0.48)) };
  const textLeft = landscape ? region.width + pad : pad;
  const textWidth = landscape ? width - textLeft - pad : width - pad * 2;
  let cursor = landscape ? pad * 1.6 : region.height + pad;
  const font = fontOf(brand);
  const base = Math.round(Math.min(width, height) * (landscape ? 0.07 : 0.066));

  await addRegion(canvas, copy.imageUrl, region, brand, withImages);
  await addLogo(canvas, brand, Math.round(Math.min(width, height) * 0.12), pad, pad, withImages);

  if (copy.label) {
    const label = new Textbox(copy.label.toUpperCase(), {
      left: textLeft, top: cursor, width: textWidth, fontFamily: font, fontSize: Math.round(base * 0.38),
      fontWeight: '700', fill: accentOf(brand), charSpacing: 120,
    });
    canvas.add(name(label as Obj, 'Label') as Textbox);
    cursor += (label.height || 0) + Math.round(base * 0.25);
  }

  const headline = new Textbox(copy.headline, {
    left: textLeft, top: cursor, width: textWidth, fontFamily: font, fontSize: base,
    fontWeight: '800', fill: '#ffffff', lineHeight: 1.1,
  });
  canvas.add(name(headline as Obj, 'Headline') as Textbox);
  cursor += (headline.height || 0) + Math.round(base * 0.3);

  if (copy.support) {
    const support = new Textbox(copy.support, {
      left: textLeft, top: cursor, width: textWidth, fontFamily: font, fontSize: Math.round(base * 0.5),
      fontWeight: '500', fill: SOFT, lineHeight: 1.25,
    });
    canvas.add(name(support as Obj, 'Supporting line') as Textbox);
    cursor += (support.height || 0) + Math.round(base * 0.5);
  }

  if (copy.cta) {
    const size = Math.round(base * 0.5);
    const buttonHeight = Math.round(size * 2.3);
    const buttonWidth = Math.min(textWidth, Math.max(Math.round(width * 0.34), Math.round(copy.cta.length * size * 0.62 + pad)));
    const top = Math.min(cursor, height - pad - buttonHeight);
    const button = new Rect({ left: textLeft, top, width: buttonWidth, height: buttonHeight, rx: buttonHeight / 2, ry: buttonHeight / 2, fill: accentOf(brand) });
    const label = new Textbox(copy.cta, {
      left: textLeft, top: top + (buttonHeight - size * 1.2) / 2, width: buttonWidth, fontFamily: font, fontSize: size,
      fontWeight: '700', fill: '#ffffff', textAlign: 'center',
    });
    canvas.add(name(button as Obj, 'Button') as Rect);
    canvas.add(name(label as Obj, 'Button text') as Textbox);
  }

  canvas.renderAll();
  return canvas;
}

function exportPage(canvas: Canvas, multiplier: number) {
  // `toJSON` ignores its argument in this Fabric version, so custom props (the timeline clips) would be lost.
  const json = (canvas as Obj).toObject(SERIALIZED_PROPS) as Record<string, unknown>;
  const preview = canvas.toDataURL({ format: 'jpeg', quality: 0.85, multiplier } as Obj);
  return { json, preview };
}

function productOf(plan: StudioPlan) {
  return plan.title.split(' — ')[0] || 'Your product';
}

function photoPages(plan: StudioPlan): PageCopy[] {
  const scenes = plan.scenes;
  if (plan.formatId === 'carousel') {
    return scenes.map((scene, index) => {
      const closing = scene.type === 'Call to action' && index === scenes.length - 1;
      return closing
        ? { label: scene.type, headline: productOf(plan), cta: scene.text || 'Shop now', imageUrl: scene.imageUrl }
        : { label: scene.type, headline: scene.text || scene.type, imageUrl: scene.imageUrl };
    });
  }
  const hook = scenes.find((scene) => scene.type === 'Hook') ?? scenes[0];
  const closing = [...scenes].reverse().find((scene) => scene.type === 'Call to action');
  const middle = scenes.filter((scene) => scene !== hook && scene !== closing && scene.text.trim());
  return [{
    headline: hook?.text || productOf(plan),
    support: middle.slice(0, 2).map((scene) => scene.text.trim()).join(' · ') || undefined,
    cta: closing?.text || 'Shop now',
    imageUrl: scenes.find((scene) => scene.imageUrl)?.imageUrl,
  }];
}

async function composePhoto(input: ComposeInput, size: { width: number; height: number }, withImages: boolean, multiplier: number): Promise<Composed> {
  const pages: Record<string, unknown>[] = [];
  const previews: string[] = [];
  for (const copy of photoPages(input.plan)) {
    const canvas = await buildPage(size.width, size.height, copy, input.brand, withImages);
    const { json, preview } = exportPage(canvas, multiplier);
    pages.push(json);
    previews.push(preview);
    canvas.dispose();
  }
  return { width: size.width, height: size.height, pages, previews, notes: [] };
}

async function composeVideo(input: ComposeInput, size: { width: number; height: number }, withImages: boolean, multiplier: number): Promise<Composed> {
  const { plan, brand } = input;
  const canvas = new Canvas(document.createElement('canvas'), { width: size.width, height: size.height, backgroundColor: DARK, renderOnAddRemove: false });
  const starts = sceneStarts(plan.scenes);
  const total = totalSeconds(plan.scenes);

  for (let index = 0; index < plan.scenes.length; index += 1) {
    const scene: Scene = plan.scenes[index];
    if (!withImages || !scene.imageUrl) continue;
    const image = await loadImage(scene.imageUrl);
    if (!image) continue;
    scaleImageToCover(image as Obj as never, { left: 0, top: 0, width: size.width, height: size.height });
    image.set({ mediaFit: 'cover' } as Obj);
    writeClip(image as Obj, { ...ensureObjectClip(image as Obj), kind: 'image', start: starts[index], duration: scene.duration, sourceDuration: 600 });
    (image as Obj).advistaKind = 'image';
    name(image as Obj, `${scene.type} image`);
    canvas.add(image);
  }

  await addLogo(canvas, brand, Math.round(Math.min(size.width, size.height) * 0.12), Math.round(size.width * 0.06), Math.round(size.height * 0.05), withImages);
  const logo = canvas.getObjects().find((object: Obj) => object.name === 'Logo') as Obj | undefined;
  if (logo) {
    writeClip(logo, { ...ensureObjectClip(logo), kind: 'image', start: 0, duration: Math.max(1, total), sourceDuration: 600 });
    logo.advistaKind = 'image';
  }

  await placeDirectorSequence(canvas, {
    videos: [],
    stills: [],
    titles: plan.scenes.map((scene, index) => ({ text: scene.text, start: starts[index], duration: scene.duration })),
  });
  // The helper names a face that may not be loaded. Use one that is.
  for (const object of canvas.getObjects() as Obj[]) {
    if (object.advistaKind === 'text') object.set({ fontFamily: fontOf(brand) });
  }
  // The first title is selected by the helper. Nothing should be selected in a saved file.
  canvas.discardActiveObject();
  canvas.renderAll();
  const { json } = exportPage(canvas, multiplier);
  canvas.dispose();

  // A still of the opening scene is the thumbnail. Exporting the timeline canvas
  // itself would stack every scene's text on one frame.
  const hook = plan.scenes.find((scene) => scene.type === 'Hook') ?? plan.scenes[0];
  const poster = await buildPage(size.width, size.height, {
    headline: hook?.text || productOf(plan),
    imageUrl: hook?.imageUrl || plan.scenes.find((scene) => scene.imageUrl)?.imageUrl,
  }, brand, withImages);
  const { preview } = exportPage(poster, multiplier);
  poster.dispose();
  return { width: size.width, height: size.height, pages: [json], previews: [preview], notes: [] };
}

/**
 * Builds the pages for a plan. If a picture cannot be read onto the canvas
 * (for example the file blocks cross-origin use), it builds again without
 * pictures and says so, instead of failing the whole ad.
 */
export async function composeAd(input: ComposeInput, multiplier = 0.45): Promise<Composed> {
  const format = formatById(input.plan.formatId);
  const size = sizeFor(format, input.plan.ratio);
  await resolveFont(input.brand);
  const run = (withImages: boolean) => (format.kind === 'video'
    ? composeVideo(input, size, withImages, multiplier)
    : composePhoto(input, size, withImages, multiplier));
  try {
    return await run(true);
  } catch (error) {
    const result = await run(false);
    const reason = error instanceof Error ? error.message : 'A picture could not be used.';
    return { ...result, notes: [`Pictures were left out because one could not be read (${reason}). Add them again in the editor.`] };
  }
}
