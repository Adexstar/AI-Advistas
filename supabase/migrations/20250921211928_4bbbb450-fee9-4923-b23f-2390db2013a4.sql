-- Create generated_ads table for storing AI-generated ad content
CREATE TABLE public.generated_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('text', 'image', 'video')),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'youtube', 'linkedin')),
  content JSONB NOT NULL,
  generation_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generated_ads ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own generated ads" 
ON public.generated_ads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generated ads" 
ON public.generated_ads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated ads" 
ON public.generated_ads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated ads" 
ON public.generated_ads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_generated_ads_updated_at
BEFORE UPDATE ON public.generated_ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();