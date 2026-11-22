import { supabase } from '@/integrations/supabase/client';

export type StockHit = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  provider: string;
  kind: 'image' | 'video';
};

const PHOTO_FUNCTIONS = ['search-pexels', 'search-pixabay', 'search-unsplash'] as const;
const VIDEO_FUNCTIONS = ['search-pexels', 'search-pixabay'] as const;

export async function searchStock(kind: 'image' | 'video', query: string) {
  const names = kind === 'video' ? VIDEO_FUNCTIONS : PHOTO_FUNCTIONS;
  const hits: StockHit[] = [];
  const problems: string[] = [];
  await Promise.all(names.map(async (name) => {
    const { data, error } = await supabase.functions.invoke(name, { body: { intent: query, kind } });
    if (error || data?.error) {
      problems.push(String(data?.error || error?.message || `${name} failed`));
      return;
    }
    const rows = Array.isArray(data?.results) ? data.results : [];
    for (const row of rows) {
      if (!row?.url) continue;
      if (kind === 'video' && row.kind !== 'video') continue;
      hits.push({
        id: String(row.id ?? `${name}-${hits.length}`),
        url: String(row.url),
        thumbnailUrl: row.thumbnailUrl ? String(row.thumbnailUrl) : undefined,
        provider: String(row.provider ?? name),
        kind: kind === 'video' ? 'video' : 'image',
      });
    }
  }));
  const note = kind === 'video' && hits.length === 0
    ? 'No videos came back. Upload a clip, or redeploy search-pexels and search-pixabay so they can search video. Photo results are not shown here as if they were video.'
    : problems.length && hits.length === 0
      ? problems[0]
      : null;
  return { hits, note };
}
