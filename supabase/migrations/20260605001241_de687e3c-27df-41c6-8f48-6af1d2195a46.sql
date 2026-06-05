
-- Extend media_assets
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS folder text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS media_assets_user_idx ON public.media_assets(user_id, created_at DESC);

-- Folders table
CREATE TABLE IF NOT EXISTS public.media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_folders TO authenticated;
GRANT ALL ON public.media_folders TO service_role;

ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own folders" ON public.media_folders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_media_folders_updated_at
  BEFORE UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
