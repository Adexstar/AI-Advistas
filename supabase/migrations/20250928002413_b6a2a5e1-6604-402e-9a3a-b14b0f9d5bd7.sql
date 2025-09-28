-- Create AI suggestions table to store AI-generated copy, colors, and design suggestions
CREATE TABLE public.ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.templates(id),
  suggestions JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggestion_type TEXT NOT NULL DEFAULT 'copy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own AI suggestions" 
ON public.ai_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI suggestions" 
ON public.ai_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI suggestions" 
ON public.ai_suggestions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI suggestions" 
ON public.ai_suggestions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_ai_suggestions_updated_at
BEFORE UPDATE ON public.ai_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();