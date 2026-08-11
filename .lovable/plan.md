# Admin Template Manager

An admin-only page to create, edit, and deactivate templates in the `templates` table, with internal sourcing/licensing fields visible only to admins.

## Database changes

The `templates` table currently has `source`, `external_id`, `premium`, `popularity_score` but is missing the fields in your spec. Add:

- `source_id` (text) — provider ID, e.g. `fp_12345`
- `source_license` (text) — e.g. `free`, `premium`, `extended`
- `license_expires_at` (timestamptz, nullable — null means "Never")
- `imported_at` (timestamptz)
- `is_active` (boolean, default true) — deactivate instead of delete
- `usage_count` (integer, default 0) — real usage counter, separate from `popularity_score`

Backfill: existing 30 originals get `is_active = true`, `imported_at = created_at`, `source_license = 'owned'`.

Access rules stay as they are: everyone can read templates, only admins can create/update. Public reads are additionally filtered to active templates only.

## Admin page

New route `/admin/templates` (admin-guarded, same pattern as `/admin`), linked from the Admin Dashboard.

List view — one card per template, matching your mockup:
- Name, thumbnail/preview
- Category · Platform · AI tags
- Admin-only block: Source (label + source_id), License + expiry ("Expires: Never"), Imported date
- Usage: N times · Score: X/100
- Active/Inactive badge, Edit and Activate/Deactivate buttons
- Search box plus filters for category, source, and active state

Create/Edit dialog with two sections:
- User-facing: name, description, category, platform, objective, format, width/height, AI tags, industry tags, preview/thumbnail URL, premium flag
- Internal (admin only): source, source_id, source_license, license expiry, imported_at, popularity score
- `template_json` edited as a JSON textarea, validated with the existing template QA checks before saving; invalid JSON blocks the save.

Deactivate sets `is_active = false` (no deletion), and the card drops to the bottom of the list dimmed.

## User-facing side

Template Library, Templates page, dashboard widgets and search RPCs filter to `is_active = true`. Internal source fields are never rendered in any user-facing view.

## Technical notes

- Migration adds columns, an index on `is_active`, and updates `search_templates` / `template_category_counts` to exclude inactive rows.
- New `src/pages/AdminTemplates.tsx` plus a `TemplateFormDialog` component; data access through a small `useAdminTemplates` hook (React Query) so list/mutation state stays in one place.
- Preview URL field accepts a Cloudinary URL; no secrets are stored in the row.
