// Maps a structured layout from the text model onto the editor's Fabric
// document. The result is layers: a background, an image or shape, real
// text, and a button. It is never a single flattened picture.

import type { FabricTemplateJSON } from './types';

export interface LayoutSpec {
  width: number;
  height: number;
  background: string;
  accent: string;
  text: string;
  muted: string;
  headline: string;
  subtext: string;
  cta: string;
  imageUrl?: string;
}

export const TEMPLATE_FORMATS = [
  { id: 'post', label: 'Post 1:1', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait 4:5', width: 1080, height: 1350 },
  { id: 'story', label: 'Story 9:16', width: 1080, height: 1920 },
  { id: 'banner', label: 'Banner 16:9', width: 1920, height: 1080 },
] as const;

export type TemplateFormatId = (typeof TEMPLATE_FORMATS)[number]['id'];

const HEX = /^#[0-9a-fA-F]{6}$/;

function colour(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX.test(value.trim()) ? value.trim() : fallback;
}

function line(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text.slice(0, 80) || fallback;
}

export function normalizeLayout(raw: unknown, size: { width: number; height: number }): LayoutSpec {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    width: size.width,
    height: size.height,
    background: colour(source.background, '#141414'),
    accent: colour(source.accent, '#6E56F5'),
    text: colour(source.text, '#F5F5F5'),
    muted: colour(source.muted, '#C8C8C8'),
    headline: line(source.headline, 'Headline'),
    subtext: line(source.subtext, 'A short line under the headline.'),
    cta: line(source.cta, 'Learn more'),
    imageUrl: typeof source.imageUrl === 'string' && source.imageUrl.startsWith('http') ? source.imageUrl : undefined,
  };
}

export function layoutToFabric(spec: LayoutSpec): FabricTemplateJSON {
  const W = spec.width;
  const H = spec.height;
  const pad = Math.round(W * 0.06);
  const heroH = Math.round(H * 0.46);
  const heroY = Math.round(H * 0.08);
  const objects: FabricTemplateJSON['objects'] = [
    {
      type: 'rect', left: 0, top: 0, width: W, height: H,
      fill: spec.background, selectable: false, evented: false,
    },
  ];

  if (spec.imageUrl) {
    objects.push({
      type: 'image',
      left: pad, top: heroY, width: W - pad * 2, height: heroH,
      src: spec.imageUrl,
      variableKey: 'hero_image',
      aiReplaceable: true, brandReplaceable: true, editable: true,
    });
  } else {
    objects.push({
      type: 'rect',
      left: pad, top: heroY, width: W - pad * 2, height: heroH,
      fill: spec.accent, rx: 24, ry: 24, opacity: 0.9,
      editable: true,
    });
  }

  const headlineY = heroY + heroH + Math.round(H * 0.04);
  objects.push({
    type: 'textbox',
    left: pad, top: headlineY, width: W - pad * 2,
    text: spec.headline,
    fill: spec.text,
    fontFamily: 'Inter',
    fontSize: Math.round(W * 0.055),
    fontWeight: '700',
    variableKey: 'headline',
    aiReplaceable: true, editable: true,
  });
  objects.push({
    type: 'textbox',
    left: pad, top: headlineY + Math.round(W * 0.08), width: W - pad * 2,
    text: spec.subtext,
    fill: spec.muted,
    fontFamily: 'Inter',
    fontSize: Math.round(W * 0.028),
    variableKey: 'subheadline',
    aiReplaceable: true, editable: true,
  });

  const btnW = Math.round(W * 0.42);
  const btnH = Math.round(Math.min(H * 0.07, 84));
  const btnY = H - pad - btnH;
  objects.push({
    type: 'rect',
    left: pad, top: btnY, width: btnW, height: btnH,
    fill: spec.accent, rx: btnH / 2, ry: btnH / 2,
    editable: true,
  });
  objects.push({
    type: 'textbox',
    left: pad, top: btnY + Math.round(btnH * 0.28), width: btnW,
    text: spec.cta,
    fill: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: Math.round(W * 0.028),
    fontWeight: '600',
    textAlign: 'center',
    variableKey: 'cta',
    aiReplaceable: true, editable: true,
  });

  return { version: '5.3.0', background: spec.background, objects, width: W, height: H };
}
