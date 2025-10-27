-- Create table for user canvas drafts (auto-save)
CREATE TABLE public.user_canvas_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  canvas_data jsonb NOT NULL,
  template_id uuid REFERENCES public.ad_templates(id),
  last_saved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_canvas_drafts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own canvas drafts"
  ON public.user_canvas_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own canvas drafts"
  ON public.user_canvas_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own canvas drafts"
  ON public.user_canvas_drafts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own canvas drafts"
  ON public.user_canvas_drafts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_user_canvas_drafts_updated_at
  BEFORE UPDATE ON public.user_canvas_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_user_canvas_drafts_user_id ON public.user_canvas_drafts(user_id);
CREATE INDEX idx_user_canvas_drafts_template_id ON public.user_canvas_drafts(template_id);