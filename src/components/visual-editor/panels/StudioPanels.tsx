// Data-driven left panels for the Visual Editor (Creative Studio).
// Visual language matches the existing dark editor chrome — only the
// content is now real (Supabase templates, media library, live canvas ops).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Circle as FCircle, Triangle, Line, Polygon, FabricImage } from 'fabric';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { signedMediaUrl } from '@/lib/mediaUrl';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Upload, Loader2, ImageIcon, Video, Music, FileText, Pipette, Plus, X, Info,
} from 'lucide-react';

const PANEL = 'flex h-full min-h-0 flex-col bg-[#2D2D2D]';
const HEAD = 'px-4 py-3 border-b border-[#3D3D3D]';
const H2 = 'text-base font-bold text-white';
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
    <div className="mb-3 rounded-lg border border-[#6C63FF]/40 bg-[#6C63FF]/10 p-2.5">
      <p className="text-[11px] font-semibold text-white">{layerLabel(selected)}</p>
      <p className="mt-0.5 text-[10px] leading-relaxed text-[#BBBBBB]">{hint}</p>
    </div>
  );
};

async function addImageToCanvas(canvas: FabricCanvas | null, url: string, onChanged?: () => void) {
  if (!canvas) return;
  try {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    const maxW = (canvas.getWidth() || 800) * 0.6;
    if (img.width && img.width > maxW) img.scale(maxW / img.width);
    img.set({ left: 40, top: 40 });
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    onChanged?.();
  } catch {
    toast({ title: 'Could not load image', description: 'The asset could not be added to the canvas.', variant: 'destructive' });
  }
}

async function replaceImageSource(canvas: FabricCanvas | null, target: any, url: string, onChanged?: () => void) {
  if (!canvas || !target) return;
  try {
    const next = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    const w = target.getScaledWidth?.() ?? target.width ?? 200;
    if (next.width) next.scale(w / next.width);
    next.set({ left: target.left, top: target.top, angle: target.angle ?? 0 });
    const idx = canvas.getObjects().indexOf(target);
    canvas.remove(target);
    canvas.add(next);
    if (idx >= 0) (canvas as any).moveObjectTo?.(next, idx);
    canvas.setActiveObject(next);
    canvas.requestRenderAll();
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
  popularity_score?: number | null;
};

export const TemplatesPanel: React.FC<{ onUse: (t: StudioTemplate) => void }> = ({ onUse }) => {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  const { data, isLoading, error } = useQuery({
    queryKey: ['editor-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id,name,description,category,platform,preview_url,thumbnail_url,template_json,popularity_score')
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

  return (
    <div className={PANEL}>
      <div className={HEAD}><h2 className={H2}>Templates</h2></div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <SearchField value={q} onChange={setQ} placeholder="Search templates" />
        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                cat === c ? 'bg-[#6C63FF] text-white' : 'bg-[#3D3D3D] text-[#CCCCCC] hover:bg-[#4D4D4D]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg bg-[#3D3D3D]" />)}
          </div>
        )}
        {error && <EmptyState>Couldn’t load templates. Check your connection and try again.</EmptyState>}
        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState>No templates match “{q || cat}”. Try another search or category.</EmptyState>
        )}

        <div className="grid grid-cols-2 gap-2">
          {filtered.map((t) => {
            const src = t.preview_url || t.thumbnail_url;
            return (
              <button
                key={t.id}
                onClick={() => onUse(t)}
                className="group relative aspect-square w-full overflow-hidden rounded-lg border border-[#3D3D3D] bg-[#1A1A1A] text-left hover:border-[#6C63FF] transition-colors"
              >
                {src ? (
                  <img src={src} alt={t.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#3D3D3D] to-[#1A1A1A] px-2 text-center text-[10px] font-semibold text-white">
                    {t.name}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1">
                  <span className="block truncate text-[10px] font-medium text-white">{t.name}</span>
                  {t.category && <span className="block truncate text-[9px] text-[#AAAAAA]">{t.category}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================ MEDIA / UPLOADS ============================ */
type MediaRow = {
  id: string; name: string; type: string; file_url: string | null; thumbnail_url: string | null; created_at: string;
};

const MediaGrid: React.FC<{ rows: MediaRow[]; canvas: FabricCanvas | null; onChanged?: () => void; selected?: any }> = ({ rows, canvas, onChanged, selected }) => (
  <div className="grid grid-cols-3 gap-2">
    {rows.map((m) => {
      const src = m.thumbnail_url || m.file_url;
      const Icon = m.type === 'video' ? Video : m.type === 'audio' ? Music : m.type === 'document' ? FileText : ImageIcon;
      return (
        <button
          key={m.id}
          onClick={() => {
            if (!m.file_url || m.type !== 'image') { toast({ title: m.name, description: `${m.type} assets can be placed from the timeline.` }); return; }
            if (selected && selected.type === 'image') { replaceImageSource(canvas, selected, m.file_url, onChanged); return; }
            addImageToCanvas(canvas, m.file_url, onChanged);
          }}
          className="group relative aspect-square overflow-hidden rounded-lg border border-[#3D3D3D] bg-[#1A1A1A] hover:border-[#6C63FF]"
          title={m.name}
        >
          {src && m.type === 'image' ? (
            <img src={src} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#888888]">
              <Icon className="h-4 w-4" />
              <span className="px-1 text-[9px] truncate w-full text-center">{m.name}</span>
            </div>
          )}
        </button>
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

export const MediaPanel: React.FC<{ canvas: FabricCanvas | null; onChanged?: () => void; selected?: any }> = ({ canvas, onChanged, selected }) => {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const { data, isLoading, error } = useMediaRows();
  const rows = (data ?? []).filter(
    (m) => (kind === 'all' || m.type === kind) && m.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className={PANEL}>
      <div className={HEAD}><h2 className={H2}>Media</h2></div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
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
              className={`rounded-full px-3 py-1 text-[11px] capitalize ${kind === k ? 'bg-[#6C63FF] text-white' : 'bg-[#3D3D3D] text-[#CCCCCC]'}`}
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

export const UploadsPanel: React.FC<{ canvas: FabricCanvas | null; onChanged?: () => void; selected?: any }> = ({ canvas, onChanged, selected }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const { data, isLoading } = useMediaRows();
  const rows = (data ?? []).filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()));

  const upload = async (files: FileList | null) => {
    if (!files?.length || !user?.id) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('media-library').upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const url = await signedMediaUrl(path);
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'document';
        await supabase.from('media_assets').insert({
          user_id: user.id, name: file.name, type, file_path: path, file_url: url,
          file_size: file.size, mime_type: file.type, source: 'upload',
        } as any);
        if (type === 'image') {
          if (selected && selected.type === 'image') await replaceImageSource(canvas, selected, url, onChanged);
          else await addImageToCanvas(canvas, url, onChanged);
        }
      }
      qc.invalidateQueries({ queryKey: ['editor-media'] });
      toast({ title: 'Upload complete', description: 'Your files are in the media library.' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message ?? 'Try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={PANEL}>
      <div className={HEAD}><h2 className={H2}>Uploads</h2></div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <input ref={inputRef} type="file" multiple accept="image/*,video/*,audio/*" hidden onChange={(e) => upload(e.target.files)} />
        <SelectedBanner
          selected={selected}
          hint={selected?.type === 'image'
            ? 'Uploads and library items will replace this image layer.'
            : 'Uploads will be added to the canvas as new layers.'}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy || !user}
          className="mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#6C63FF] text-sm font-semibold text-white hover:bg-[#5B52E0] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? 'Uploading…' : 'Upload files'}
        </button>
        <SearchField value={q} onChange={setQ} placeholder="Search uploads" />
        {isLoading && <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg bg-[#3D3D3D]" />)}</div>}
        {!isLoading && rows.length === 0 && <EmptyState>Nothing uploaded yet. Add images, video or audio to use them on the canvas.</EmptyState>}
        <MediaGrid rows={rows} canvas={canvas} onChanged={onChanged} selected={selected} />
      </div>
    </div>
  );
};

/* ============================ ELEMENTS ============================ */
const ELEMENT_ITEMS = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'line', label: 'Line' },
  { id: 'star', label: 'Star' },
  { id: 'badge', label: 'Badge bar' },
  { id: 'frame', label: 'Frame' },
] as const;

export const ElementsPanel: React.FC<{ canvas: FabricCanvas | null; onChanged?: () => void; brandColors?: string[]; selected?: any }> = ({
  canvas, onChanged, brandColors = [], selected,
}) => {
  const [q, setQ] = useState('');
  const [fill, setFill] = useState(brandColors[0] || '#6C63FF');

  // Keep the swatch in sync with whatever layer is selected on the canvas.
  useEffect(() => {
    const f = selected?.fill ?? selected?.stroke;
    if (typeof f === 'string' && /^#[0-9a-f]{3,8}$/i.test(f)) setFill(f);
  }, [selected]);

  const applyToSelected = (c: string) => {
    if (!canvas || !selected) return;
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
  const items = ELEMENT_ITEMS.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase()));

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
      default: return;
    }
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    onChanged?.();
  };

  const swatches = [...new Set([...(brandColors || []), '#6C63FF', '#FFFFFF', '#000000', '#EF4444', '#F59E0B', '#10B981'])].slice(0, 8);

  return (
    <div className={PANEL}>
      <div className={HEAD}><h2 className={H2}>Elements</h2></div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <SelectedBanner selected={selected} hint="Colour and opacity below apply to this layer instantly." />
        {selected && (
          <div className="mb-4 space-y-2 rounded-lg border border-[#3D3D3D] bg-[#1A1A1A] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#888888]">Selected layer</p>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...(brandColors || []), '#6C63FF', '#FFFFFF', '#000000', '#EF4444', '#F59E0B', '#10B981'])].slice(0, 8).map((c) => (
                <button key={`sel-${c}`} onClick={() => { setFill(c); applyToSelected(c); }}
                  className="h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: c }} title={`Apply ${c}`} />
              ))}
            </div>
            <label className="block text-[10px] text-[#888888]">
              Opacity
              <input type="range" min={0} max={1} step={0.05}
                defaultValue={typeof selected.opacity === 'number' ? selected.opacity : 1}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="mt-1 w-full accent-[#6C63FF]" />
            </label>
          </div>
        )}
        <SearchField value={q} onChange={setQ} placeholder="Search elements" />
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#888888]">Fill colour for new shapes</p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {swatches.map((c) => (
            <button key={c} onClick={() => setFill(c)}
              className={`h-7 w-7 rounded-full border ${fill === c ? 'ring-2 ring-[#6C63FF]' : 'border-white/20'}`}
              style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#888888]">Shapes & graphics</p>
        <div className="grid grid-cols-3 gap-2">
          {items.map((i) => (
            <button key={i.id} onClick={() => add(i.id)}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-[#3D3D3D] text-[10px] text-[#CCCCCC] hover:bg-[#4D4D4D]">
              <span className="block h-7 w-7 rounded" style={{
                backgroundColor: i.id === 'frame' || i.id === 'line' ? 'transparent' : fill,
                border: i.id === 'frame' ? `3px solid ${fill}` : undefined,
                borderRadius: i.id === 'circle' ? '9999px' : i.id === 'rounded' || i.id === 'badge' ? '8px' : undefined,
                height: i.id === 'line' ? 3 : undefined,
                borderBottom: i.id === 'line' ? `3px solid ${fill}` : undefined,
                clipPath: i.id === 'triangle' ? 'polygon(50% 0,100% 100%,0 100%)' : i.id === 'star'
                  ? 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' : undefined,
              }} />
              {i.label}
            </button>
          ))}
        </div>
        {items.length === 0 && <EmptyState>No elements match “{q}”.</EmptyState>}
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
    if (target === 'layer' && selected) {
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
        {selected && (
          <div className="mb-4 grid grid-cols-2 gap-1.5">
            {(['canvas', 'layer'] as const).map((t) => (
              <button key={t} onClick={() => setTarget(t)}
                className={`rounded-lg px-3 py-2 text-[11px] font-semibold capitalize ${target === t ? 'bg-[#6C63FF] text-white' : 'bg-[#3D3D3D] text-[#CCCCCC]'}`}>
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
                ? 'font-semibold text-white border-b-2 border-[#6C63FF]'
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
                  <div key={i} className="h-20 min-w-[80px] flex-1 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500" />
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
                  className="aspect-square overflow-hidden rounded-lg border border-[#3D3D3D] hover:border-[#6C63FF]"
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
            canGenerate ? 'bg-[#6C63FF] text-white hover:bg-[#5B52E0]' : 'bg-[#2D2D2D] text-[#CCCCCC]'
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Generating…' : GENERATE_LABEL[activeTab]}
        </button>
      </div>
    </div>
  );
};
