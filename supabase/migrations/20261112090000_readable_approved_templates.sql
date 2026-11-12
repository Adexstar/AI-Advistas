-- Visitors can read approved templates without executing has_role.
-- Admins keep a separate policy so they can still see pending rows.

DROP POLICY IF EXISTS "Active templates are readable" ON public.templates;
DROP POLICY IF EXISTS "Approved templates are readable" ON public.templates;
DROP POLICY IF EXISTS "Admins can read every template" ON public.templates;

CREATE POLICY "Approved templates are readable"
  ON public.templates
  FOR SELECT
  TO anon, authenticated
  USING (is_active AND review_status = 'approved');

CREATE POLICY "Admins can read every template"
  ON public.templates
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
