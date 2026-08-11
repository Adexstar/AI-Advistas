# Consolidate on a single `templates` table

One table only: `templates` (the 30 AdVista Originals, plus anything imported later — Freepik, Pexels, AI-generated). The empty `ad_templates` table gets removed, and every read/write that still points at it moves over.

## What changes

### 1. Database
- Drop the empty `ad_templates` table (0 rows, nothing to migrate) along with its triggers and policies.
- Confirm `templates` keeps its Data API grants: read for anon + authenticated, write for authenticated/admin, full access for service_role. Re-assert them in the same migration so nothing is left implicit.
- The storage bucket also named `ad_templates` stays — it holds uploaded template files and is unrelated to the table.

### 2. Template Library reads `templates`
- `useTemplates` / `useTemplate` switch to the `templates` table and map its columns onto the shape the library cards already expect:
  - `goal` ← `objective`, `platforms` ← `[platform]` + `metadata.recommended_platforms`, `is_popular` ← high `popularity_score`, `tags` ← `ai_tags`, `industry` ← first `industry_tags` entry, `performance_score` ← `popularity_score`.
  - `preview_url` / `thumbnail_url` / `category` / `template_json` map straight across.
- Card layout, filters, category cards, and the detail panel stay exactly as they are — only the data source and field mapping change.

### 3. Remaining `ad_templates` references
- `useUnifiedTemplates`: the Freepik import now inserts into `templates` (with `source = 'freepik'`), and the combined-templates query reads `templates`.
- `useDashboardData`: the realtime subscription listens on `templates`.
- `upload-template` edge function: inserts and cleanup target `templates`.
- `useTemplateStorage` already writes to `templates` — only its storage-bucket calls keep the `ad_templates` name.

## Technical notes

- Files touched: `src/hooks/useTemplates.tsx`, `src/hooks/useUnifiedTemplates.tsx`, `src/hooks/useDashboardData.tsx`, `supabase/functions/upload-template/index.ts`, plus type-only touch-ups where the `AdTemplate` shape is consumed (`TemplateLibrary.tsx`, `TemplateDetailPanel.tsx`, `TemplateBrowser.tsx`).
- One migration: drop `ad_templates`, re-assert grants on `templates`.
- Supabase types regenerate after the migration, so the code edits land after it runs.

## Verification

Load `/template-library` and confirm 30 cards render with real category counts, open a detail panel, and check the dashboard template widget still populates.
