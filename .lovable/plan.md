# AdVista External Services — Adapter & Cache Implementation

Much of Layer 3 is already in place (`TemplateService`, `MediaService`, `PublishingEngine`, `BrandService`, Freepik + Cloudinary + OpenAI + Ayrshare adapters). This plan fills the remaining gaps so external providers become swappable infrastructure behind AdVista's services.

## Scope

### 1. Provider adapters (replace stubs with real edge-function calls)
- **Media search adapters**: `pexels`, `pixabay`, `unsplash` — each backed by a small `search-<provider>` edge function that holds the API key and normalizes results to `MediaAsset`.
- **Media generation adapters**: `ideogram`, `leonardo`, `runway`, `kling`, `veo` — each backed by a `generate-<provider>` edge function returning a Cloudinary-persisted `MediaAsset`.
- Adapter files live in `src/services/media/providers/`. They only call edge functions — never external APIs directly.
- `isConfigured()` returns true when the corresponding secret is expected to exist server-side; server returns 501 otherwise.

### 2. Unified search cache (24h)
- New table `provider_search_cache` (provider, query_hash, ctx_hash, results jsonb, expires_at).
- Wrap `MediaService.search` with a cache check → call adapters on miss → store.
- Same pattern reused by `TemplateService.importFromFreepik` search calls.

### 3. AI-driven provider routing
- Add `MediaService.smartSearch(ctx)` that expands the intent via `AIGateway` (synonyms + category context) and ranks combined results by relevance/quality/orientation/brand-color match.
- Media Library and Visual Editor consume `smartSearch`, not raw provider calls.

### 4. Edge functions (new)
- `search-pexels`, `search-pixabay`, `search-unsplash`
- `generate-ideogram`, `generate-leonardo`, `generate-runway`, `generate-kling`, `generate-veo`
- Each: CORS, Zod input validation, normalized response, graceful 501 when the provider secret is missing.

### 5. Secrets (requested only when the user opts in)
- `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `UNSPLASH_ACCESS_KEY`, `LEONARDO_API_KEY`, `IDEOGRAM_API_KEY`, `RUNWAY_API_KEY`, `KLING_API_KEY`, `VEO_API_KEY`.
- Not added preemptively — we ship the adapters + edge functions; each provider lights up when its secret is added.

### 6. Cleanup
- Remove any remaining direct provider calls from pages (audit `src/pages` for `fetch("https://api.*")` and route through services).
- Ensure `PublishingEngine` remains the only publish entry point (already true).

## Out of scope
- No UI redesign. Media Library, Template Library, and Visual Editor keep their current UX; only the data source becomes unified.
- Paid ads adapters (Meta/TikTok/Google) stay as seams — real OAuth wiring is a later layer.

## Technical notes
- Cache key: `sha256(provider + '|' + normalized(query) + '|' + JSON.stringify(ctx))`.
- All adapters return `MediaAsset` shape already defined in `src/services/media/types.ts`.
- Edge functions use `npm:@supabase/supabase-js@2` + `corsHeaders` per project convention.
- `provider_search_cache` gets `GRANT`s + RLS: readable by `authenticated`, writable by `service_role` only (edge functions write).

## Deliverables
1. Migration for `provider_search_cache`.
2. 8 new edge functions.
3. Replacement of `stubs.ts` with real adapter files (`pexels.ts`, `pixabay.ts`, `unsplash.ts`, `ideogram.ts`, `leonardo.ts`, `runway.ts`, `kling.ts`, `veo.ts`).
4. `MediaService.smartSearch` + cache wrapper.
5. Short doc block at top of `src/services/index.ts` naming the four service entry points as the only allowed external surface.

Approve and I'll implement in one pass.
