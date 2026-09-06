# Remove AI-generated templates from the database the 30 advista original 

Only delete saved templates that were made by AI. No app features, buttons, or pages are touched.

## What changes for you

- Any saved template whose source is `ai_generated`, or whose name starts with "AI •" (the naming pattern the generator uses), is permanently removed from the templates table.
- All 30 AdVista Originals are to be removed and any stock imports (Pexels, Freepik) stay exactly as they are.

## Current state

Checked the templates table: right now every one of the 30 rows is an AdVista Original and none match the AI pattern, so this removal would currently delete nothing. Running it still protects the library — if any AI-made template slipped in (for example through an earlier test), it gets cleaned out.

## Technical details

- Single delete against `public.templates`:
`DELETE FROM public.templates WHERE source = 'ai_generated' OR name ILIKE 'AI •%' OR name ILIKE 'AI %';`
- Child rows that reference those templates (`template_layers`, `template_versions`, `template_collection_items`, `template_usage_events`, and user designs pointing at them) are removed first where the database does not cascade automatically.
- No schema change, no RLS change, no frontend code change.