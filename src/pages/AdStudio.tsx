import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useBrandFonts, useBrandKits } from '@/hooks/useBrandKit';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PromptBox, type UiFile } from '@/components/ad-studio/PromptBox';
import { FormatTiles, type FormatChoice } from '@/components/ad-studio/FormatTiles';
import { StyleSheet, stylesKey } from '@/components/ad-studio/StyleSheet';
import { PlanReview } from '@/components/ad-studio/PlanReview';
import { BuildingView, ErrorCard, PlanReadyCard, PlanningView, RecentStrip, ResultScreen } from '@/components/ad-studio/Stages';
import { blankSession, canSend, newSessionId, recentSessions, SessionService, type AttachedFile, type FileKind, type StudioSession } from '@/lib/adStudio/sessions';
import { StyleStore } from '@/lib/adStudio/styleStore';
import { styleById } from '@/lib/adStudio/styles';
import { deriveProduct, planChips, type StudioPlan } from '@/lib/adStudio/plan';
import { generatePlan } from '@/lib/adStudio/generatePlan';
import { buildAd, buildVariations, downloadDataUrl, renderForDownload } from '@/lib/adStudio/build';
import { fetchProviders, summarizeProviders, useProviders } from '@/lib/adStudio/providers';
import { checkFile, imageUrlsOf, logoUrlOf, uploadAttachment } from '@/lib/adStudio/uploads';
import { editorTarget, formatById, sizeFor } from '@/lib/adStudio/formats';
import type { BrandContext } from '@/lib/adStudio/compose';

type View = 'compose' | 'planning' | 'ready' | 'review' | 'building' | 'result' | 'error';
interface Failure { title: string; message: string; retry: 'plan' | 'build' }
type Patch = Partial<StudioSession>;

const MAX_FILES = 8;
const draftKey = (userId: string) => `advista.adstudio.draft.${userId}`;

const chipClass = 'inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-[#14141b] px-4 text-[14px] font-medium text-white transition hover:border-white/25';

function readDraft(userId: string): Patch | null {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    return raw ? (JSON.parse(raw) as Patch) : null;
  } catch {
    return null;
  }
}

function messageOf(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

const AdStudio: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const providersQuery = useProviders();
  const providers = providersQuery.data;
  const kitsQuery = useBrandKits();
  const kit = kitsQuery.data?.find((item) => item.is_active) ?? kitsQuery.data?.[0] ?? null;
  const fontsQuery = useBrandFonts(kit?.id);
  const savedStyles = useQuery({ queryKey: stylesKey(userId), enabled: !!userId, queryFn: () => StyleStore.list(userId) });
  const sessionsQuery = useQuery({ queryKey: ['ad-studio-sessions', userId], enabled: !!userId, queryFn: () => SessionService.list(userId) });

  const [session, setSession] = useState<StudioSession>(() => blankSession());
  const sessionRef = useRef(session);
  const [view, setView] = useState<View>('compose');
  const [planStep, setPlanStep] = useState<'reading' | 'planning'>('reading');
  const [progress, setProgress] = useState<{ percent: number; label: string } | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [pending, setPending] = useState<UiFile[]>([]);
  const [styleOpen, setStyleOpen] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [busy, setBusy] = useState<null | 'variations' | 'download'>(null);
  const [booted, setBooted] = useState(false);
  const runRef = useRef(0);
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());
  const saveWarned = useRef(false);

  const style = styleById(session.styleId, savedStyles.data ?? []);
  const brandLoading = kitsQuery.isLoading || (!!kit && fontsQuery.isLoading);

  /* ---------- State helpers ---------- */

  const queueSave = useCallback((next: StudioSession) => {
    if (!userId) return;
    saveChain.current = saveChain.current
      .then(() => SessionService.save(userId, next))
      .then(() => queryClient.invalidateQueries({ queryKey: ['ad-studio-sessions', userId] }))
      .catch((error) => {
        if (saveWarned.current) return;
        saveWarned.current = true;
        toast({ title: 'Could not save your progress', description: messageOf(error, 'Try again in a moment.'), variant: 'destructive' });
      });
  }, [queryClient, userId]);

  /** Applies a patch to a session. Only the session on screen updates the screen. */
  const apply = useCallback((base: StudioSession, patch: Patch, save = true): StudioSession => {
    const next = { ...base, ...patch };
    if (sessionRef.current.id === base.id) {
      sessionRef.current = next;
      setSession(next);
    }
    if (save) queueSave(next);
    return next;
  }, [queueSave]);

  const brand = useMemo<BrandContext | null>(() => {
    const logo = logoUrlOf(session.files);
    if (session.useBrandKit && kit) {
      const fonts = fontsQuery.data ?? [];
      const font = fonts.find((item) => /head|title|primary/i.test(item.role ?? '')) ?? fonts[0];
      return {
        name: kit.name,
        primary: kit.primary_color,
        secondary: kit.secondary_color,
        accent: kit.accent_color,
        logoUrl: logo ?? kit.logo_url,
        fontFamily: font?.name ?? null,
      };
    }
    return logo ? { name: '', primary: '#7d5cff', secondary: '#14121f', accent: '#c084fc', logoUrl: logo } : null;
  }, [session.files, session.useBrandKit, kit, fontsQuery.data]);
  const brandRef = useRef(brand);
  brandRef.current = brand;

  const providersNow = async () => providers ?? (await queryClient.fetchQuery({ queryKey: ['ad-studio-providers'], queryFn: fetchProviders })) ?? summarizeProviders(null);

  /* ---------- Flow ---------- */

  const runPlan = useCallback(async (base: StudioSession) => {
    const run = ++runRef.current;
    setFailure(null);
    setView('planning');
    setPlanStep('reading');
    let current = apply(base, { status: 'planning', error: null });
    window.setTimeout(() => { if (runRef.current === run) setPlanStep('planning'); }, 800);
    try {
      const saved = savedStyles.data ?? [];
      const status = await providersNow();
      const plan = await generatePlan({
        prompt: current.prompt,
        formatId: current.formatId,
        ratio: current.ratio,
        length: current.length,
        style: styleById(current.styleId, saved),
        brandName: current.useBrandKit ? kit?.name ?? null : null,
        imageUrls: imageUrlsOf(current.files),
      }, { textModel: !status.known || status.text });
      current = apply(current, { plan, title: plan.title, status: 'plan', error: null });
      if (runRef.current === run) setView('ready');
    } catch (error) {
      const message = messageOf(error, 'The plan could not be written.');
      current = apply(current, { status: 'failed', error: message });
      if (runRef.current === run) {
        setFailure({ title: 'The plan could not be written', message, retry: 'plan' });
        setView('error');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply, kit?.name, savedStyles.data, providers]);

  const runBuild = useCallback(async (base: StudioSession, plan: StudioPlan) => {
    const run = ++runRef.current;
    setFailure(null);
    setProgress({ percent: 2, label: 'Starting…' });
    setView('building');
    let current = apply(base, { status: 'building', plan, error: null });
    try {
      const output = await buildAd({
        userId,
        session: current,
        plan,
        brand: brandRef.current,
        providers: await providersNow(),
        onProgress: (percent, label) => { if (runRef.current === run) setProgress({ percent, label }); },
        onDesign: (designId) => { current = apply(current, { designId }); },
      });
      current = apply(current, { status: 'ready', plan: output.plan, result: output.result, designId: output.result.designId, error: null });
      void queryClient.invalidateQueries({ queryKey: ['creatives'] });
      if (runRef.current === run) setView('result');
    } catch (error) {
      const message = messageOf(error, 'The ad could not be built.');
      current = apply(current, { status: 'failed', error: message });
      if (runRef.current === run) {
        setFailure({ title: 'The ad could not be built', message, retry: 'build' });
        setView('error');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply, queryClient, userId, providers]);

  const openSession = useCallback((next: StudioSession) => {
    runRef.current += 1;
    sessionRef.current = next;
    setSession(next);
    setSearchParams({ session: next.id }, { replace: true });
    setFailure(null);
    if (next.status === 'planning') { void runPlan(next); return; }
    if (next.status === 'building' && next.plan) { void runBuild(next, next.plan); return; }
    if (next.status === 'plan' && next.plan) { setView('ready'); return; }
    if (next.status === 'ready' && next.result) { setView('result'); return; }
    if (next.status === 'failed') {
      const retry = next.plan && next.designId ? 'build' : 'plan';
      setFailure({ title: retry === 'build' ? 'The ad could not be built' : 'The plan could not be written', message: next.error || 'Something went wrong.', retry });
      setView('error');
      return;
    }
    setView('compose');
  }, [runBuild, runPlan, setSearchParams]);

  const startNew = () => {
    runRef.current += 1;
    const fresh = blankSession();
    sessionRef.current = fresh;
    setSession(fresh);
    setPending([]);
    setFailure(null);
    setView('compose');
    setSearchParams({}, { replace: true });
    try { localStorage.removeItem(draftKey(userId)); } catch { /* noop */ }
  };

  /* ---------- Boot: resume a session, or restore the unsent draft ---------- */

  useEffect(() => {
    if (booted || !userId || brandLoading) return;
    setBooted(true);
    const id = searchParams.get('session');
    if (id) {
      void SessionService.get(userId, id).then((found) => {
        if (found) openSession(found);
        else toast({ title: 'That ad was not found', description: 'It may have been deleted.', variant: 'destructive' });
      }).catch((error) => toast({ title: 'Could not open that ad', description: messageOf(error, ''), variant: 'destructive' }));
      return;
    }
    const draft = readDraft(userId);
    if (draft) apply(sessionRef.current, { ...draft, id: sessionRef.current.id, status: 'draft' } as Patch, false);
  }, [apply, booted, brandLoading, openSession, searchParams, userId]);

  // Keep the unsent form so a refresh does not lose it.
  useEffect(() => {
    if (!booted || !userId || view !== 'compose' || session.status !== 'draft') return;
    const { prompt, formatId, ratio, length, styleId, useBrandKit, files } = session;
    try { localStorage.setItem(draftKey(userId), JSON.stringify({ prompt, formatId, ratio, length, styleId, useBrandKit, files })); } catch { /* noop */ }
  }, [booted, session, userId, view]);

  /* ---------- Compose actions ---------- */

  const edit = (patch: Patch) => apply(sessionRef.current, patch, false);

  const choice: FormatChoice = { formatId: session.formatId, ratio: session.ratio, length: session.length };
  const files: UiFile[] = [...session.files, ...pending];
  const sendable = canSend(session.prompt, session.files) && pending.length === 0;

  const onUpload = async (kind: Exclude<FileKind, 'design'>, picked: File[]) => {
    for (const file of picked) {
      if (sessionRef.current.files.length + pending.length >= MAX_FILES) {
        toast({ title: `Up to ${MAX_FILES} files`, description: 'Remove one to add another.', variant: 'destructive' });
        break;
      }
      const problem = checkFile(file, kind);
      if (problem) {
        toast({ title: file.name, description: problem, variant: 'destructive' });
        continue;
      }
      const id = newSessionId();
      const local = URL.createObjectURL(file);
      setPending((list) => [...list, { id, kind, name: file.name, url: local, uploading: true }]);
      try {
        const attached = await uploadAttachment(userId, file, kind);
        const keep = kind === 'logo' ? sessionRef.current.files.filter((item) => item.kind !== 'logo') : sessionRef.current.files;
        edit({ files: [...keep, attached] });
      } catch (error) {
        toast({ title: `${file.name} was not uploaded`, description: messageOf(error, 'Try again.'), variant: 'destructive' });
      } finally {
        URL.revokeObjectURL(local);
        setPending((list) => list.filter((item) => item.id !== id));
      }
    }
  };

  const onPickDesign = (file: AttachedFile) => {
    if (sessionRef.current.files.some((item) => item.designId === file.designId)) return;
    if (sessionRef.current.files.length >= MAX_FILES) {
      toast({ title: `Up to ${MAX_FILES} files`, variant: 'destructive' });
      return;
    }
    edit({ files: [...sessionRef.current.files, file] });
  };

  const onSend = () => {
    if (!sendable) return;
    const base = sessionRef.current;
    const product = deriveProduct(base.prompt, base.useBrandKit ? kit?.name : null);
    const next = apply(base, { title: product, plan: null, result: null, status: 'planning' }, false);
    setSearchParams({ session: next.id }, { replace: true });
    try { localStorage.removeItem(draftKey(userId)); } catch { /* noop */ }
    void runPlan(next);
  };

  const onFormat = (value: FormatChoice) => edit({ formatId: value.formatId, ratio: value.ratio, length: value.length || sessionRef.current.length });

  /* ---------- Result actions ---------- */

  const editorUrl = (designId: string) => {
    const format = formatById(session.formatId);
    const target = editorTarget(format, sizeFor(format, session.ratio));
    const query = new URLSearchParams({ adId: designId, preset: target.preset });
    if (target.mode === 'video') query.set('mode', 'video');
    return `/visual-editor?${query.toString()}`;
  };

  const progressFor = (label: string, percent?: number) => setProgress((value) => ({ percent: percent ?? value?.percent ?? 0, label }));

  const makeVariations = async () => {
    const base = sessionRef.current;
    if (!base.plan || !base.result) return;
    setBusy('variations');
    progressFor('Making variations…', 0);
    try {
      const list = await buildVariations({
        userId,
        session: base,
        plan: base.plan,
        brand: brandRef.current,
        providers: await providersNow(),
        onProgress: (percent, label) => progressFor(label, percent),
      });
      apply(base, { result: { ...base.result, variations: [...(base.result.variations ?? []), ...list] } });
      void queryClient.invalidateQueries({ queryKey: ['creatives'] });
    } catch (error) {
      toast({ title: 'Variations could not be made', description: messageOf(error, 'Try again.'), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const download = async () => {
    const base = sessionRef.current;
    if (!base.plan || !base.result) return;
    setBusy('download');
    progressFor('Preparing your download…', 0);
    try {
      const slug = (base.plan.title || 'ad').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ad';
      if (base.result.videoUrl) {
        downloadDataUrl(base.result.videoUrl, `${slug}.mp4`);
      } else {
        const pictures = await renderForDownload(base.plan, brandRef.current);
        pictures.forEach((picture, index) => downloadDataUrl(picture, `${slug}${pictures.length > 1 ? `-${index + 1}` : ''}.jpg`));
      }
    } catch (error) {
      toast({ title: 'Download failed', description: messageOf(error, 'Try again.'), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const approve = () => {
    const base = sessionRef.current;
    if (base.plan) void runBuild(base, base.plan);
  };

  const regenerate = () => {
    setConfirmRegen(false);
    void runPlan(sessionRef.current);
  };

  const retry = () => {
    const base = sessionRef.current;
    if (failure?.retry === 'build' && base.plan) void runBuild(base, base.plan);
    else void runPlan(base);
  };

  /* ---------- Render ---------- */

  const recent = recentSessions(sessionsQuery.data ?? []);
  const product = deriveProduct(session.prompt, session.useBrandKit ? kit?.name : null);

  const heading = (
    <h1 className="text-center text-[30px] font-semibold leading-tight tracking-tight text-white sm:text-[40px]">
      What <span className="ad-studio-gradient-text">ad</span> are we making today?
    </h1>
  );

  let body: React.ReactNode;
  if (view === 'compose') {
    body = (
      <div className="space-y-8">
        {heading}
        <PromptBox
          userId={userId}
          value={session.prompt}
          onChange={(prompt) => edit({ prompt })}
          files={files}
          onUpload={onUpload}
          onPickDesign={onPickDesign}
          onRemove={(id) => { setPending((list) => list.filter((item) => item.id !== id)); edit({ files: sessionRef.current.files.filter((item) => item.id !== id) }); }}
          onSend={onSend}
          canSend={sendable}
        />

        <div className="flex flex-wrap items-center gap-2.5">
          {kit ? (
            <button type="button" aria-pressed={session.useBrandKit} onClick={() => edit({ useBrandKit: !sessionRef.current.useBrandKit })} className={cn(chipClass, session.useBrandKit && 'border-[#7d5cff]/70 bg-[#7d5cff]/15')}>
              <span className={cn('grid h-4 w-4 place-items-center rounded-full', session.useBrandKit ? 'bg-[#7d5cff] text-white' : 'border border-white/30')}>
                {session.useBrandKit && <Check className="h-3 w-3" />}
              </span>
              <span className="max-w-[160px] truncate">Brand kit: {kit.name}</span>
            </button>
          ) : (
            !kitsQuery.isLoading && <Link to="/brand-kit" className={chipClass}><Palette className="h-4 w-4 text-[#a78bfa]" /> Set up brand kit</Link>
          )}
          <span className="inline-flex items-center gap-1">
            <button type="button" onClick={() => setStyleOpen(true)} className={cn(chipClass, style && 'border-[#7d5cff]/70 bg-[#7d5cff]/15')} aria-haspopup="dialog">
              <span className="max-w-[140px] truncate">{style ? `Style: ${style.name}` : 'Style'}</span>
              <ChevronDown className="h-4 w-4 text-white/50" />
            </button>
            {style && (
              <button type="button" onClick={() => edit({ styleId: null })} aria-label="Clear style" className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
            )}
          </span>
        </div>

        <FormatTiles value={choice} onChange={onFormat} />

        <RecentStrip sessions={recent} onOpen={openSession} />
      </div>
    );
  } else if (view === 'planning') {
    body = <PlanningView step={planStep} />;
  } else if (view === 'ready' && session.plan) {
    body = <PlanReadyCard title={session.plan.title} chips={planChips(session.plan)} note={session.plan.note} onReview={() => setView('review')} />;
  } else if (view === 'review' && session.plan) {
    body = (
      <PlanReview
        plan={session.plan}
        product={product}
        onChange={(plan) => apply(sessionRef.current, { plan, title: plan.title })}
        onApprove={approve}
        onRegenerate={() => (session.plan?.edited ? setConfirmRegen(true) : regenerate())}
        onClose={() => setView('ready')}
      />
    );
  } else if (view === 'building') {
    body = <BuildingView percent={progress?.percent ?? 0} label={progress?.label ?? 'Starting…'} />;
  } else if (view === 'result' && session.result) {
    body = (
      <ResultScreen
        session={session}
        result={session.result}
        busy={busy}
        progress={progress}
        onOpenEditor={(designId) => navigate(editorUrl(designId))}
        onVariations={makeVariations}
        onDownload={download}
        onCampaign={() => navigate(`/create-ad?adId=${session.result!.designId}`)}
        onNew={startNew}
      />
    );
  } else if (view === 'error' && failure) {
    body = (
      <div className="space-y-4">
        <ErrorCard title={failure.title} message={failure.message} onRetry={retry} />
        <div className="text-center">
          <button type="button" onClick={() => setView('compose')} className="text-[14px] text-white/60 underline-offset-2 hover:text-white hover:underline">Edit my description</button>
        </div>
      </div>
    );
  } else {
    body = <PlanningView step="reading" />;
  }

  return (
    <div className="relative min-h-full overflow-x-clip" data-testid="ad-studio">
      <div className="ad-studio-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden />
      <div className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-8 sm:px-6 sm:pt-14">
        {view !== 'compose' && view !== 'review' && (
          <div className="mb-6 flex justify-start">
            <button type="button" onClick={startNew} className="text-[14px] text-white/60 hover:text-white">New ad</button>
          </div>
        )}
        {body}
      </div>

      <StyleSheet
        open={styleOpen}
        onOpenChange={setStyleOpen}
        userId={userId}
        selected={style}
        onSelect={(next) => edit({ styleId: next?.id ?? null })}
        providers={providers}
      />

      <AlertDialog open={confirmRegen} onOpenChange={setConfirmRegen}>
        <AlertDialogContent className="border-white/10 bg-[#0f0f14] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your edits?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">Regenerating writes a new plan. The changes you made to this one will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">Keep my plan</AlertDialogCancel>
            <AlertDialogAction onClick={regenerate} className="ad-studio-primary">Regenerate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdStudio;
