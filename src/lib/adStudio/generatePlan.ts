// Writes the ad plan with the same text-model function Studio Video uses
// (`enhance-prompt`, shot-list mode). With no key it returns a labelled
// fallback so the flow still works end to end. Real failures are thrown.

import { supabase } from '@/integrations/supabase/client';
import { readEdgeError } from '@/services/edgeError';
import { parseShotPlan, splitDuration } from '@/components/visual-editor/studio/adVideoPlan';
import { formatById } from './formats';
import { MAX_SCENES, MIN_SCENES, arcFor, fallbackPlan, planFromShots, deriveProduct, findOffer, type PlanInput, type StudioPlan } from './plan';

export class PlanError extends Error {}

const KEY_MISSING = /(add\s+[A-Z_]*API_KEY|not configured|API_KEY|GROQ|OPENAI|GEMINI|ANTHROPIC|LOVABLE)/i;

export function briefFor(input: PlanInput, sceneCount: number): string {
  const product = deriveProduct(input.prompt, input.brandName);
  const offer = findOffer(input.prompt);
  const types = arcFor(input.style, sceneCount).join(', ');
  const lines = [
    input.prompt.trim() || `An ad for ${product}.`,
    `Use exactly ${sceneCount} shots. Scene order: ${types}.`,
    'Each onScreenText is at most six words, in the voice of the ad.',
  ];
  if (offer) lines.push(`Offer to include: ${offer}.`);
  if (input.brandName) lines.push(`Brand: ${input.brandName}.`);
  if (input.style) lines.push(`Style: ${input.style.name}. ${input.style.direction} Pacing: ${input.style.pacing}. Text: ${input.style.textStyle}.`);
  return lines.join('\n');
}

/**
 * `textModel: false` means the provider check says no text key is set. The
 * model is then not called at all (it would spend plan quota for nothing) and
 * the labelled fallback plan is returned.
 */
export async function generatePlan(input: PlanInput, options: { textModel?: boolean } = {}): Promise<StudioPlan> {
  if (options.textModel === false) return fallbackPlan(input);
  const format = formatById(input.formatId);
  const count = Math.min(MAX_SCENES, Math.max(MIN_SCENES, arcFor(input.style, format.kind === 'video' ? (input.length <= 5 ? 3 : input.length <= 10 ? 4 : 5) : format.defaultScenes).length));
  const duration = format.kind === 'video' ? input.length || 15 : 10;
  const references = input.imageUrls.filter((url) => url.startsWith('http')).slice(0, 4);

  const { data, error } = await supabase.functions.invoke('enhance-prompt', {
    body: {
      format: 'shots',
      mode: 'video',
      prompt: briefFor(input, count),
      category: 'generic',
      duration,
      aspect: input.ratio,
      references,
    },
  });

  if (error) {
    const message = await readEdgeError(error, 'The plan could not be written.');
    // A missing key is not a failure. Everything else is.
    if (KEY_MISSING.test(message)) return fallbackPlan(input);
    throw new PlanError(message);
  }

  const parsed = typeof data?.prompt === 'string' ? parseShotPlan(data.prompt) : null;
  if (!parsed) {
    const message = typeof data?.error === 'string' ? data.error : '';
    if (message && !KEY_MISSING.test(message)) throw new PlanError(message);
    // The model answered with something unusable. Say so instead of hiding it.
    const fallback = fallbackPlan(input);
    return { ...fallback, note: 'The text model did not return a usable plan, so this is the fallback plan built from your description.' };
  }

  const parts = splitDuration(duration, Math.min(MAX_SCENES, parsed.shots.length));
  const shots = parsed.shots.slice(0, parts.length).map((shot, index) => ({
    text: String(shot.onScreenText ?? shot.text ?? '').replace(/\s+/g, ' ').trim(),
    action: typeof shot.action === 'string' ? shot.action.trim() : '',
    duration: parts[index],
  }));
  const plan = planFromShots(input, shots);
  if (!plan) throw new PlanError('The plan came back with too few scenes.');
  return plan;
}
