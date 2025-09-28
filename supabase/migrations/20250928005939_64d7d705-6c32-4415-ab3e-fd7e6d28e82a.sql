-- Add Freepik integration support to templates table
ALTER TABLE public.templates 
ADD COLUMN template_source text DEFAULT 'internal' NOT NULL,
ADD COLUMN freepik_id text NULL,
ADD COLUMN cached_data jsonb NULL,
ADD COLUMN freepik_download_url text NULL;

-- Create index for better performance when searching by source
CREATE INDEX idx_templates_source ON public.templates(template_source);
CREATE INDEX idx_templates_freepik_id ON public.templates(freepik_id) WHERE freepik_id IS NOT NULL;