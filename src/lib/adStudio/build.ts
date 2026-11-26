// Building an approved plan: scene pictures (when a key exists), the film for
// video formats (when a key exists), the design itself, and its saved record.
// Anything that cannot run says what is missing instead of pretending.

import { supabase } from '@/integrations/supabase/client';
import { readEdgeError } from '@/services/edgeError';
import { CreativeService, creativeDocument, withDesignMeta } from '@/services/creative/CreativeService';
import { blankPlan, planToPrompt } from '@/components/visual-editor/studio/adVideoPlan';
import { outputSize, renderClip } from '@/components/visual-editor/studio/AdVideoFlow';
import { composeAd, type BrandContext } from './compose';
import { formatById, nearestLength, sizeFor } from './formats';
import { deriveProduct, findOffer, totalSeconds, variationsOf, type StudioPlan } from './plan';
import type { ProviderMap } from './providers';
import type { StudioResult, StudioSession, StudioVariation } from './sessions';

export interface BuildContext {
  userId: string;
  session: StudioSession;
  plan: StudioPlan;
  brand: BrandContext | null;
  providers: ProviderMap;
  onProgress: (percent: number, label: string) => void;
  /** Called as soon as the draft design exists so the session can point at it. */
  onDesign?: (designId: string) => void;
}

export interface BuildOutput {
  plan: StudioPlan;
  result: StudioResult;
}

const KEY_HINT = 'RUNWARE_API_KEY or OPENAI_API_KEY';

function contentFor(session: StudioSession, plan: StudioPlan, status: 'draft' | 'finished', extra: Record<string, unknown> = {}) {
  const format = formatById(plan.formatId);
  return withDesignMeta(
    { adStudio: { sessionId: session.id, formatId: plan.formatId, ratio: plan.ratio }, ...extra },
    {
      designType: format.kind,
      designStatus: status,
      durationSec: format.kind === 'video' ? totalSeconds(plan.scenes) : null,
    },
  );
}

async function generateSceneImages(ctx: BuildContext, plan: StudioPlan, notes: string[]): Promise<StudioPlan> {
  const missing = plan.scenes.filter((scene) => !scene.imageUrl);
  if (!missing.length) return plan;
  if (!ctx.providers.image) {
    notes.push(`Scene pictures need ${KEY_HINT}. Add a product photo or the key. Scenes without a picture use a brand-colour block.`);
    return plan;
  }
  const size = sizeFor(formatById(plan.formatId), plan.ratio);
  const provider = ctx.providers.raw.openai && !ctx.providers.raw.runware ? 'openai' : 'runware';
  const product = deriveProduct(ctx.session.prompt, ctx.brand?.name);
  let done = 0;
  let firstError = '';
  const scenes = [];
  for (const scene of plan.scenes) {
    if (scene.imageUrl) {
      scenes.push(scene);
      continue;
    }
    const { data, error } = await supabase.functions.invoke('generate-ad-image', {
      body: { prompt: scene.visual, product, provider, width: 768, height: Math.round((768 * size.height) / size.width) },
    });
    done += 1;
    ctx.onProgress(8 + Math.round((done / missing.length) * 42), `Making scene ${done} of ${missing.length}…`);
    if (error || typeof data?.imageUrl !== 'string') {
      if (!firstError) firstError = await readEdgeError(error, data?.error || 'No picture was returned.');
      scenes.push(scene);
      // A plan limit will not clear by retrying the other scenes.
      if (/limit reached/i.test(firstError)) {
        scenes.push(...plan.scenes.slice(scenes.length));
        break;
      }
      continue;
    }
    scenes.push({ ...scene, imageUrl: data.imageUrl as string });
  }
  if (firstError) notes.push(`Some scene pictures were not made: ${firstError}`);
  return { ...plan, scenes };
}

async function renderFilm(ctx: BuildContext, plan: StudioPlan, notes: string[]): Promise<string | undefined> {
  if (formatById(plan.formatId).kind !== 'video') return undefined;
  if (!ctx.providers.video) {
    notes.push('Video clips need RUNWARE_API_KEY. The scenes and text are on the timeline, ready for footage.');
    return undefined;
  }
  ctx.onProgress(56, 'Rendering the video…');
  const aspect = (['9:16', '1:1', '16:9'].includes(plan.ratio) ? plan.ratio : '9:16') as '9:16' | '1:1' | '16:9';
  const adPlan = blankPlan({
    name: plan.title,
    productName: deriveProduct(ctx.session.prompt, ctx.brand?.name),
    aspect,
    duration: nearestLength(totalSeconds(plan.scenes)),
    shots: plan.scenes.map((scene) => ({
      id: scene.id, duration: scene.duration, camera: 'Steady', action: scene.visual,
      onScreenText: scene.text, transition: 'cut' as const, frameUrl: scene.imageUrl || '', from: 'model' as const,
    })),
  });
  const first = plan.scenes.find((scene) => scene.imageUrl?.startsWith('http'))?.imageUrl || '';
  try {
    const url = await renderClip(planToPrompt(adPlan), adPlan.duration, first, '', true, outputSize(aspect, '1080p'));
    ctx.onProgress(84, 'Video ready');
    return url;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The video was not created.';
    notes.push(`${message.replace(/[.\s]+$/, '')}. The scenes and text are on the timeline.`);
    return undefined;
  }
}

export async function buildAd(ctx: BuildContext): Promise<BuildOutput> {
  const notes: string[] = [];
  const { userId, session } = ctx;
  let plan = ctx.plan;

  ctx.onProgress(3, 'Setting up your design…');
  const draft = await CreativeService.save(userId, {
    name: plan.title,
    status: 'draft',
    content: contentFor(session, plan, 'draft'),
  }, session.designId);
  ctx.onDesign?.(draft.id);

  plan = await generateSceneImages(ctx, plan, notes);
  const videoUrl = await renderFilm(ctx, plan, notes);

  if (session.files.some((file) => file.kind === 'video') && formatById(plan.formatId).kind === 'video') {
    notes.push('Your attached video is in Uploads in the editor. Drag it onto the timeline.');
  }

  ctx.onProgress(88, 'Putting the design together…');
  const composed = await composeAd({ plan, brand: ctx.brand });
  notes.push(...composed.notes);

  ctx.onProgress(95, 'Saving…');
  const saved = await CreativeService.save(userId, {
    name: plan.title,
    status: 'finished',
    canvas_data: creativeDocument(composed.pages[0], composed.width, composed.height, composed.pages.length > 1 ? composed.pages : []),
    content: contentFor(session, plan, 'finished', videoUrl ? { videoUrl } : {}),
    preview_url: composed.previews[0],
  }, draft.id);

  ctx.onProgress(100, 'Done');
  return {
    plan,
    result: { designId: saved.id, previewUrl: composed.previews[0], notes, videoUrl, builtAt: new Date().toISOString() },
  };
}

/** 2–3 versions with a different opening line and call to action. Each is its own design. */
export async function buildVariations(ctx: BuildContext, count = 3): Promise<StudioVariation[]> {
  const product = deriveProduct(ctx.session.prompt, ctx.brand?.name);
  const offer = findOffer(ctx.session.prompt);
  const versions = variationsOf(ctx.plan, product, offer, count);
  const out: StudioVariation[] = [];
  for (let index = 0; index < versions.length; index += 1) {
    const version = versions[index];
    ctx.onProgress(Math.round((index / versions.length) * 100), `Making ${version.label}…`);
    const composed = await composeAd({ plan: version.plan, brand: ctx.brand });
    const saved = await CreativeService.save(ctx.userId, {
      name: `${ctx.plan.title} · ${version.label}`,
      status: 'finished',
      canvas_data: creativeDocument(composed.pages[0], composed.width, composed.height, composed.pages.length > 1 ? composed.pages : []),
      content: contentFor(ctx.session, version.plan, 'finished', { variantOf: ctx.session.designId, variantLabel: version.label }),
      preview_url: composed.previews[0],
    });
    out.push({ label: version.label, designId: saved.id, previewUrl: composed.previews[0] });
  }
  ctx.onProgress(100, 'Done');
  return out;
}

/** Full-size pictures for Download. One per page. */
export async function renderForDownload(plan: StudioPlan, brand: BrandContext | null): Promise<string[]> {
  const composed = await composeAd({ plan, brand }, 1);
  return composed.previews;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
