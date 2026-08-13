// Resilient template → canvas loader.
//
// Stored templates carry unresolved variable placeholders in image `src`
// fields (e.g. `{{product_image}}`). Fabric v6's `loadFromJSON` rejects the
// whole document when a single image fails to load, which is why templates
// used to fall back to a blank canvas. This module sanitizes the JSON first
// (swapping unloadable images for an editable placeholder) and, if the bulk
// load still fails, enlivens objects one by one so a bad layer can never take
// the whole design down.

import { util } from 'fabric';
import type { Canvas as FabricCanvas } from 'fabric';

type AnyObj = Record<string, any>;

const UNRESOLVED = /\{\{\s*[^}]+\s*\}\}/;

export const makePlaceholderImage = (width = 400, height = 400, label = 'Image') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(
    2,
    Math.round(width),
  )}" height="${Math.max(2, Math.round(height))}" viewBox="0 0 ${Math.max(2, Math.round(width))} ${Math.max(
    2,
    Math.round(height),
  )}">
  <rect width="100%" height="100%" fill="#e9eaee"/>
  <rect x="4" y="4" width="${Math.max(2, Math.round(width) - 8)}" height="${Math.max(
    2,
    Math.round(height) - 8,
  )}" fill="none" stroke="#b9bcc6" stroke-width="4" stroke-dasharray="14 10"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${Math.max(
    14,
    Math.round(Math.min(width, height) / 10),
  )}" fill="#8a8f9c">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const isImage = (o: AnyObj) => String(o?.type ?? '').toLowerCase() === 'image';

const CLOUD_NAME = (import.meta as any)?.env?.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;

/**
 * Normalises whatever a template stored in `src` into something the browser
 * can actually fetch: absolute URLs pass through, Cloudinary public ids get
 * expanded, relative paths become origin-absolute.
 */
export const resolveImageSrc = (raw: unknown): string | null => {
  const src = typeof raw === 'string' ? raw.trim() : '';
  if (!src || UNRESOLVED.test(src)) return null;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return src; // app-relative asset
  if (CLOUD_NAME) return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${src.replace(/^\/+/, '')}`;
  return `/${src.replace(/^\/+/, '')}`;
};

const sanitizeObject = (o: AnyObj, fallbackImageSrc?: string): AnyObj => {
  const next: AnyObj = { ...o };

  if (isImage(next)) {
    const resolved = resolveImageSrc(next.src) ?? (fallbackImageSrc ? resolveImageSrc(fallbackImageSrc) : null);
    if (!resolved) {
      const w = Number(next.width) || 400;
      const h = Number(next.height) || 400;
      next.src = makePlaceholderImage(w, h, next.name ? String(next.name) : 'Image');
      next.isPlaceholder = true;
    } else {
      next.src = resolved;
      if (/^https?:/i.test(resolved)) next.crossOrigin = next.crossOrigin ?? 'anonymous';
    }
  }

  if (typeof next.text === 'string' && UNRESOLVED.test(next.text)) {
    // Leave the layer editable but readable instead of showing raw mustaches.
    next.text = next.text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, k: string) =>
      String(k).split('.').pop()!.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    );
  }

  if (Array.isArray(next.objects)) next.objects = next.objects.map((c: AnyObj) => sanitizeObject(c, fallbackImageSrc));
  return next;
};

export const sanitizeTemplateJSON = (json: AnyObj, fallbackImageSrc?: string): AnyObj => ({
  ...json,
  objects: Array.isArray(json?.objects) ? json.objects.map((o) => sanitizeObject(o, fallbackImageSrc)) : [],
});


export interface ImageLayerStatus {
  id: string;
  name: string;
  src: string;
  status: 'loading' | 'loaded' | 'failed';
  attempts: number;
}

export type ImageStatusListener = (status: ImageLayerStatus) => void;

export interface LoadResult {
  loaded: number;
  skipped: number;
  degraded: boolean;
  images: ImageLayerStatus[];
}

const loadImage = (src: string, timeout = 8000) =>
  new Promise<boolean>((resolve) => {
    const img = new Image();
    const done = (ok: boolean) => {
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };
    img.crossOrigin = 'anonymous';
    img.onload = () => done(true);
    img.onerror = () => done(false);
    setTimeout(() => done(false), timeout);
    img.src = src;
  });

const bust = (src: string, attempt: number) => {
  if (attempt === 0 || /^data:/i.test(src)) return src;
  return `${src}${src.includes('?') ? '&' : '?'}_r=${attempt}`;
};

/** Loads with retries (exponential-ish backoff) before giving up on a layer. */
const loadWithRetry = async (src: string, attempts = 3): Promise<{ ok: boolean; tries: number }> => {
  for (let i = 0; i < attempts; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await loadImage(bust(src, i));
    if (ok) return { ok: true, tries: i + 1 };
    // eslint-disable-next-line no-await-in-loop
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return { ok: false, tries: attempts };
};

/** Verifies remote images actually load; swaps in a placeholder when they don't. */
const preflightImages = async (
  json: AnyObj,
  onStatus?: ImageStatusListener,
): Promise<{ json: AnyObj; images: ImageLayerStatus[] }> => {
  const images: ImageLayerStatus[] = [];

  const objects = await Promise.all(
    ((json.objects ?? []) as AnyObj[]).map(async (o, idx) => {
      if (!isImage(o) || o.isPlaceholder || !/^https?:/i.test(String(o.src ?? ''))) return o;
      const src = String(o.src);
      const entry: ImageLayerStatus = {
        id: String(o.id ?? `img-${idx}`),
        name: String(o.name ?? `Image ${idx + 1}`),
        src,
        status: 'loading',
        attempts: 0,
      };
      images.push(entry);
      onStatus?.({ ...entry });

      const { ok, tries } = await loadWithRetry(src);
      entry.attempts = tries;
      entry.status = ok ? 'loaded' : 'failed';
      onStatus?.({ ...entry });
      if (ok) return { ...o, layerId: entry.id };
      return {
        ...o,
        layerId: entry.id,
        failedSrc: src,
        src: makePlaceholderImage(Number(o.width) || 400, Number(o.height) || 400, o.name ? String(o.name) : 'Image'),
        isPlaceholder: true,
      };
    }),
  );
  return { json: { ...json, objects }, images };
};

/**
 * Re-attempts every layer whose image failed to load. Placeholder art is swapped
 * back to the real image on success; failures stay visible and retryable.
 */
export async function retryFailedImages(
  canvas: FabricCanvas,
  onStatus?: ImageStatusListener,
): Promise<{ recovered: number; stillFailing: number }> {
  const targets = canvas.getObjects().filter((o: any) => o?.failedSrc);
  let recovered = 0;
  for (const obj of targets as any[]) {
    const src = String(obj.failedSrc);
    const base: ImageLayerStatus = {
      id: String(obj.layerId ?? obj.name ?? 'image'),
      name: String(obj.name ?? 'Image'),
      src,
      status: 'loading',
      attempts: 0,
    };
    onStatus?.({ ...base });
    // eslint-disable-next-line no-await-in-loop
    const { ok, tries } = await loadWithRetry(src, 2);
    if (ok) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await obj.setSrc(src, { crossOrigin: 'anonymous' });
        obj.isPlaceholder = false;
        delete obj.failedSrc;
        recovered += 1;
        onStatus?.({ ...base, status: 'loaded', attempts: tries });
      } catch {
        onStatus?.({ ...base, status: 'failed', attempts: tries });
      }
    } else {
      onStatus?.({ ...base, status: 'failed', attempts: tries });
    }
  }
  canvas.requestRenderAll();
  return { recovered, stillFailing: targets.length - recovered };
}

/** Clears the canvas and loads a (sanitized) template JSON into it. */
export async function loadTemplateJSONIntoCanvas(
  canvas: FabricCanvas,
  rawJson: AnyObj,
  options: { fallbackImageSrc?: string; onImageStatus?: ImageStatusListener } = {},
): Promise<LoadResult> {
  const { json, images } = await preflightImages(
    sanitizeTemplateJSON(rawJson, options.fallbackImageSrc),
    options.onImageStatus,
  );

  try {
    await canvas.loadFromJSON(json);
    return { loaded: canvas.getObjects().length, skipped: 0, degraded: false, images };
  } catch (err) {
    console.warn('[templates] bulk load failed, falling back to per-object enliven', err);
  }

  // Degraded path — never let one broken layer blank the design.
  canvas.clear();
  if (typeof json.background === 'string') canvas.backgroundColor = json.background;

  let skipped = 0;
  for (const obj of (json.objects ?? []) as AnyObj[]) {
    try {
      const [live] = await util.enlivenObjects([obj as any]);
      if (live) {
        (live as any).failedSrc = (obj as any).failedSrc;
        (live as any).layerId = (obj as any).layerId;
        canvas.add(live as any);
      }
    } catch (e) {
      skipped += 1;
      console.warn('[templates] skipped layer', obj?.name ?? obj?.type, e);
    }
  }
  canvas.requestRenderAll();
  return { loaded: canvas.getObjects().length, skipped, degraded: true, images };
}

