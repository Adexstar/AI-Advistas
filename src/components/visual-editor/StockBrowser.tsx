import React, { useState } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';
import { Loader2, Search } from 'lucide-react';
import { addTimelinePhoto, addTimelineVideo, isFrameTarget } from './placeMedia';
import { searchStock, type StockHit } from './stockSearch';
import { toast } from '@/hooks/use-toast';

type LibraryRow = { id: string; file_url?: string | null; thumbnail_url?: string | null; name?: string | null };

export const StockBrowser: React.FC<{
  kind: 'image' | 'video';
  canvas: FabricCanvas | null;
  selected?: any;
  library?: LibraryRow[];
  onChanged?: () => void;
  onPick?: (url: string) => void;
}> = ({ kind, canvas, selected, library = [], onChanged, onPick }) => {
  const [query, setQuery] = useState(kind === 'video' ? 'city' : 'portrait');
  const [hits, setHits] = useState<StockHit[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    const term = query.trim();
    if (!term) return;
    setBusy(true);
    try {
      const result = await searchStock(kind, term);
      setHits(result.hits);
      setNote(result.note);
    } finally {
      setBusy(false);
    }
  };

  const place = async (url: string) => {
    if (onPick) {
      onPick(url);
      return;
    }
    if (!canvas) return;
    const frame = isFrameTarget(selected) ? selected : null;
    try {
      if (kind === 'video') await addTimelineVideo(canvas, url, frame);
      else await addTimelinePhoto(canvas, url, frame);
      onChanged?.();
    } catch (error) {
      toast({
        title: kind === 'video' ? 'Could not add video' : 'Could not add photo',
        description: error instanceof Error ? error.message : 'The file did not load.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void search(); }}>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#888888]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={kind === 'video' ? 'Search videos' : 'Search photos'}
            className="h-9 w-full rounded-lg border border-[#555555] bg-[#3D3D3D] pl-8 pr-2 text-sm text-white outline-none"
          />
        </div>
        <button type="submit" className="h-9 rounded-lg bg-[#6E56F5] px-3 text-xs font-semibold text-white">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </button>
      </form>
      <p className="text-[11px] leading-snug text-[#AAAAAA]">
        {kind === 'video'
          ? 'Pexels and Pixabay, when the deployed search functions return video. A selected frame clips the clip.'
          : 'Pexels, Pixabay and Unsplash, plus photos already in your library. A selected frame clips the photo.'}
      </p>
      {note && <p className="rounded-lg bg-[#2A2418] px-3 py-2 text-xs leading-snug text-[#F5D7A1]">{note}</p>}
      {library.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#888888]">Your library</p>
          <div className="grid grid-cols-3 gap-2">
            {library.filter((row) => row.file_url).map((row) => (
              <button key={row.id} type="button" onClick={() => void place(row.file_url as string)} className="aspect-square overflow-hidden rounded-lg bg-[#3D3D3D]">
                <img src={row.thumbnail_url || row.file_url || ''} alt={row.name || 'Library photo'} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#666666] text-xs font-semibold text-[#DDDDDD]">
        Upload from this device
        <input
          type="file"
          accept={kind === 'video' ? 'video/*' : 'image/*'}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void place(URL.createObjectURL(file));
          }}
        />
      </label>
      {hits.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {hits.map((hit) => (
            <button key={hit.id} type="button" onClick={() => void place(hit.url)} className="aspect-square overflow-hidden rounded-lg bg-[#3D3D3D] text-left">
              {hit.thumbnailUrl ? (
                <img src={hit.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-end p-1 text-[10px] text-white">{hit.provider}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
