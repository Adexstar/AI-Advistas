import { supabase } from '@/integrations/supabase/client';

/**
 * The `media-library` bucket is private and owner-scoped: files are only
 * readable by the user whose id is the first folder segment. Public URLs no
 * longer resolve, so always build a signed URL for stored media.
 */
export const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

export async function signedMediaUrl(
  path: string,
  bucket = 'media-library',
  expiresIn: number = SIGNED_URL_TTL,
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) throw error ?? new Error('Could not create signed URL');
  return data.signedUrl;
}
