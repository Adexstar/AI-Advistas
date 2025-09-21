-- Create ad_simulations table for AI scoring
CREATE TABLE public.ad_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID,
  user_id UUID NOT NULL,
  score JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_simulations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own ad simulations"
ON public.ad_simulations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ad simulations"
ON public.ad_simulations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad simulations"
ON public.ad_simulations
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_ad_simulations_user_id ON public.ad_simulations(user_id);
CREATE INDEX idx_ad_simulations_ad_id ON public.ad_simulations(ad_id);