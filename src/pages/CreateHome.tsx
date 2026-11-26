import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, Upload, Play, Maximize2, Image as ImageIcon, Smartphone, Square,
  MoreHorizontal, Megaphone, DollarSign, ShoppingCart, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { CreativeService, type Creative } from '@/services/creative/CreativeService';
import { supabase } from '@/integrations/supabase/client';
import {
  START_PRESETS,
  designDurationLabel,
  designStatusOf,
  designTypeOf,
  editorStartUrl,
  formatEditedAgo,
  readyToLaunch,
  setPendingEditorUpload,
} from '@/lib/designHome';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const TILE_ICONS = {
  'instagram-post': ImageIcon,
  story: Smartphone,
  square: Square,
  video: Play,
} as const;

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const compact = (n: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

function DesignThumb({ creative, className }: { creative: Creative; className?: string }) {
  if (creative.preview_url) {
    return <img src={creative.preview_url} alt="" className={cn('h-full w-full object-cover', className)} />;
  }
  return (
    <div className={cn('flex h-full w-full items-center justify-center bg-[#1a1a22]', className)} aria-hidden>
      <div className="h-16 w-12 rounded-md border border-dashed border-white/15 bg-white/5" />
    </div>
  );
}

function OverlayBadge({ creative }: { creative: Creative }) {
  const type = designTypeOf(creative);
  const duration = designDurationLabel(creative);
  const label = type === 'video' ? (duration ? `Video ${duration}` : 'Video') : 'Photo';
  return (
    <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
      {label}
    </span>
  );
}

const CreateHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [customW, setCustomW] = useState('1080');
  const [customH, setCustomH] = useState('1080');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showAllDrafts, setShowAllDrafts] = useState(false);

  const { loading: dashLoading, totals, campaigns } = useDashboardData('weekly');

  const { data: spendRows = [] } = useQuery({
    queryKey: ['create-home-spend', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('spend, status');
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeCampaigns = useMemo(
    () => campaigns.filter((item) => /active|live|running/i.test(item.status)).length || campaigns.length,
    [campaigns],
  );
  const weekSpend = useMemo(
    () => spendRows.reduce((sum, row) => sum + Number(row.spend || 0), 0),
    [spendRows],
  );
  const hasMetrics = activeCampaigns > 0 || weekSpend > 0 || totals.conversions > 0 || totals.roas > 0;

  const { data: creatives = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['creatives', 'home', user?.id],
    enabled: !!user?.id,
    queryFn: () => CreativeService.list(user!.id),
  });

  const drafts = useMemo(
    () => creatives.filter((item) => designStatusOf(item) === 'draft'),
    [creatives],
  );
  const launchReady = useMemo(
    () => creatives.filter((item) => readyToLaunch(item)),
    [creatives],
  );

  const searchNeedle = query.trim().toLowerCase();
  const filteredDrafts = useMemo(() => {
    const list = drafts.filter((item) => !searchNeedle || (item.name || '').toLowerCase().includes(searchNeedle));
    return showAllDrafts ? list : list.slice(0, 8);
  }, [drafts, searchNeedle, showAllDrafts]);

  const filteredReady = useMemo(
    () => launchReady.filter((item) => !searchNeedle || (item.name || '').toLowerCase().includes(searchNeedle)).slice(0, 8),
    [launchReady, searchNeedle],
  );

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => CreativeService.rename(user!.id, id, name),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['creatives'] });
      setRenameId(null);
      toast({ title: 'Design renamed' });
    },
    onError: (error: Error) => toast({ title: 'Could not rename', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => CreativeService.remove(user!.id, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['creatives'] });
      toast({ title: 'Design deleted' });
    },
    onError: (error: Error) => toast({ title: 'Could not delete', description: error.message, variant: 'destructive' }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => CreativeService.duplicate(user!.id, id),
    onSuccess: (creative) => {
      void qc.invalidateQueries({ queryKey: ['creatives'] });
      toast({ title: 'Design duplicated' });
      navigate(editorStartUrl({ adId: creative.id }));
    },
    onError: (error: Error) => toast({ title: 'Could not duplicate', description: error.message, variant: 'destructive' }),
  });

  const openPreset = (preset: string, mode: 'photo' | 'video') => {
    navigate(editorStartUrl({ preset, mode }));
  };

  const openCustom = () => {
    const width = Number(customW);
    const height = Number(customH);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 64 || height < 64 || width > 8192 || height > 8192) {
      toast({ title: 'Enter a valid size', description: 'Use widths and heights between 64 and 8192.', variant: 'destructive' });
      return;
    }
    setCustomOpen(false);
    navigate(editorStartUrl({ width, height, mode: 'photo' }));
  };

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      toast({ title: 'Unsupported file', description: 'Choose a picture or a video.', variant: 'destructive' });
      return;
    }
    setPendingEditorUpload(file);
    navigate(editorStartUrl({
      preset: isVideo ? 'reels' : 'instagramPortrait',
      mode: isVideo ? 'video' : 'photo',
      upload: true,
    }));
  };

  const DesignMenu = ({ creative }: { creative: Creative }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`More actions for ${creative.name || 'design'}`}
          className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem onClick={() => navigate(editorStartUrl({ adId: creative.id }))}>Open</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setRenameId(creative.id); setRenameValue(creative.name || ''); }}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={() => duplicateMutation.mutate(creative.id)}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate(creative.id)}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const kpiCards = [
    { label: 'Active campaigns', value: hasMetrics ? compact(activeCampaigns) : '—', icon: Megaphone },
    { label: 'Spend this week', value: hasMetrics ? money(weekSpend) : '—', icon: DollarSign },
    { label: 'Conversions', value: hasMetrics ? compact(totals.conversions) : '—', icon: ShoppingCart },
    { label: 'ROAS', value: hasMetrics ? `${totals.roas.toFixed(2)}x` : '—', icon: TrendingUp },
  ] as const;

  const tileClass = (active = false) =>
    cn(
      'flex h-[5.75rem] w-[5.75rem] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#14141c] px-2 text-center transition hover:bg-[#1a1a24] md:h-[7.25rem] md:w-auto',
      active ? 'ring-1 ring-primary/50' : 'border border-transparent',
    );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10 pt-2 lg:pt-4">
      <input
        ref={uploadRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          onUpload(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-[1.65rem] font-semibold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
          What will you <span className="create-home-hero-create">create</span> today?
        </h1>
        <label className="relative mx-auto block w-full max-w-xl text-left lg:hidden">
          <span className="sr-only">Search templates or start a design</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates or start a design"
            className="h-11 w-full rounded-xl border border-white/[0.06] bg-[#14141c] pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/50"
          />
        </label>
      </div>

      <section aria-label="Campaign snapshot" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-2xl bg-[#14141c] p-4 text-left transition hover:bg-[#1a1a24]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-white/50">{card.label}</p>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              {dashLoading ? (
                <Skeleton className="h-7 w-16 bg-white/5" />
              ) : (
                <p className="text-xl font-semibold tabular-nums text-white">{card.value}</p>
              )}
              <p className="mt-3 text-[11px] text-white/40">
                {hasMetrics || dashLoading ? 'View in Dashboard →' : (
                  <Link to="/create-ad" onClick={(event) => event.stopPropagation()} className="text-primary">
                    Launch your first campaign
                  </Link>
                )}
              </p>
            </button>
          );
        })}
      </section>

      <section aria-labelledby="start-heading" className="space-y-3">
        <h2 id="start-heading" className="text-sm font-semibold text-white">Start a new design</h2>
        <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-6 md:gap-3 md:overflow-visible md:pb-0">
          {START_PRESETS.map((tile) => {
            const Icon = TILE_ICONS[tile.id];
            const videoTile = tile.id === 'video';
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => openPreset(tile.preset, tile.mode)}
                className={tileClass(videoTile)}
              >
                <span className={cn('grid h-9 w-9 place-items-center text-primary', videoTile && 'rounded-xl bg-primary text-primary-foreground')}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-medium leading-tight text-white/90">{tile.label}</span>
                {tile.ratio && <span className="text-[10px] text-white/45">{tile.ratio}</span>}
              </button>
            );
          })}
          <button type="button" onClick={() => setCustomOpen(true)} className={tileClass()}>
            <span className="grid h-9 w-9 place-items-center text-primary"><Maximize2 className="h-5 w-5" /></span>
            <span className="text-[11px] font-medium leading-tight text-white/90">Custom size</span>
          </button>
          <button type="button" onClick={() => uploadRef.current?.click()} className={tileClass()}>
            <span className="grid h-9 w-9 place-items-center text-primary"><Upload className="h-5 w-5" /></span>
            <span className="text-[11px] font-medium leading-tight text-white/90">Upload</span>
          </button>
        </div>
      </section>

      <section aria-labelledby="continue-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="continue-heading" className="text-sm font-semibold text-white">Continue designing</h2>
          <button
            type="button"
            className="text-xs font-medium text-primary"
            onClick={() => setShowAllDrafts((value) => !value)}
          >
            {showAllDrafts ? 'Show less' : 'See all'}
          </button>
        </div>
        {isLoading && (
          <div className="flex gap-3 overflow-hidden md:grid md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-52 w-40 shrink-0 rounded-2xl bg-white/5 md:w-auto" />
            ))}
          </div>
        )}
        {isError && (
          <div className="rounded-2xl bg-[#14141c] p-4 text-sm text-white/60">
            Couldn’t load your drafts.{' '}
            <button type="button" className="text-primary" onClick={() => void refetch()}>Retry</button>
          </div>
        )}
        {!isLoading && !isError && filteredDrafts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#14141c]/60 px-4 py-8 text-center">
            <p className="text-sm font-medium text-white">Start your first design</p>
            <p className="mt-1 text-xs text-white/45">Pick a size above, or upload a photo or video.</p>
          </div>
        )}
        {!isLoading && filteredDrafts.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:overflow-visible">
            {filteredDrafts.map((creative) => (
              <article key={creative.id} className="w-[10.5rem] shrink-0 md:w-auto">
                <div className="relative overflow-hidden rounded-2xl bg-[#14141c]">
                  <button
                    type="button"
                    aria-label={`Open ${creative.name || 'design'}`}
                    className="relative block aspect-[4/5] w-full overflow-hidden"
                    onClick={() => navigate(editorStartUrl({ adId: creative.id }))}
                  >
                    <DesignThumb creative={creative} />
                    <span className="absolute left-2 top-2"><OverlayBadge creative={creative} /></span>
                  </button>
                  <div className="absolute right-2 top-2">
                    <DesignMenu creative={creative} />
                  </div>
                  <div className="space-y-0.5 p-2.5">
                    <button
                      type="button"
                      className="block w-full truncate text-left text-sm font-semibold text-white"
                      onClick={() => navigate(editorStartUrl({ adId: creative.id }))}
                    >
                      {creative.name || 'Untitled design'}
                    </button>
                    <p className="text-[11px] text-white/45">{formatEditedAgo(creative.updated_at)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {filteredReady.length > 0 && (
        <section aria-labelledby="ready-heading" className="space-y-3">
          <h2 id="ready-heading" className="text-sm font-semibold text-white">Ready to launch</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:overflow-visible">
            {filteredReady.map((creative) => (
              <article key={creative.id} className="w-44 shrink-0 md:w-auto">
                <div className="relative overflow-hidden rounded-2xl bg-[#14141c]">
                  <button
                    type="button"
                    aria-label={`Open ${creative.name || 'design'}`}
                    className="relative block aspect-[4/5] w-full overflow-hidden"
                    onClick={() => navigate(editorStartUrl({ adId: creative.id }))}
                  >
                    <DesignThumb creative={creative} />
                  </button>
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2 h-7 rounded-lg px-2.5 text-[11px] font-semibold shadow-lg"
                    onClick={() => navigate(`/create-ad?adId=${encodeURIComponent(creative.id)}`)}
                  >
                    Create ad
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom size</DialogTitle>
            <DialogDescription>
              Enter width and height in pixels. The editor opens a blank photo canvas at that size.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <label className="space-y-1.5 text-xs text-muted-foreground">
              Width
              <Input type="number" min={64} max={8192} value={customW} onChange={(event) => setCustomW(event.target.value)} />
            </label>
            <label className="space-y-1.5 text-xs text-muted-foreground">
              Height
              <Input type="number" min={64} max={8192} value={customH} onChange={(event) => setCustomH(event.target.value)} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCustomOpen(false)}>Cancel</Button>
            <Button onClick={openCustom}>Open editor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameId} onOpenChange={(open) => { if (!open) setRenameId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename design</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && renameId) renameMutation.mutate({ id: renameId, name: renameValue });
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameId(null)}>Cancel</Button>
            <Button
              disabled={!renameId || renameMutation.isPending}
              onClick={() => renameId && renameMutation.mutate({ id: renameId, name: renameValue })}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateHome;
