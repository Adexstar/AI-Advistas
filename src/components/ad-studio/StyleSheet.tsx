import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Link2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { ADVISTA_STYLES, linkStyleDraft, nameForLink, parseAdLink, type AdStyle } from '@/lib/adStudio/styles';
import { StyleStore } from '@/lib/adStudio/styleStore';
import { analyzeAdLink } from '@/lib/adStudio/analyzeLink';
import type { ProviderMap } from '@/lib/adStudio/providers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  selected: AdStyle | null;
  onSelect: (style: AdStyle | null) => void;
  providers: ProviderMap | undefined;
}

export const stylesKey = (userId: string) => ['ad-studio-styles', userId];

function Preview({ style, active, onPick }: { style: AdStyle; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      aria-label={style.name}
      className={cn(
        'group flex min-w-0 flex-col overflow-hidden rounded-2xl border text-left transition',
        active ? 'border-[#7d5cff] shadow-[0_0_0_1px_rgba(125,92,255,0.5)]' : 'border-white/[0.08] hover:border-white/25',
      )}
    >
      <span
        className="relative block aspect-[4/3] w-full shrink-0"
        style={{ background: `linear-gradient(145deg, ${style.tint[0]} 0%, ${style.tint[1]} 100%)` }}
      >
        <span className="absolute inset-x-3 top-3 h-1.5 rounded-full bg-white/70" />
        <span className="absolute left-3 top-6 h-1.5 w-1/2 rounded-full bg-white/40" />
        <span className="absolute bottom-3 left-3 rounded-md bg-black/45 px-2 py-0.5 text-[10px] font-medium capitalize text-white">{style.pacing}</span>
        {active && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-[#4c32c7]"><Check className="h-3 w-3" /></span>}
      </span>
      <span className="block flex-1 bg-[#14141b] px-3 py-2.5">
        <span className="block truncate text-[13px] font-semibold text-white">{style.name}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-white/50">{style.description}</span>
      </span>
    </button>
  );
}

function SavedRow({ style, active, onPick, onRename, onDelete }: { style: AdStyle; active: boolean; onPick: () => void; onRename: (name: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(style.name);
  const note = style.analysis?.note;
  const finish = () => {
    setEditing(false);
    if (name.trim() && name.trim() !== style.name) onRename(name.trim());
    else setName(style.name);
  };
  return (
    <li className={cn('rounded-2xl border p-3', active ? 'border-[#7d5cff] bg-[#7d5cff]/10' : 'border-white/[0.08] bg-[#14141b]')} data-testid="saved-style">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onPick} aria-pressed={active} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-label={`Use ${style.name}`}>
          <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border', active ? 'border-[#7d5cff] bg-[#7d5cff] text-white' : 'border-white/25')}>
            {active && <Check className="h-3 w-3" />}
          </span>
          {editing ? (
            <input
              autoFocus
              value={name}
              aria-label="Style name"
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setName(event.target.value)}
              onBlur={finish}
              onKeyDown={(event) => {
                if (event.key === 'Enter') finish();
                if (event.key === 'Escape') { setName(style.name); setEditing(false); }
              }}
              className="min-w-0 flex-1 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-[14px] text-white outline-none focus:border-[#7d5cff]"
            />
          ) : (
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white">{style.name}</span>
          )}
        </button>
        <button type="button" onClick={() => setEditing(true)} aria-label={`Rename ${style.name}`} className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"><Pencil className="h-4 w-4" /></button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${style.name}`} className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
      </div>
      {style.sourceUrl && <p className="mt-1.5 truncate pl-7 text-[11px] text-white/40">{style.sourceUrl}</p>}
      {note && (
        <p className={cn('mt-1.5 pl-7 text-[12px]', style.analysis?.status === 'ready' ? 'text-white/55' : 'text-amber-200/90')} data-testid="style-note">{note}</p>
      )}
      {style.analysis?.status === 'ready' && (
        <p className="mt-1 pl-7 text-[12px] capitalize text-white/55">{style.pacing} pacing{style.textStyle ? ` · ${style.textStyle}` : ''} · {style.middle.join(', ')}</p>
      )}
    </li>
  );
}

export const StyleSheet: React.FC<Props> = ({ open, onOpenChange, userId, selected, onSelect, providers }) => {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<AdStyle | null>(null);

  const saved = useQuery({ queryKey: stylesKey(userId), enabled: !!userId, queryFn: () => StyleStore.list(userId) });
  const list = saved.data ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: stylesKey(userId) });

  const create = useMutation({
    mutationFn: async (parsed: { url: string; host: 'instagram' | 'tiktok' }) => {
      const result = await analyzeAdLink(parsed.url, providers);
      const draft = linkStyleDraft(parsed, nameForLink(parsed, list.length), result.analysis);
      return StyleStore.create(userId, result.patch ? { ...draft, ...result.patch, description: parsed.url } : draft);
    },
    onSuccess: (style) => {
      refresh();
      setLink('');
      setAdding(false);
      if (style.analysis?.status === 'ready') onSelect(style);
      toast({ title: 'Style saved', description: style.analysis?.status === 'ready' ? style.name : style.analysis?.note });
    },
    onError: (error: any) => setLinkError(error?.message || 'The style could not be saved.'),
  });

  const rename = useMutation({
    mutationFn: ({ style, name }: { style: AdStyle; name: string }) => StyleStore.rename(userId, style, name),
    onSuccess: (style) => { refresh(); if (selected?.id === style.id) onSelect(style); },
    onError: () => toast({ title: 'Rename failed', variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: (style: AdStyle) => StyleStore.remove(userId, style.id),
    onSuccess: (_, style) => { refresh(); if (selected?.id === style.id) onSelect(null); setPendingDelete(null); },
    onError: () => toast({ title: 'Delete failed', variant: 'destructive' }),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseAdLink(link);
    if (parsed.ok === false) {
      setLinkError(parsed.error);
      return;
    }
    setLinkError('');
    create.mutate(parsed);
  };

  const pick = (style: AdStyle | null) => {
    onSelect(style);
    onOpenChange(false);
  };

  const keyHint = providers?.known && !providers.text;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[88dvh] w-full max-w-2xl flex-col rounded-t-[28px] border-white/10 bg-[#0c0c11] p-0 text-white sm:bottom-6 sm:rounded-[28px] sm:border"
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/20" aria-hidden />
          <SheetHeader className="shrink-0 px-5 pb-2 pt-3 text-center sm:text-center">
            <SheetTitle className="text-[17px] font-semibold text-white">Style</SheetTitle>
            <SheetDescription className="text-[13px] text-white/50">Sets the pacing, text and scene order of the plan.</SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="advista" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-5 grid h-10 shrink-0 grid-cols-2 rounded-full bg-[#17171e] p-1">
              <TabsTrigger value="advista" className="rounded-full text-white/60 data-[state=active]:bg-[#7d5cff] data-[state=active]:text-white">AdVista styles</TabsTrigger>
              <TabsTrigger value="mine" className="rounded-full text-white/60 data-[state=active]:bg-[#7d5cff] data-[state=active]:text-white">My styles</TabsTrigger>
            </TabsList>

            <TabsContent value="advista" className="mt-4 min-h-0 flex-1 overflow-y-auto px-5 pb-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ADVISTA_STYLES.map((style) => (
                  <Preview key={style.id} style={style} active={selected?.id === style.id} onPick={() => pick(style)} />
                ))}
              </div>
              {selected && (
                <button type="button" onClick={() => pick(null)} className="mt-4 text-[13px] text-white/60 underline-offset-2 hover:text-white hover:underline">Clear style</button>
              )}
            </TabsContent>

            <TabsContent value="mine" className="mt-4 min-h-0 flex-1 overflow-y-auto px-5 pb-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] text-white/55">Styles you saved from Instagram or TikTok links.</p>
                <button type="button" onClick={() => setAdding((value) => !value)} aria-label="Add a style from a link" aria-expanded={adding} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white hover:bg-white/10">
                  <Plus className={cn('h-4 w-4 transition', adding && 'rotate-45')} />
                </button>
              </div>

              {adding && (
                <form onSubmit={submit} className="mb-4 rounded-2xl border border-white/10 bg-[#14141b] p-3" data-testid="style-link-form">
                  <label htmlFor="style-link" className="mb-1.5 block text-[13px] font-medium text-white">Instagram or TikTok link</label>
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        id="style-link"
                        value={link}
                        onChange={(event) => { setLink(event.target.value); setLinkError(''); }}
                        inputMode="url"
                        autoComplete="off"
                        placeholder="https://www.instagram.com/reel/..."
                        className="h-10 w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 text-[16px] text-white outline-none placeholder:text-white/30 focus:border-[#7d5cff] sm:text-[14px]"
                      />
                    </div>
                    <button type="submit" disabled={create.isPending || !link.trim()} className="ad-studio-primary inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-[14px] font-semibold">
                      {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save style
                    </button>
                  </div>
                  {linkError && <p className="mt-2 text-[12px] text-red-300" role="alert">{linkError}</p>}
                  {keyHint && <p className="mt-2 text-[12px] text-amber-200/90" data-testid="needs-key">Needs AI key, add in settings. The link is still saved.</p>}
                  <p className="mt-2 text-[11px] text-white/40">Only the public title and caption are read. The video itself is not watched.</p>
                </form>
              )}

              {saved.isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-white/50" /></div>}
              {saved.isError && <p className="text-[13px] text-red-300">Your saved styles could not be loaded.</p>}
              {!saved.isLoading && !saved.isError && list.length === 0 && !adding && (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-[13px] text-white/45">No saved styles yet. Tap + to add one from a link.</p>
              )}
              <ul className="space-y-2.5">
                {list.map((style) => (
                  <SavedRow
                    key={style.id}
                    style={style}
                    active={selected?.id === style.id}
                    onPick={() => pick(style)}
                    onRename={(name) => rename.mutate({ style, name })}
                    onDelete={() => setPendingDelete(style)}
                  />
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(value) => !value && setPendingDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-[#0f0f14] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this style?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">{pendingDelete?.name} will be removed from My styles. Ads already made with it are not changed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingDelete && remove.mutate(pendingDelete)} className="bg-red-600 text-white hover:bg-red-500">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
