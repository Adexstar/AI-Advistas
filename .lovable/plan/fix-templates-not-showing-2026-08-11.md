# Fix: Templates not showing

Not a "templates are AdVista-owned" problem — the 30 AdVista Originals do exist in the database. Three separate bugs are stopping them from reaching the screen.

## What I verified

- `templates` table: 30 rows, all `source = advista_original`.
- `ad_templates` table: 0 rows.
- The Template Library page reads `ad_templates` (the empty one), not `templates`.
- Neither table has any Data API grants, so even a correct query returns a permission error for signed-in and anonymous users.
- The page calls an RPC named `template_category_counts` that does not exist in the database, so the category counts fail too.

## The fix

1. Grant Data API access
   - `GRANT SELECT ON public.templates TO anon, authenticated` (RLS already allows public read).
   - Same for `ad_templates` plus write privileges for authenticated/admin flows.
   - Without this nothing renders regardless of the other fixes.

2. Point the library at the real table
   - Switch the Template Library's data hook from `ad_templates` to `templates`, mapping the fields the cards use (name, description, thumbnail/preview URL, category, platform, objective, popularity, tags).
   - Keep the existing card layout, filters, and detail panel untouched — only the data source changes.
   - Same for the other reads still pointing at the empty `ad_templates` (dashboard "top templates" widget, analytics widget) so they show real data instead of nothing.

3. Add the missing category-count function
   - Create `template_category_counts(p_source text)` returning category + count from `templates`, so every category card shows its real number (including `0 Templates`, as previously requested).

## Technical notes

- Files touched: `src/hooks/useTemplates.tsx` (repoint to `templates`), `src/pages/TemplateLibrary.tsx` (field mapping only), `src/hooks/useDashboardData.tsx`, `src/hooks/useAnalytics.ts`.
- One migration: grants on both tables + the `template_category_counts` SQL function (stable, `search_path = public`).
- No visual/layout changes.

## Verification

After the change: query the library route and confirm 30 template cards render, category counts are non-zero for populated categories, and the detail panel opens for an AdVista Original.
