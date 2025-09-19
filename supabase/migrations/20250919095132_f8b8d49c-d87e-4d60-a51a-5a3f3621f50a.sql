-- Create user_dashboards table for customizable dashboard layouts
CREATE TABLE public.user_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_dashboards ENABLE ROW LEVEL SECURITY;

-- Create policies for user_dashboards
CREATE POLICY "Users can view their own dashboard layout" 
ON public.user_dashboards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboard layout" 
ON public.user_dashboards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard layout" 
ON public.user_dashboards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard layout" 
ON public.user_dashboards 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_dashboards_updated_at
BEFORE UPDATE ON public.user_dashboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();