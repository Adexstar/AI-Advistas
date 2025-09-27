-- Create templates table for the visual editor
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  platform TEXT NOT NULL,
  thumbnail_url TEXT,
  template_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to templates
CREATE POLICY "Templates are viewable by everyone" 
ON public.templates 
FOR SELECT 
USING (true);

-- Create policy for admins to manage templates (for now, anyone can create)
CREATE POLICY "Anyone can create templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update templates" 
ON public.templates 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample templates
INSERT INTO public.templates (name, type, platform, thumbnail_url, template_json) VALUES
('Facebook Post', 'image', 'facebook', null, '{"version": "6.0.0", "objects": [{"type": "rect", "left": 50, "top": 50, "width": 300, "height": 200, "fill": "#3b82f6"}], "background": "#ffffff", "width": 1200, "height": 630}'),
('Instagram Story', 'image', 'instagram', null, '{"version": "6.0.0", "objects": [{"type": "textbox", "left": 100, "top": 300, "width": 800, "text": "Your Story Here", "fontSize": 48, "fill": "#000000"}], "background": "linear-gradient(45deg, #ff6b6b, #4ecdc4)", "width": 1080, "height": 1920}'),
('TikTok Video', 'video', 'tiktok', null, '{"aspectRatio": "9:16", "width": 1080, "height": 1920, "background": "#000000", "overlays": [{"type": "text", "text": "TikTok Ad", "position": "center"}]}'),
('YouTube Thumbnail', 'image', 'youtube', null, '{"version": "6.0.0", "objects": [{"type": "rect", "left": 0, "top": 0, "width": 1280, "height": 720, "fill": "#ff0000"}, {"type": "textbox", "left": 200, "top": 250, "width": 880, "text": "CLICK HERE", "fontSize": 72, "fill": "#ffffff", "fontWeight": "bold"}], "background": "#000000", "width": 1280, "height": 720}'),
('LinkedIn Post', 'image', 'linkedin', null, '{"version": "6.0.0", "objects": [{"type": "rect", "left": 50, "top": 50, "width": 500, "height": 300, "fill": "#0077b5"}], "background": "#f8f9fa", "width": 1200, "height": 627}');