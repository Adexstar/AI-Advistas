## AdVista Template Engine — Layer 3A

Goal: templates become editable "living documents" (Fabric.js JSON + variables + AI metadata), personalized by a Template Engine before hitting the Visual Editor. Pages consume services only.

### 1. Database (migration)

Extend `templates` and add companion tables. Keep existing `ad_templates` as legacy source; new canonical is `templates`.

- `templates` — add columns if missing: `category text`, `platform text`, `objective text`, `format text`, `width int`, `height int`, `template_json jsonb`, `ai_tags text[]`, `industry_tags text[]`, `brand_compatible bool default true`, `popularity_score int default 0`, `source text default 'advista'`, `premium bool default false`, `metadata jsonb` (emotion, audience, layout_style, visual_weight, primary_color, recommended_platforms, recommended_goal).
- `template_layers` — id, template_id (fk), layer_type (text|image|shape|font|group), x, y, width, height, rotation, effects jsonb, animation jsonb, editable bool, brand_replaceable bool, ai_replaceable bool, variable_key text, z_index int, props jsonb.
- `template_versions` — id, template_id, version_number, template_json jsonb, layers jsonb, created_by, created_at, note text.
- `template_usage_events` — id, template_id, user_id, event (viewed|used|edited|favorited|published), context jsonb, created_at. (Feeds recommendation + Campaign Memory.)
- GRANTs + RLS for all four tables. `templates` readable by anon+authenticated; writes by owner/service_role. `template_layers`/`template_versions`/`template_usage_events` scoped to owning user or public templates.

### 2. Variable system

Standard placeholder keys resolved at instantiate time:
`{{brand.logo}}`, `{{brand.primaryColor}}`, `{{brand.secondaryColor}}`, `{{brand.font}}`, `{{brand.voice}}`, `{{headline}}`, `{{subheadline}}`, `{{body}}`, `{{cta}}`, `{{website}}`, `{{phone}}`, `{{offer}}`, `{{product_image}}`, `{{hero_image}}`.

Resolver walks Fabric JSON, replaces `text` fields and image `src` for objects carrying `variableKey`. Design geometry never mutated.

### 3. Service layer (`src/services/templates/`)

- `TemplateService` (extend existing) — CRUD, list with filters.
- `TemplateEngine` — `instantiate(template, ctx)` → runs BrandEngine + AIEngine, returns personalized Fabric JSON + resolved variables.
- `TemplateRenderer` — takes personalized JSON, hands off to Visual Editor / server-side export.
- `TemplateRecommendationService` — ranks templates against AI Context (brand, category, goal, platform), returns `{ template, score, reasons[] }`.
- `TemplateSearchService` — semantic search across `ai_tags`, `category`, `metadata.emotion`, `metadata.audience`, `industry_tags`.
- `TemplateVersionService` — `snapshot(templateId, note)`, `list(templateId)`, `restore(versionId)`.
- `TemplateImportService` — routes provider imports (Freepik today, Canva/Bannerbear future) through edge functions only.
- `TemplateExportService` — PNG/JPG/PDF/MP4 via `export-ad` edge function; keeps JSON as source of truth.

Sub-engines (`src/services/templates/engines/`):
- `BrandEngine.apply(json, brandKit, { lock })` — swaps `brand_replaceable` layers only. Honors Brand Lock.
- `AIEngine.personalize(json, ctx)` — calls `generate-ad-copy`/`suggest-ad-style` via edge functions, fills text/image variables. Never rearranges layout.

Barrel exports through `src/services/index.ts`.

### 4. Edge functions

New/updated (all with CORS + zod validation + guardrails from AI Context):
- `template-search` — unified search over Supabase + Freepik + future providers.
- `template-import` — normalizes provider payloads → AdVista JSON + layers.
- `template-personalize` — server-side wrapper: BrandEngine + AIEngine for headless flows.
- `template-render` — server render for thumbnails/exports.

Providers behind adapter interface (`FreepikAdapter`, `CanvaAdapter` stub, `BannerbearAdapter` stub). Frontend never calls providers directly.

### 5. Visual Editor integration

- On "Use Template": page calls `TemplateEngine.instantiate` → navigates to `/visual-editor` with personalized JSON in route state or draft row.
- `VisualEditorContext` loads Fabric JSON, tags each object with its `variableKey` for badge overlays ("brand-locked" / "AI-editable").
- Save flow: on save, snapshot current JSON to `template_versions` (autosave = throttled, manual = named). Restore = load a version into the canvas.

### 6. Template Library UX (small changes)

- Recommendation strip at top: "Recommended for {brand} · {goal}" using `TemplateRecommendationService`.
- Card hover: Preview, Use Template, Duplicate, Favorite, Preview in Editor.
- Filters auto-seeded from active AI Context on mount.

### 7. Migration of existing pages/hooks

Any page currently calling `supabase.functions.invoke` for template/media/publishing must route through `@/services`. Scope of this change:
- `src/pages/TemplateLibrary.tsx`, `TemplateCustomizer.tsx`, `CreateAd.tsx`, `AIAdEditor.tsx`, `VisualEditorPage.tsx`.
- Hooks `useTemplates`, `useUnifiedTemplates`, `useTemplateStorage`, `useGenerateAdDraft` → thin wrappers over services.

### 8. Non-goals for this pass

- No new secrets required (Freepik/OpenAI/Lovable AI already configured).
- No new provider integrations implemented — only adapter seams.
- No AI autonomy: personalization stays preview → accept → apply.

### Technical details

```text
Template Library ──► TemplateService.list / RecommendationService
                              │
                              ▼
User clicks "Use Template"
                              │
                              ▼
TemplateEngine.instantiate(template, aiContext)
   ├─ BrandEngine.apply(json, brandKit, { lock })
   └─ AIEngine.personalize(json, ctx)   ── edge: generate-ad-copy / suggest-ad-style
                              │
                              ▼
Personalized Fabric JSON  ──►  VisualEditor  ──►  autosave → template_versions
                                                     │
                                                     ▼
                                            Export via TemplateExportService
                                                     │
                                                     ▼
                                       edge: export-ad → Cloudinary/download
```

Rollout order: (1) migration, (2) services + engines, (3) edge functions, (4) editor wiring, (5) library UX, (6) hook/page refactor.

### Success criteria

- New template rows carry `template_json` + `template_layers` rows; opening one lands directly in Visual Editor with variables resolved.
- Brand Lock swaps only `brand_replaceable` layers; layout untouched.
- Saving in the editor writes a new `template_versions` row; restoring loads it back.
- `rg "supabase.functions.invoke" src/pages src/components` returns 0 matches for template/media/publish calls.
- Recommendation strip renders ranked templates with visible "why" reasons from active AI Context.
