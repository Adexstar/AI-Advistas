// Data-driven left panels for the Visual Editor (Creative Studio).
// Visual language matches the existing dark editor chrome — only the
// content is now real (Supabase templates, media library, live canvas ops).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Circle as FCircle, Triangle, Line, Polygon, Group } from 'fabric';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { signedMediaUrl } from '@/lib/mediaUrl';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { placeFittedImage, replaceImageKeepingFrame } from '@/components/visual-editor/canvasImagePlacement';
import { isOverlayScrim } from '@/services/templates/loadIntoCanvas';
import { Skeleton } from '@/components/ui/skeleton';
import { ELEMENT_CATEGORIES, ELEMENT_LABELS } from '@/components/visual-editor/createRail';
import {
  Search, Upload, Loader2, ImageIcon, Video, Music, FileText, Pipette, Plus, X, Info,
  Sparkles, Mic, ChevronDown, Heart, ChevronLeft,
} from 'lucide-react';

const PANEL = 'studio-panel flex h-full min-h-0 flex-col';
const HEAD = 'px-4 py-3 border-b border-[#454545]';
const H2 = 'editor-heading text-base font-semibold text-white';
const FIELD =
  'w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-[#3D3D3D] border border-[#555555] text-white placeholder:text-[#888888] outline-none';

const SearchField: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({
  value, onChange, placeholder,
}) => (
  <div className="relative mb-4">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888888]" />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={FIELD} />
  </div>
);

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-lg border border-dashed border-[#555555] p-4 text-center text-xs text-[#888888]">{children}</p>
);

const layerLabel = (o: any): string => {
  if (!o) return '';
  if (o.type === 'textbox' || o.type === 'text' || o.type === 'i-text') return `Text · “${String(o.text ?? '').slice(0, 22)}”`;
  if (o.type === 'image') return 'Image layer';
  if (o.type === 'group' || o.type === 'activeselection') return 'Group / multi-selection';
  return `${String(o.type ?? 'Shape').replace(/^\w/, (c: string) => c.toUpperCase())} layer`;
};

export const SelectedBanner: React.FC<{ selected: any; hint: string }> = ({ selected, hint }) => {
  if (!selected) return null;
  return (
    <div className="mb-3 rounded-lg border border-primary/40 bg-primary/10 p-2.5">
      <p className="text-[11px] font-semibold text-white">{layerLabel(selected)}</p>
      <p className="mt-0.5 text-[10px] leading-relaxed text-[#BBBBBB]">{hint}</p>
    </div>
  );
};

async function addImageToCanvas(canvas: FabricCanvas | null, url: string, onChanged?: () => void) {
  if (!canvas) return;
  try {
    await placeFittedImage(canvas, url);
    onChanged?.();
  } catch {
    toast({ title: 'Could not load image', description: 'The asset could not be added to the canvas.', variant: 'destructive' });
  }
}

async function replaceImageSource(canvas: FabricCanvas | null, target: any, url: string, onChanged?: () => void) {
  if (!canvas || !target) return;
  try {
    await replaceImageKeepingFrame(canvas, target, url);
    onChanged?.();
    toast({ title: 'Layer replaced', description: 'The selected image now uses the new asset.' });
  } catch {
    toast({ title: 'Could not replace layer', variant: 'destructive' });
  }
}

/* ============================ TEMPLATES ============================ */
export type StudioTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  template_json: any;
  width?: number | null;
  height?: number | null;
  popularity_score?: number | null;
};

const RECENT_KEY = 'advista.editor.recentTemplateIds';

const readIds = (key: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const TemplatesPanel: React.FC<{
  onUse: (t: StudioTemplate) => void;
  embedded?: boolean;
  canvas?: FabricCanvas | null;
  onChanged?: () => void;
  platform?: string | null;
  onAttach?: () => void;
  onWriteCopy?: (text: string) => void;
}> = ({ onUse, embedded = false, canvas, onChanged, platform, onAttach, onWriteCopy }) => {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [prompt, setPrompt] = useState('');
  const [needPrompt, setNeedPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [genMode, setGenMode] = useState<'design' | 'copy'>('design');
  const [seeAllRecent, setSeeAllRecent] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>(() => readIds(RECENT_KEY));
  const promptRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['editor-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id,name,description,category,platform,preview_url,thumbnail_url,template_json,width,height,popularity_score')
        .eq('is_active', true)
        .order('popularity_score', { ascending: false })
        .limit(120);
      if (error) throw error;
      return (data ?? []) as unknown as StudioTemplate[];
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((t) => t.category && set.add(t.category));
    return ['All', ...Array.from(set).slice(0, 12)];
  }, [data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((t) => {
      if (cat !== 'All' && t.category !== cat) return false;
      if (!term) return true;
      return `${t.name} ${t.description ?? ''} ${t.category ?? ''} ${t.platform ?? ''}`.toLowerCase().includes(term);
    });
  }, [data, q, cat]);

  const recent = useMemo(() => {
    const byId = new Map((filtered ?? []).map((t) => [t.id, t]));
    return recentIds.map((id) => byId.get(id)).filter(Boolean) as StudioTemplate[];
  }, [filtered, recentIds]);

  const shownRecent = seeAllRecent ? recent : recent.slice(0, 2);
  const recentShown = new Set(shownRecent.map((t) => t.id));
  const more = filtered.filter((t) => !recentShown.has(t.id));

  const requireBrief = () => {
    if (prompt.trim()) {
      setNeedPrompt(false);
      return true;
    }
    setNeedPrompt(true);
    promptRef.current?.focus();
    return false;
  };

  const remember = (t: StudioTemplate) => {
    setRecentIds((prev) => {
      const next = [t.id, ...prev.filter((id) => id !== t.id)].slice(0, 12);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    onUse(t);
  };

  const listen = () => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      toast({ title: 'Voice input isn’t available here', description: 'Type a description instead.' });
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = 'en-US';
      rec.onresult = (event: any) => {
        const text = String(event.results?.[0]?.[0]?.transcript ?? '');
        if (!text) return;
        setPrompt(text);
        setNeedPrompt(false);
      };
      rec.start();
    } catch {
      toast({ title: 'Couldn’t start the microphone', variant: 'destructive' });
    }
  };

  const onSearch = () => {
    if (!requireBrief()) return;
    setQ(prompt.trim());
    setCat('All');
  };

  const onGenerate = async () => {
    if (!requireBrief()) return;
    setGenOpen(false);
    setQ(prompt.trim());
    setCat('All');
    if (genMode === 'copy') {
      onWriteCopy?.(prompt.trim());
      toast({ title: 'Copy added', description: 'The description is now a text layer on the canvas.' });
      return;
    }
    if (prompt.trim().length < 5) {
      setNeedPrompt(true);
      return;
    }
    setBusy(true);
    try {
      const { data: generated, error: genError } = await supabase.functions.invoke('generate-ad-image', {
        body: {
          product: prompt.trim(),
          platform: (platform || 'instagram').toLowerCase(),
          adContent: { headline: prompt.trim() },
        },
      });
      if (genError) throw genError;
      const url = generated?.imageUrl || generated?.url || generated?.image || generated?.data?.[0]?.url;
      if (!url) throw new Error('No image returned');
      await addImageToCanvas(canvas ?? null, url, onChanged);
      toast({ title: 'Design generated', description: 'It’s on the canvas. Matching templates are below if you want a different start.' });
    } catch (e: any) {
      toast({
        title: 'Showing matching templates',
        description: e?.message ? 'Generation didn’t return an image, so the catalog is filtered to your description.' : 'Filtered the catalog to your description.',
      });
    } finally {
      setBusy(false);
    }
  };

  const renderCard = (t: StudioTemplate) => {
    const src = t.preview_url || t.thumbnail_url;
    return (
      <button
        key={t.id}
        onClick={() => remember(t)}
        className="group relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-[#3D3D3D] bg-[#1A1A1A] text-left hover:border-[#8B74F8] transition-colors"
      >
        {src ? (
          <img src={src} alt={t.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#3D3D3D] to-[#1A1A1A] px-2 text-center text-[10px] font-semibold text-white">
            {t.name}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
          <span className="block truncate text-[10px] font-medium text-white">{t.name}</span>
        </div>
      </button>
    );
  };

  return (
    <div className={embedded ? 'flex h-full min-h-0 flex-col' : PANEL}>
      {!embedded && (
        <div className={HEAD}>
          <h2 className={H2}>Templates</h2>
          <p className="mt-0.5 text-[11px] text-[#AAAAAA]">Start from a design, then make every layer yours.</p>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'ask', label: 'Ask AI', run: () => promptRef.current?.focus() },
            { id: 'generate', label: 'Generate Design', run: () => { setGenMode('design'); void onGenerate(); } },
            { id: 'replace', label: 'Replace Image', run: () => onAttach?.() },
            { id: 'copy', label: 'Write Copy', run: () => { setGenMode('copy'); if (prompt.trim()) onWriteCopy?.(prompt.trim()); else { setNeedPrompt(true); promptRef.current?.focus(); } } },
          ].map((chip, index) => (
            <button
              key={chip.id}
              onClick={chip.run}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                index === 0 ? 'bg-primary/20 text-white' : 'border border-[#555555] text-[#CCCCCC] hover:bg-[#3D3D3D]'
              }`}
            >
              {index === 0 && <Sparkles className="mr-1 inline h-3.5 w-3.5 text-[#8B74F8]" />}
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex h-11 items-center gap-2 rounded-full border border-[#555555] bg-[#2A2A2A] px-3">
          <button type="button" onClick={() => onAttach?.()} aria-label="Add a reference image" className="text-[#CCCCCC] hover:text-white">
            <Plus className="h-4 w-4" />
          </button>
          <input
            ref={promptRef}
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); if (e.target.value.trim()) setNeedPrompt(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
            placeholder="Describe your ideal design"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#888888]"
          />
          <button type="button" onClick={listen} aria-label="Describe your design by voice" className="text-[#CCCCCC] hover:text-white">
            <Mic className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-2 flex gap-2">
          <div className="relative flex h-11 min-w-0 flex-1 overflow-visible rounded-xl border border-[#555555]">
            <button type="button" onClick={() => void onGenerate()} disabled={busy} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-sm font-medium text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#8B74F8]" />}
              Generate
            </button>
            <button type="button" aria-label="Generation options" aria-expanded={genOpen} onClick={() => setGenOpen((v) => !v)} className="flex w-9 items-center justify-center border-l border-[#555555] text-[#CCCCCC]">
              <ChevronDown className="h-4 w-4" />
            </button>
            {genOpen && (
              <div className="absolute left-0 top-12 z-20 w-full overflow-hidden rounded-xl border border-[#555555] bg-[#1E2227] shadow-lg">
                {([
                  ['design', 'Generate design'],
                  ['copy', 'Write copy'],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => { setGenMode(id); setGenOpen(false); }}
                    className={`block w-full px-3 py-2 text-left text-xs ${genMode === id ? 'bg-primary/20 text-white' : 'text-[#CCCCCC] hover:bg-[#2A2A2A]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={onSearch} className="h-11 min-w-0 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-[#5E48E6]">
            Search
          </button>
        </div>
        {needPrompt && <p className="mb-3 text-xs font-medium text-red-400">Describe what you are after to get started</p>}

        <div className="mb-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                cat === c ? 'bg-primary text-primary-foreground' : 'bg-[#3D3D3D] text-[#CCCCCC] hover:bg-[#4D4D4D]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-xl bg-[#3D3D3D]" />)}
          </div>
        )}
        {error && <EmptyState>Couldn’t load templates. Check your connection and try again.</EmptyState>}
        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState>No templates match “{q || cat}”. Try another search or category.</EmptyState>
        )}

        {shownRecent.length > 0 && (
          <section className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Recently used</p>
              <button type="button" onClick={() => setSeeAllRecent((v) => !v)} className="text-[11px] text-[#AAAAAA]">{seeAllRecent ? 'Show less' : 'See all'}</button>
            </div>
            <div className="grid grid-cols-2 gap-3">{shownRecent.map(renderCard)}</div>
          </section>
        )}

        {more.length > 0 && (
          <section>
            <p className="mb-2 text-sm font-semibold text-white">{shownRecent.length > 0 ? 'More templates for you' : 'Templates for you'}</p>
            <div className="grid grid-cols-2 gap-3">{more.map(renderCard)}</div>
          </section>
        )}
      </div>
    </div>
  );
};

/* ============================ MEDIA / UPLOADS ============================ */
type MediaRow = {
  id: string; name: string; type: string; file_url: string | null; thumbnail_url: string | null; created_at: string;
};

const MediaGrid: React.FC<{
  rows: MediaRow[];
  canvas: FabricCanvas | null;
  onChanged?: () => void;
  selected?: any;
  marked?: Set<string>;
  onToggleMark?: (id: string) => void;
}> = ({ rows, canvas, onChanged, selected, marked, onToggleMark }) => (
  <div className="grid grid-cols-3 gap-1.5">
    {rows.map((m) => {
      const src = m.thumbnail_url || m.file_url;
      const Icon = m.type === 'video' ? Video : m.type === 'audio' ? Music : m.type === 'document' ? FileText : ImageIcon;
      return (
        <div key={m.id} className="relative">
          <button
            onClick={() => {
              if (!m.file_url || m.type !== 'image') { toast({ title: m.name, description: `${m.type} assets can be placed from the timeline.` }); return; }
              if (selected && selected.type === 'image') { replaceImageSource(canvas, selected, m.file_url, onChanged); return; }
              addImageToCanvas(canvas, m.file_url, onChanged);
            }}
            className="group relative aspect-square w-full overflow-hidden rounded-md bg-[#1A1A1A] hover:ring-2 hover:ring-primary"
            title={m.name}
          >
            {src && m.type === 'image' ? (
              <img src={src} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#888888]">
                <Icon className="h-4 w-4" />
                <span className="w-full truncate px-1 text-center text-[9px]">{m.name}</span>
              </div>
            )}
          </button>
          {onToggleMark && (
            <button
              type="button"
              aria-label={marked?.has(m.id) ? 'Remove from album' : 'Save to album'}
              onClick={() => onToggleMark(m.id)}
              className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white"
            >
              <Heart className={`h-3 w-3 ${marked?.has(m.id) ? 'fill-white' : ''}`} />
            </button>
          )}
        </div>
      );
    })}
  </div>
);

const useMediaRows = (kinds?: string[]) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['editor-media', user?.id, kinds?.join(',') ?? 'all'],
    enabled: !!user?.id,
    queryFn: async () => {
      let query = supabase
        .from('media_assets')
        .select('id,name,type,file_url,thumbnail_url,created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(120);
      if (kinds?.length) query = query.in('type', kinds);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MediaRow[];
    },
  });
};

export const MediaPanel: React.FC<{ canvas: FabricCanvas | null; onChanged?: () => void; selected?: any; embedded?: boolean }> = ({ canvas, onChanged, selected, embedded = false }) => {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const { data, isLoading, error } = useMediaRows();
  const rows = (data ?? []).filter(
    (m) => (kind === 'all' || m.type === kind) && m.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className={embedded ? 'flex h-full min-h-0 flex-col' : PANEL}>
      {!embedded && <div className={HEAD}><h2 className={H2}>Media</h2></div>}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <SelectedBanner
          selected={selected}
          hint={selected?.type === 'image'
            ? 'Click any image below to replace this layer’s artwork.'
            : 'Selected layer is not an image — assets will be added as new layers.'}
        />
        <SearchField value={q} onChange={setQ} placeholder="Search your media library" />
        <div className="flex gap-1.5 mb-4">
          {(['all', 'image', 'video', 'audio'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1 text-[11px] capitalize ${kind === k ? 'bg-primary text-primary-foreground' : 'bg-[#3D3D3D] text-[#CCCCCC]'}`}
            >
              {k === 'all' ? 'All' : `${k}s`}
            </button>
          ))}
        </div>
        {isLoading && <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg bg-[#3D3D3D]" />)}</div>}
        {error && <EmptyState>Couldn’t load your media library.</EmptyState>}
        {!isLoading && !error && rows.length === 0 && <EmptyState>No media yet. Upload files from the Uploads tab or the Media Library page.</EmptyState>}
        <MediaGrid rows={rows} canvas={canvas} onChanged={onChanged} selected={selected} />
      </div>
    </div>
  );
};

const MAX_UPLOAD_MB = 20;
const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(r.error);
  r.readAsDataURL(file);
});

type Album = { id: string; name: string; assetIds: string[] };
const ALBUM_KEY = 'advista.editor.albums';
const FAVORITE_KEY = 'advista.editor.favoriteMedia';

const readAlbums = (): Album[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ALBUM_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((a) => a && typeof a.id === 'string' && typeof a.name === 'string' && Array.isArray(a.assetIds));
  } catch {
    return [];
  }
};

export const UploadsPanel: React.FC<{
  canvas: FabricCanvas | null;
  onChanged?: () => void;
  selected?: any;
  embedded?: boolean;
  pendingFiles?: FileList | File[] | null;
  onPendingConsumed?: () => void;
}> = ({ canvas, onChanged, selected, embedded = false, pendingFiles = null, onPendingConsumed }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const rollRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'roll' | 'all'>('roll');
  const [q, setQ] = useState('');
  const [dragOver, setDragOver] = useState(false);
  // Images picked this session — shown instantly, even before the cloud upload finishes.
  const [session, setSession] = useState<{ id: string; name: string; src: string; status: 'uploading' | 'saved' | 'local' }[]>([]);
  const [albums, setAlbums] = useState<Album[]>(readAlbums);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => readIds(FAVORITE_KEY));
  const { data, isLoading } = useMediaRows();
  const all = (data ?? []).filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()));
  const rows = view === 'roll' ? all.filter((m) => m.type === 'image') : all;
  const activeAlbum = albums.find((a) => a.id === activeAlbumId) ?? null;
  const visibleRows = activeAlbum ? rows.filter((row) => activeAlbum.assetIds.includes(row.id)) : rows;
  const marked = new Set(activeAlbum ? activeAlbum.assetIds : favorites);

  const persistAlbums = (next: Album[]) => {
    setAlbums(next);
    try { localStorage.setItem(ALBUM_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const toggleMark = (id: string) => {
    if (activeAlbum) {
      persistAlbums(albums.map((album) => (
        album.id === activeAlbum.id
          ? { ...album, assetIds: album.assetIds.includes(id) ? album.assetIds.filter((x) => x !== id) : [...album.assetIds, id] }
          : album
      )));
      return;
    }
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(FAVORITE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const saveAlbum = () => {
    const name = albumName.trim();
    if (!name) return;
    const album: Album = { id: `album-${Date.now()}`, name, assetIds: [] };
    persistAlbums([album, ...albums]);
    setActiveAlbumId(album.id);
    setAlbumOpen(false);
    setAlbumName('');
  };

  const place = async (src: string) => {
    if (selected && selected.type === 'image') await replaceImageSource(canvas, selected, src, onChanged);
    else await addImageToCanvas(canvas, src, onChanged);
  };

  const upload = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    setBusy(true);
    let failed = 0;
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
          toast({ title: `${file.name} is too large`, description: `Max ${MAX_UPLOAD_MB}MB per file.`, variant: 'destructive' });
          continue;
        }
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'document';
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        if (type === 'image') {
          const local = await readAsDataUrl(file);
          setSession((s) => [{ id, name: file.name, src: local, status: user ? 'uploading' : 'local' }, ...s]);
          await place(local);
        }
        if (!user?.id) continue;
        try {
          const safe = file.name.replace(/[^\w.\-]+/g, '_');
          const path = `${user.id}/${Date.now()}-${safe}`;
          const { error: upErr } = await supabase.storage.from('media-library').upload(path, file, { upsert: false, contentType: file.type });
          if (upErr) throw upErr;
          const url = await signedMediaUrl(path);
          const { error: insErr } = await supabase.from('media_assets').insert({
            user_id: user.id, name: file.name, type, file_path: path, file_url: url,
            file_size: file.size, mime_type: file.type, source: 'upload',
          } as any);
          if (insErr) throw insErr;
          setSession((s) => s.map((x) => (x.id === id ? { ...x, status: 'saved' } : x)));
        } catch (e) {
          failed++;
          setSession((s) => s.map((x) => (x.id === id ? { ...x, status: 'local' } : x)));
        }
      }
      qc.invalidateQueries({ queryKey: ['editor-media'] });
      if (failed) toast({ title: 'Added to your design', description: `${failed} file(s) couldn’t be saved to your library — they’re still on the canvas.`, variant: 'destructive' });
      else toast({ title: 'Added to your design', description: user ? 'Also saved to your camera roll.' : 'Sign in to keep uploads in your library.' });
    } finally {
      setBusy(false);
      [rollRef, cameraRef, filesRef].forEach((r) => { if (r.current) r.current.value = ''; });
    }
  };

  const consumed = useRef<FileList | File[] | null>(null);
  useEffect(() => {
    if (!pendingFiles?.length || pendingFiles === consumed.current) return;
    consumed.current = pendingFiles;
    void upload(pendingFiles).finally(() => onPendingConsumed?.());
  }, [pendingFiles]);

  const tile = 'flex flex-col items-center justify-center gap-1.5 rounded-lg bg-[#3D3D3D] py-3 text-[11px] font-medium text-[#CCCCCC] hover:bg-[#474747] disabled:opacity-60';

  return (
    <div className={`relative ${embedded ? 'flex h-full min-h-0 flex-col' : PANEL}`}>
      {!embedded && <div className={HEAD}><h2 className={H2}>Uploads</h2></div>}
      <div
        className={`flex-1 min-h-0 overflow-y-auto p-3 ${dragOver ? 'ring-2 ring-inset ring-[#6E56F5]' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
      >
        <input ref={rollRef} type="file" multiple accept="image/*" hidden onChange={(e) => upload(e.target.files)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => upload(e.target.files)} />
        <input ref={filesRef} type="file" multiple accept="image/*,video/*,audio/*" hidden onChange={(e) => upload(e.target.files)} />
        <SelectedBanner
          selected={selected}
          hint={selected?.type === 'image'
            ? 'Picking a photo will replace this image layer.'
            : 'Photos you pick are added to the canvas as new layers.'}
        />
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => rollRef.current?.click()}
            disabled={busy}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6E56F5] text-xs font-semibold text-white hover:bg-[#5E48E6] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            {busy ? 'Adding…' : 'Camera roll'}
          </button>
          <button
            type="button"
            onClick={() => { setAlbumName(''); setAlbumOpen(true); }}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3D3D3D] text-xs font-semibold text-white hover:bg-[#474747]"
          >
            <Plus className="h-4 w-4" /> New album
          </button>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button className={tile} disabled={busy} onClick={() => cameraRef.current?.click()}>
            <Plus className="h-4 w-4" /> Take photo
          </button>
          <button className={tile} disabled={busy} onClick={() => filesRef.current?.click()}>
            <Upload className="h-4 w-4" /> Video & audio
          </button>
        </div>

        {session.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold text-[#CCCCCC]">Just added</p>
            <div className="grid grid-cols-3 gap-2">
              {session.map((s) => (
                <button key={s.id} onClick={() => place(s.src)} title={s.name}
                  className="relative aspect-square overflow-hidden rounded-lg bg-[#3D3D3D]">
                  <img src={s.src} alt={s.name} className="h-full w-full object-cover" />
                  {s.status === 'uploading' && <span className="absolute inset-0 flex items-center justify-center bg-black/40"><Loader2 className="h-4 w-4 animate-spin text-white" /></span>}
                  {s.status === 'local' && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-amber-300">Not saved</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([['roll', 'Camera roll'], ['all', 'All uploads']] as const).map(([k, label]) => (
            <button key={k} onClick={() => { setView(k); setActiveAlbumId(null); }}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] ${!activeAlbum && view === k ? 'bg-primary text-primary-foreground' : 'bg-[#3D3D3D] text-[#CCCCCC]'}`}>
              {label}
            </button>
          ))}
          {albums.map((album) => (
            <button key={album.id} onClick={() => setActiveAlbumId(album.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] ${activeAlbumId === album.id ? 'bg-primary text-primary-foreground' : 'bg-[#3D3D3D] text-[#CCCCCC]'}`}>
              {album.name}
            </button>
          ))}
        </div>
        <SearchField value={q} onChange={setQ} placeholder="Search uploads" />
        {!user && <EmptyState>Sign in to keep your photos in your camera roll across sessions.</EmptyState>}
        {user && isLoading && <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg bg-[#3D3D3D]" />)}</div>}
        {user && !isLoading && visibleRows.length === 0 && (
          <EmptyState>
            {activeAlbum
              ? `No photos in “${activeAlbum.name}” yet. Open Camera roll and tap a heart to add one.`
              : 'No photos yet. Pick some from your camera roll or drop them here.'}
          </EmptyState>
        )}
        <MediaGrid rows={visibleRows} canvas={canvas} onChanged={onChanged} selected={selected} marked={marked} onToggleMark={toggleMark} />
      </div>
      {albumOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-6" role="dialog" aria-modal="true" aria-labelledby="new-album-title">
          <div className="w-full max-w-[280px] overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-2xl">
            <div className="px-4 pb-4 pt-5 text-center">
              <h2 id="new-album-title" className="text-base font-semibold">New Album</h2>
              <p className="mt-1 text-xs text-neutral-500">Enter a name for this album.</p>
              <input
                autoFocus
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveAlbum(); }}
                className="mt-3 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 outline-none focus:border-[#6E56F5]"
              />
            </div>
            <div className="grid grid-cols-2 border-t border-neutral-200">
              <button type="button" onClick={() => setAlbumOpen(false)} className="h-11 text-sm font-medium text-[#6E56F5]">Cancel</button>
              <button type="button" onClick={saveAlbum} className="h-11 border-l border-neutral-200 text-sm font-semibold text-[#6E56F5]">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================ ELEMENTS ============================ */
export const ElementsPanel: React.FC<{ canvas: FabricCanvas | null; onChanged?: () => void; brandColors?: string[]; selected?: any }> = ({
  canvas, onChanged, brandColors = [], selected,
}) => {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [fill, setFill] = useState(brandColors[0] || '#6E56F5');
  const photos = useMediaRows(['image']);

  // Keep the swatch in sync with whatever layer is selected on the canvas.
  useEffect(() => {
    const f = selected?.fill ?? selected?.stroke;
    if (typeof f === 'string' && /^#[0-9a-f]{3,8}$/i.test(f)) setFill(f);
  }, [selected]);

  const applyToSelected = (c: string) => {
    if (!canvas || !selected || isOverlayScrim(selected)) return;
    if (selected.type === 'line') selected.set({ stroke: c });
    else selected.set({ fill: c });
    canvas.requestRenderAll();
    onChanged?.();
  };

  const setOpacity = (v: number) => {
    if (!canvas || !selected) return;
    selected.set({ opacity: v });
    canvas.requestRenderAll();
    onChanged?.();
  };
  const query = q.trim().toLowerCase();
  const catalog = Object.entries(ELEMENT_LABELS).map(([id, label]) => ({ id, label }));
  const activeCategory = ELEMENT_CATEGORIES.find((entry) => entry.id === category) ?? null;
  const items = (query
    ? catalog.filter((item) => item.label.toLowerCase().includes(query))
    : activeCategory
      ? activeCategory.items.map((id) => ({ id, label: ELEMENT_LABELS[id] }))
      : []
  );

  const add = (id: string) => {
    if (!canvas) return;
    let obj: any;
    switch (id) {
      case 'rectangle': obj = new Rect({ left: 80, top: 80, width: 200, height: 120, fill }); break;
      case 'rounded': obj = new Rect({ left: 80, top: 80, width: 200, height: 120, rx: 24, ry: 24, fill }); break;
      case 'circle': obj = new FCircle({ left: 80, top: 80, radius: 70, fill }); break;
      case 'triangle': obj = new Triangle({ left: 80, top: 80, width: 140, height: 130, fill }); break;
      case 'line': obj = new Line([0, 0, 240, 0], { left: 80, top: 140, stroke: fill, strokeWidth: 6 }); break;
      case 'badge': obj = new Rect({ left: 80, top: 80, width: 220, height: 48, rx: 24, ry: 24, fill }); break;
      case 'frame': obj = new Rect({ left: 80, top: 80, width: 220, height: 220, fill: 'transparent', stroke: fill, strokeWidth: 6 }); break;
      case 'star': {
        const pts = Array.from({ length: 10 }, (_, i) => {
          const r = i % 2 === 0 ? 70 : 30;
          const a = (Math.PI / 5) * i - Math.PI / 2;
          return { x: Math.cos(a) * r, y: Math.sin(a) * r };
        });
        obj = new Polygon(pts, { left: 80, top: 80, fill });
        break;
      }
      case 'grid-2':
      case 'grid-3':
      case 'grid-hero': {
        const cells = id === 'grid-3'
          ? [0, 1, 2].map((i) => new Rect({ left: i * 108, top: 0, width: 100, height: 160, fill, stroke: '#ffffff', strokeWidth: 4 }))
          : id === 'grid-hero'
            ? [
                new Rect({ left: 0, top: 0, width: 240, height: 140, fill, stroke: '#ffffff', strokeWidth: 4 }),
                new Rect({ left: 0, top: 148, width: 240, height: 48, fill: '#111111', rx: 8, ry: 8 }),
              ]
            : [0, 1].map((i) => new Rect({ left: i * 128, top: 0, width: 120, height: 180, fill, stroke: '#ffffff', strokeWidth: 4 }));
        obj = new Group(cells, { left: 40, top: 40 });
        break;
      }
      default: return;
    }
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    onChanged?.();
  };

  const swatches = [...new Set([...(brandColors || []), '#6E56F5', '#FFFFFF', '#000000', '#EF4444', '#F59E0B', '#10B981'])].slice(0, 8);

  return (
    <div className={PANEL}>
      <div className={HEAD}><h2 className={H2}>Elements</h2></div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <SelectedBanner selected={selected} hint="Colour and opacity below apply to this layer instantly." />
        {selected && !isOverlayScrim(selected) && (
          <div className="mb-4 space-y-2 rounded-lg border border-[#3D3D3D] bg-[#1A1A1A] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#888888]">Selected layer</p>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...(brandColors || []), '#6E56F5', '#FFFFFF', '#000000', '#EF4444', '#F59E0B', '#10B981'])].slice(0, 8).map((c) => (
                <button key={`sel-${c}`} onClick={() => { setFill(c); applyToSelected(c); }}
                  className="h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: c }} title={`Apply ${c}`} />
              ))}
            </div>
            <label className="block text-[10px] text-[#888888]">
              Opacity
              <input type="range" min={0} max={1} step={0.05}
                defaultValue={typeof selected.opacity === 'number' ? selected.opacity : 1}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="mt-1 w-full accent-primary" />
            </label>
          </div>
        )}
        <SearchField value={q} onChange={setQ} placeholder="Search elements" />
        {activeCategory && !query && (
          <button type="button" onClick={() => setCategory(null)} className="mb-3 flex items-center gap-1 text-xs font-semibold text-white">
            <ChevronLeft className="h-4 w-4" /> {activeCategory.label}
          </button>
        )}
        {!activeCategory && !query && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {ELEMENT_CATEGORIES.map((entry) => (
              <button key={entry.id} type="button" onClick={() => setCategory(entry.id)}
                className="rounded-xl bg-[#3D3D3D] px-3 py-4 text-left text-sm font-semibold text-white hover:bg-[#4D4D4D]">
                {entry.label}
                <span className="mt-1 block text-[11px] font-normal text-[#AAAAAA]">
                  {entry.id === 'photos' ? 'From your library' : `${entry.items.length} to place`}
                </span>
              </button>
            ))}
          </div>
        )}
        {category === 'photos' && !query && (
          photos.data?.length ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.data.filter((row) => row.file_url).map((row) => (
                <button key={row.id} type="button" onClick={() => addImageToCanvas(canvas, row.file_url as string, onChanged)}
                  className="aspect-square overflow-hidden rounded-lg bg-[#3D3D3D]">
                  <img src={row.thumbnail_url || row.file_url} alt={row.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState>{photos.isLoading ? 'Loading your photos…' : 'No photos yet. Use Camera Roll to add one.'}</EmptyState>
          )
        )}
        {(query || (activeCategory && activeCategory.id !== 'photos')) && (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {swatches.map((c) => (
                <button key={c} type="button" onClick={() => setFill(c)}
                  className={`h-7 w-7 rounded-full border ${fill === c ? 'ring-2 ring-[#6E56F5]' : 'border-white/20'}`}
                  style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
            {items.map((i) => (
              <button key={i.id} onClick={() => add(i.id)}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-[#3D3D3D] text-[10px] text-[#CCCCCC] hover:bg-[#4D4D4D]">
                <span className="block h-7 w-7 rounded" style={{
                  backgroundColor: i.id === 'frame' || i.id === 'line' ? 'transparent' : fill,
                  border: i.id === 'frame' ? `3px solid ${fill}` : undefined,
                  borderRadius: i.id === 'circle' ? '9999px' : i.id === 'rounded' || i.id === 'badge' || i.id.startsWith('grid') ? '8px' : undefined,
                  height: i.id === 'line' ? 3 : undefined,
                  borderBottom: i.id === 'line' ? `3px solid ${fill}` : undefined,
                  clipPath: i.id === 'triangle' ? 'polygon(50% 0,100% 100%,0 100%)' : i.id === 'star'
                    ? 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' : undefined,
                }} />
                {i.label}
              </button>
            ))}
            </div>
          </>
        )}
        {query && items.length === 0 && <EmptyState>No elements match “{q}”.</EmptyState>}
      </div>
    </div>
  );
};

/* ============================ BACKGROUND ============================ */
export const BackgroundPanel: React.FC<{ canvas: FabricCanvas | null; onChanged?: () => void; brandColors?: string[]; selected?: any }> = ({
  canvas, onChanged, brandColors = [], selected,
}) => {
  const [target, setTarget] = useState<'canvas' | 'layer'>('canvas');
  useEffect(() => { if (!selected) setTarget('canvas'); }, [selected]);
  const [current, setCurrent] = useState<string>((canvas?.backgroundColor as string) || '#FFFFFF');
  const rows = [
    ['#000000', '#555555', '#888888', '#BBBBBB', '#DDDDDD', '#FFFFFF'],
    ['#FF0000', '#FF6B6B', '#FF69B4', '#FFB6C1', '#E6E6FA', '#800080'],
    ['#008080', '#00CED1', '#87CEEB', '#0000FF', '#4B0082', '#000080'],
    ['#FFA500', '#FFD700', '#FFFF00', '#00FF00', '#008000', '#006400'],
  ];

  const apply = (c: string) => {
    if (!canvas) return;
    if (target === 'layer' && selected && !isOverlayScrim(selected)) {
      if (selected.type === 'line') selected.set({ stroke: c });
      else selected.set({ fill: c });
      canvas.requestRenderAll();
      setCurrent(c);
      onChanged?.();
      return;
    }
    canvas.backgroundColor = c;
    canvas.requestRenderAll();
    setCurrent(c);
    onChanged?.();
  };

  const designColors = useMemo(() => {
    const set = new Set<string>();
    canvas?.getObjects().forEach((o: any) => {
      if (typeof o.fill === 'string' && o.fill.startsWith('#')) set.add(o.fill);
      if (typeof o.stroke === 'string' && o.stroke.startsWith('#')) set.add(o.stroke);
    });
    return Array.from(set).slice(0, 8);
  }, [canvas, current]);

  return (
    <div className={PANEL}>
      <div className={HEAD}><h2 className={H2}>Background</h2></div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <SelectedBanner selected={selected} hint="Choose whether colours below fill the canvas or this layer." />
        {selected && !isOverlayScrim(selected) && (
          <div className="mb-4 grid grid-cols-2 gap-1.5">
            {(['canvas', 'layer'] as const).map((t) => (
              <button key={t} onClick={() => setTarget(t)}
                className={`rounded-lg px-3 py-2 text-[11px] font-semibold capitalize ${target === t ? 'bg-primary text-primary-foreground' : 'bg-[#3D3D3D] text-[#CCCCCC]'}`}>
                {t === 'canvas' ? 'Canvas background' : 'Selected layer'}
              </button>
            ))}
          </div>
        )}
        <p className="mb-2 text-sm font-semibold text-white">
          {target === 'layer' ? 'Current layer colour' : 'Current background'}
        </p>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg border border-white/20" style={{ backgroundColor: current }} />
          <input
            type="color" value={/^#[0-9a-f]{6}$/i.test(current) ? current : '#ffffff'}
            onChange={(e) => apply(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded-lg border border-[#555555] bg-[#3D3D3D]"
          />
          <button onClick={() => apply('#FFFFFF')} className="flex h-9 items-center gap-1 rounded-lg border border-[#555555] px-3 text-xs text-[#CCCCCC]">
            <X className="h-3 w-3" /> Reset
          </button>
        </div>

        {brandColors.length > 0 && (
          <>
            <p className="mb-2 text-sm font-semibold text-white">Brand colours</p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {brandColors.map((c) => (
                <button key={c} onClick={() => apply(c)} className="h-8 w-8 rounded-full border border-white/10" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </>
        )}

        <p className="mb-2 text-sm font-semibold text-white">Colours in this design</p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-[#666666] text-[#888888]"><Pipette className="h-3.5 w-3.5" /></span>
          {designColors.length ? designColors.map((c) => (
            <button key={c} onClick={() => apply(c)} className="h-8 w-8 rounded-full border border-white/10" style={{ backgroundColor: c }} title={c} />
          )) : <span className="self-center text-xs text-[#888888]">Add objects to see their colours here.</span>}
        </div>

        <p className="mb-2 text-sm font-semibold text-white">Default solid colours</p>
        {rows.map((row, ri) => (
          <div key={ri} className="mb-1.5 grid grid-cols-6 gap-1.5">
            {row.map((c) => (
              <button key={c} onClick={() => apply(c)} className="aspect-square rounded-lg transition-all hover:scale-105 hover:ring-2 hover:ring-white" style={{ backgroundColor: c }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================ AI STUDIO ============================ */
const AI_TABS = [
  { id: 'images', label: 'Images' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'videos', label: 'Videos' },
  { id: '3d', label: '3D' },
] as const;

type AITabId = (typeof AI_TABS)[number]['id'];

const GENERATE_LABEL: Record<AITabId, string> = {
  images: 'Generate images',
  graphics: 'Generate graphics',
  videos: 'Generate video',
  '3d': 'Generate 3D',
};

export const AIStudioPanel: React.FC<{
  canvas: FabricCanvas | null;
  onChanged?: () => void;
  platform?: string | null;
  category?: string | null;
  selected?: any;
}> = ({ canvas, onChanged, platform, selected }) => {
  const [activeTab, setActiveTab] = useState<AITabId>('images');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const canGenerate = prompt.trim().length >= 5 && !busy;

  const generate = async () => {
    if (!canGenerate) return;
    setBusy(true);
    try {
      if (activeTab === 'videos') {
        const { data, error } = await supabase.functions.invoke('generate-ad-video', {
          body: {
            product: prompt.trim(),
            platform: (platform || 'instagram').toLowerCase(),
            adContent: { headline: prompt.trim() },
          },
        });
        if (error) throw error;
        const url = data?.videoUrl || data?.url || data?.video || data?.data?.[0]?.url;
        if (!url) throw new Error('No video returned');
        setResults((r) => [url, ...r].slice(0, 6));
      } else {
        const { data, error } = await supabase.functions.invoke('generate-ad-image', {
          body: { product: prompt.trim(), platform: (platform || 'instagram').toLowerCase(), adContent: { headline: prompt.trim() } },
        });
        if (error) throw error;
        const url = data?.imageUrl || data?.url || data?.image || data?.data?.[0]?.url;
        if (!url) throw new Error('No image returned');
        setResults((r) => [url, ...r].slice(0, 6));
      }
      toast({ title: activeTab === 'videos' ? 'Video ready' : 'Image ready', description: 'Click it to place it on the canvas.' });
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e?.message ?? 'Try a more descriptive prompt.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const placeResult = (url: string) => {
    if (selected && selected.type === 'image') replaceImageSource(canvas, selected, url, onChanged);
    else addImageToCanvas(canvas, url, onChanged);
  };

  return (
    <div className={PANEL}>
      <div className={HEAD}>
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-white">AI Studio</h2>
          <Info className="h-[18px] w-[18px] text-[#888888]" />
        </div>
      </div>

      <div className="flex border-b border-[#3D3D3D]">
        {AI_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={[
              'px-3 py-2 text-[13px] transition-colors',
              activeTab === t.id
                ? 'font-semibold text-white border-b-2 border-[#6E56F5]'
                : 'font-normal text-[#888888] hover:text-white/80',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-[13px] font-semibold text-white">Describe what you want to create</p>
          {(activeTab === 'videos' || activeTab === '3d') && (
            <span className="rounded bg-[#3D3D3D] px-1.5 py-0.5 text-[10px] text-[#CCCCCC]">Beta</span>
          )}
        </div>

        <div className="relative mb-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter 5+ words to describe..."
            className="h-[100px] w-full resize-none rounded-lg border border-[#555555] bg-[#3D3D3D] p-3 text-[13px] text-white placeholder:text-[#888888] outline-none"
          />
          <button
            onClick={() => setPrompt('Elegant product photography, soft studio light, premium cinematic look')}
            className="absolute bottom-2 left-2 flex h-[30px] items-center gap-1.5 rounded-full border border-[#555555] bg-[#2D2D2D] px-3 text-xs text-[#CCCCCC]"
          >
            💡 Inspire me
          </button>
        </div>

        {activeTab === 'images' && (
          <>
            <div className="mb-4 flex gap-2">
              <button className="flex h-[34px] items-center gap-2 rounded-lg border border-[#555555] px-3 text-xs text-white">🖼 Styles</button>
              <button className="flex h-[34px] items-center gap-2 rounded-lg border border-[#555555] px-3 text-xs text-white">⊡ Square</button>
            </div>

            <p className="mb-2 mt-4 text-xs font-semibold text-white">Created by AI Studio</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {results.length > 0
                ? results.slice(0, 3).map((url) => (
                  <button key={url} onClick={() => placeResult(url)} className="h-20 min-w-[80px] flex-1 overflow-hidden rounded-lg">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))
                : [1, 2, 3].map((i) => (
                  <div key={i} className="h-20 min-w-[80px] flex-1 rounded-lg bg-gradient-to-br from-primary to-primary-glow" />
                ))}
            </div>
          </>
        )}

        {(activeTab === 'videos' || activeTab === '3d') && (
          <div className="mt-3 rounded-lg bg-[#2D2D2D] p-3">
            <p className="text-[13px] font-semibold text-white">🚩 This is experimental new technology</p>
            <p className="mt-1 text-xs text-[#888888]">
              {activeTab === 'videos'
                ? 'Scenes with people or animals may not look quite right.'
                : 'Some objects may not look quite right.'}
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-white">Generated in this session</p>
            <div className="grid grid-cols-3 gap-1.5">
              {results.map((url) => (
                <button
                  key={url}
                  onClick={() => placeResult(url)}
                  className="aspect-square overflow-hidden rounded-lg border border-[#3D3D3D] hover:border-primary"
                >
                  {activeTab === 'videos'
                    ? <video src={url} className="h-full w-full object-cover" />
                    : <img src={url} alt="AI result" className="h-full w-full object-cover" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#3D3D3D] p-4">
        <button
          onClick={generate}
          disabled={!canGenerate}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold transition-colors ${
            canGenerate ? 'bg-primary text-primary-foreground hover:bg-[#5E48E6]' : 'bg-[#2D2D2D] text-[#CCCCCC]'
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Generating…' : GENERATE_LABEL[activeTab]}
        </button>
      </div>
    </div>
  );
};
