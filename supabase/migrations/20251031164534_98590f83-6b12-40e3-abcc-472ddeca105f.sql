-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Only admins can assign roles (will work after first admin is manually inserted)
CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can create templates" ON templates;
DROP POLICY IF EXISTS "Anyone can update templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can create templates" ON ad_templates;

-- Create admin-only policies for templates
CREATE POLICY "Only admins can create templates"
ON templates FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update templates"
ON templates FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete templates"
ON templates FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Same for ad_templates
CREATE POLICY "Only admins can create ad templates"
ON ad_templates FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update ad templates"
ON ad_templates FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete ad templates"
ON ad_templates FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));