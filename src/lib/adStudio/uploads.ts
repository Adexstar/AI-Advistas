// Files attached on the opening screen. They go to the private `media-library`
// bucket (owner folder) and into `media_assets`, so the editor's Uploads panel
// sees them too.

import { supabase } from '@/integrations/supabase/client';
import { signedMediaUrl } from '@/lib/mediaUrl';
import type { AttachedFile, FileKind } from './sessions';

export const MAX_IMAGE_MB = 15;
export const MAX_VIDEO_MB = 100;

export const ACCEPT: Record<Exclude<FileKind, 'design'>, string> = {
  image: 'image/png,image/jpeg,image/webp,image/gif',
  video: 'video/mp4,video/quicktime,video/webm',
  logo: 'image/png,image/jpeg,image/webp,image/svg+xml',
};

export function checkFile(file: File, kind: Exclude<FileKind, 'design'>): string | null {
  const wantsVideo = kind === 'video';
  if (wantsVideo && !file.type.startsWith('video/')) return `${file.name} is not a video.`;
  if (!wantsVideo && !file.type.startsWith('image/')) return `${file.name} is not an image.`;
  const limit = wantsVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (file.size > limit * 1024 * 1024) return `${file.name} is larger than ${limit} MB.`;
  return null;
}

const attachmentId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `file-${Math.random().toString(36).slice(2, 10)}`;

export async function uploadAttachment(userId: string, file: File, kind: Exclude<FileKind, 'design'>): Promise<AttachedFile> {
  const problem = checkFile(file, kind);
  if (problem) throw new Error(problem);
  const safe = file.name.replace(/[^\w.-]+/g, '_');
  const path = `${userId}/ad-studio/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from('media-library').upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const url = await signedMediaUrl(path);
  // Best effort: the editor's Uploads panel reads this table.
  await supabase.from('media_assets').insert({
    user_id: userId,
    name: file.name,
    type: kind === 'video' ? 'video' : 'image',
    file_path: path,
    file_url: url,
    file_size: file.size,
    mime_type: file.type,
    source: 'upload',
  } as never);
  return { id: attachmentId(), kind, name: file.name, url, path, mime: file.type };
}

export function designAttachment(design: { id: string; name: string; preview_url: string | null }): AttachedFile {
  return { id: attachmentId(), kind: 'design', name: design.name || 'Design', url: design.preview_url || '', designId: design.id };
}

/** Pictures usable as scene images: product photos and design previews. */
export function imageUrlsOf(files: AttachedFile[]): string[] {
  return files.filter((file) => (file.kind === 'image' || file.kind === 'design') && file.url).map((file) => file.url);
}

export function logoUrlOf(files: AttachedFile[]): string | null {
  return files.find((file) => file.kind === 'logo' && file.url)?.url ?? null;
}
