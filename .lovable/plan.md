# Seed real Freepik/Pexels templates + admin approval gallery

Goal: get real third-party assets into the `templates` table as **pending** entries, then browse, preview, open in the editor, and approve them from a dedicated admin gallery.

## Approval model

- `is_active` is the approval gate (as chosen): imported templates are inserted with `is_active = false`.
- The user-facing `/templates` page continues to show only active templates; pending imports stay invisible until approved.
- No schema change required — `templates` already has `source`, `source_id`, `source_license`, `imported_at`, `is_active`.

## Seeding (both paths)

New edge function `import-stock-templates`:
- Admin-only (verifies the caller's JWT and `has_role(uid, 'admin')`).
- Modes: `search` (returns normalized provider results, nothing written) and `import` (writes selected results, or a bulk batch, into `templates`).
- Providers: Freepik (existing `FREEPIK_API_KEY`) and Pexels (existing `PEXELS_API_KEY`), reached through the existing edge-function/caching pattern.
- Dedupe on `source` + `source_id` so re-running never creates duplicates.
- Bulk seed: a "Seed starter pack" action pulls a fixed set of queries (beauty, fashion, food, fitness, real estate, SaaS) across both providers, roughly 40-60 assets, all pending.

## Imported template shape (image-backed artboard)

Each imported asset becomes a real editable AdVista template:
- Artboard sized from the asset's aspect ratio, snapped to a standard format (1080x1080 square, 1080x1920 story, 1200x628 landscape) with `format`/`width`/`height` set.
- `template_json` = Fabric JSON containing: background image layer (provider URL, `crossOrigin: anonymous`, locked by default), a translucent scrim rect, plus editable `{{brand.*}}`-aware headline, subheadline and CTA text layers so the existing variable/QA pipeline works.
- `preview_url`/`thumbnail_url` from the provider; `source`, `source_id`, `source_license`, `imported_at` filled in.
- Reuses the existing image-resolution and sanitization path in `loadIntoCanvas.ts`, so these render in the Visual Editor exactly like the Originals.

## Admin gallery page

New route `/admin/templates/gallery` (admin-only, same layout and design language as the other admin pages):
- Two tabs: **Pending review** and **Approved**, plus a **Import from providers** panel (query box, provider toggle, result grid, multi-select, "Import selected as pending").
- Card grid with thumbnail, name, provider badge, format, dimensions.
- Click a card -> preview dialog rendering the actual template (existing `TemplatePreviewDialog`/renderer) with metadata and license info.
- Per-card actions: **Open in editor** (existing `setPendingEditorTemplate` / one-click load flow), **Approve** (set `is_active = true`), **Reject** (delete or keep inactive with a note), and bulk approve/reject for the selection.
- A "Templates gallery" entry is added under the existing admin sidebar group; the current `/admin/templates` manager stays unchanged.

## Technical notes

- New: `supabase/functions/import-stock-templates/index.ts`, `src/services/templates/StockImportService.ts` (the only client entry point), `src/hooks/useStockTemplateImport.tsx`, `src/pages/AdminTemplateGallery.tsx`.
- Touched: `src/App.tsx` (route), `src/components/DashboardLayout.tsx` (sidebar link), reuse of `useAdminTemplates` mutations for approve/deactivate.
- Provider search results cached 24h through `provider_search_cache`, consistent with the existing media services.
- No database migration needed.
