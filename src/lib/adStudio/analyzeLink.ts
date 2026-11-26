// Turns a pasted Instagram or TikTok link into style settings. It reads the
// post's public title and caption on the server, then asks the text model to
// describe the style. It never invents a result: with no key, or when the
// functions are not deployed, the style is saved with an honest status.

import { supabase } from '@/integrations/supabase/client';
import { readEdgeError } from '@/services/edgeError';
import { SCENE_TYPES, type SceneType } from './plan';
import { NEEDS_AI_KEY, type AdStyle, type Pacing, type StyleAnalysis } from './styles';
import type { ProviderMap } from './providers';

export interface LinkAnalysis {
  analysis: StyleAnalysis;
  patch?: Partial<Pick<AdStyle, 'pacing' | 'textStyle' | 'middle' | 'direction'>>;
}

const PACING: Pacing[] = ['fast', 'steady', 'slow'];
const MIDDLE_TYPES = SCENE_TYPES.filter((type) => type !== 'Hook' && type !== 'Call to action');

export function parseStyleAnswer(raw: string): LinkAnalysis['patch'] | null {
  const text = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let value: any;
  try {
    value = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  const middle = (Array.isArray(value.sceneOrder) ? value.sceneOrder : [])
    .filter((item: unknown): item is SceneType => typeof item === 'string' && (MIDDLE_TYPES as string[]).includes(item))
    .slice(0, 4);
  const pacing = PACING.includes(value.pacing) ? (value.pacing as Pacing) : null;
  if (!pacing && !middle.length && !value.textStyle) return null;
  return {
    pacing: pacing ?? 'steady',
    textStyle: typeof value.textStyle === 'string' ? value.textStyle.slice(0, 120) : '',
    middle: middle.length >= 2 ? middle : ['Product', 'Benefit', 'Proof', 'Offer'],
    direction: typeof value.direction === 'string' ? value.direction.slice(0, 200) : '',
  };
}

export async function analyzeAdLink(url: string, providers: ProviderMap | undefined): Promise<LinkAnalysis> {
  if (providers?.known && !providers.text) {
    return { analysis: { status: 'needs_ai_key', note: NEEDS_AI_KEY } };
  }

  const post = await supabase.functions.invoke('analyze-ad-link', { body: { url } });
  if (post.error) {
    const message = await readEdgeError(post.error, 'The post could not be read.');
    const status = (post.error as { context?: { status?: number } }).context?.status;
    const missing = status === 404 || /FetchError|RelayError/i.test(post.error.name ?? '') || /not found|failed to send/i.test(message);
    return {
      analysis: {
        status: missing ? 'not_connected' : 'failed',
        note: missing ? 'Link analysis is not connected on this project yet.' : message,
      },
    };
  }

  const caption = [post.data?.title, post.data?.description].filter((part) => typeof part === 'string' && part).join('\n');
  const answer = await supabase.functions.invoke('enhance-prompt', {
    body: { format: 'style', prompt: `Caption and title of the post:\n${caption}` },
  });
  if (answer.error) {
    const message = await readEdgeError(answer.error, 'The style could not be described.');
    if (/API_KEY|not configured|add\s/i.test(message)) return { analysis: { status: 'needs_ai_key', note: NEEDS_AI_KEY } };
    return { analysis: { status: 'failed', note: message } };
  }

  const patch = typeof answer.data?.prompt === 'string' ? parseStyleAnswer(answer.data.prompt) : null;
  if (!patch) return { analysis: { status: 'failed', note: 'The style could not be read from this post.' } };
  return {
    patch,
    analysis: { status: 'ready', note: 'Inferred from the post caption and title. The video itself was not watched.' },
  };
}
