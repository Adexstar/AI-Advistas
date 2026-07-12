# Layer 3C.1 — Template Infrastructure Population

Following your own recommendation, I'm splitting Layer 3C into two milestones and delivering **3C.1 first**. 3C.1 makes the pipeline real end-to-end with a small verified seed (3 templates across 3 industries). 3C.2 then produces the full 30-template pack against a proven pipeline instead of blindly generating 30 records that might not render.

Reasoning: producing 30 full Fabric.js templates + Cloudinary previews + AI metadata before verifying a single one renders in the Visual Editor is high-risk. A seed-first approach catches variable-resolver, Brand Engine, and Visual Editor wiring bugs on 3 templates, not 30.

## Scope of 3C.1

### 1. Collections taxonomy
- Add a `template_collections` table (`id`, `slug`, `name`, `description`, `sort_order`, `icon`, `is_featured`).
- Add `template_collection_items` join table (`template_id`, `collection_id`).
- Seed 15 AdVista Originals collections (Beauty, Fashion, Real Estate, Restaurant & Food, Fitness, SaaS & Technology, Healthcare, Education, Automotive, Finance, Travel, E-commerce, Agency, Seasonal, Business).
- Add `source = 'advista_original'` marker + `layout_dna jsonb` column on `templates`.

### 2. Seed pipeline
- Build `src/services/templates/seed/` with:
  - `templateBuilder.ts` — helpers to compose Fabric.js JSON objects with `variableKey`, `brandReplaceable`, `aiReplaceable` flags. Enforces layer naming and safe zones.
  - `layoutDNA.ts` — DNA shapes and validators.
  - `originals/` — one file per template, each exports `{ metadata, layoutDNA, templateJSON, layers, variables }`.
- Build `scripts/seedAdvistaOriginals.ts` — idempotent seeder invoked via a new edge function `seed-advista-originals` (so Cloudinary + service-role writes stay server-side).

### 3. Preview generation
- New edge function `render-template-preview`: takes `template_json`, renders on a headless canvas (node-canvas / satori), uploads thumbnail + preview + cover to Cloudinary via existing `media-upload` credentials, returns URLs.
- Called by the seeder for every template so previews always match the editable JSON (no manual PNGs).

### 4. Verified seed (3 templates)
- 1 Beauty — "Glow Naturally" (Instagram 1080x1350, Conversions)
- 1 SaaS — "Ship Faster" (LinkedIn 1200x627, Awareness)
- 1 Fitness — "30-Day Reset" (Instagram Story 1080x1920, Traffic)
- Each: full Fabric JSON, `template_layers` rows, `template_versions` v1 snapshot, metadata, layout DNA, Cloudinary previews.

### 5. End-to-end verification
- Templates page loads Originals via existing `TemplateService.list`.
- "Use Template" → `TemplateEngine.instantiate` → Visual Editor renders resolved variables.
- Recommendation strip shows AdVista Originals when AI Context matches (uses existing `TemplateRecommendationService`).
- `template_usage_events` records the `used` event.

### 6. Out of scope for 3C.1 (moves to 3C.2)
- Remaining 27 templates.
- Fashion / Real Estate / Restaurant categories.
- Any changes to Templates page UI, Template Engine, Brand Engine, AI Context.

## Technical details

```text
edge: seed-advista-originals
  ├─ read originals/*.ts modules
  ├─ for each:
  │    ├─ edge: render-template-preview → Cloudinary
  │    ├─ upsert templates (source='advista_original')
  │    ├─ replace template_layers
  │    ├─ insert template_versions v1
  │    └─ upsert template_collection_items
  └─ returns { seeded, skipped, errors }
```

Migration adds: `template_collections`, `template_collection_items`, `templates.layout_dna`, `templates.collection_slug` (denormalized for fast filters), GRANTs + RLS (public read on collections and originals; writes via service_role only).

## Success criteria for 3C.1

- Migration applied; 15 collections + 3 seeded templates visible in `/templates`.
- Clicking any of the 3 opens the Visual Editor with brand + AI variables resolved.
- Cloudinary previews render on template cards.
- `rg "advista_original" src` shows only service-layer references, no UI changes.
- Green light to run 3C.2 (bulk production of the remaining 27).

Approve to proceed with 3C.1, or tell me to adjust the seed set / pipeline before I start.