# AdVista — Layer 3: External Services & Integration Architecture

Goal: make AdVista the orchestration layer. Pages talk only to AdVista services; AdVista services talk to external providers through adapters. This plan sets up the scaffolding, refactors existing call sites, and leaves clean seams for future providers — without redesigning any UI.

## Guiding rules (enforced going forward)

- No page or component calls a third-party API directly.
- No page invokes a provider-specific edge function directly. Pages call an AdVista service, which chooses the adapter.
- Every AI action reads Brand Kit → Category Intelligence → Campaign Memory → AI Context before generating.
- Adapters share one interface per capability so providers are swappable.
- Supabase remains the source of truth for templates, brand kits, media metadata, campaigns, and memory. External providers are cache/enrichment.

## Service layer (new)

Create `src/services/` modules. Each is a thin façade over existing edge functions + Supabase; no provider SDK in the client.

```
src/services/
  templates/TemplateService.ts       generate | list | import | save
  brand/BrandService.ts              existing — extend with lock + brandfetch import
  media/MediaService.ts              upload | search | generate | list (Cloudinary + AI + stock)
  publishing/PublishingEngine.ts     publish(asset, targets[]) → routes to adapters
    adapters/AyrshareAdapter.ts      social
    adapters/MetaAdsAdapter.ts       paid (stub)
    adapters/TikTokAdsAdapter.ts     paid (stub)
    adapters/GoogleAdsAdapter.ts     paid (stub)
  ai/*                               already exists — unchanged
```

Each adapter exports the same shape:

```ts
export interface PublishAdapter {
  id: string;
  kind: "social" | "paid";
  supports(platform: string): boolean;
  publish(asset: MarketingAsset, opts: PublishOptions): Promise<PublishResult>;
  fetchMetrics?(externalId: string): Promise<MetricsSnapshot>;
}
```

## Template architecture

- Keep Supabase `templates` / `ad_templates` as the AdVista Template Library (source of truth).
- `TemplateService.generate(ctx)` → calls existing `generate-ad-draft` / `auto-fill-template` edge functions with Brand + Category + Memory context, then persists the result to `templates` tagged `source: "ai"`. This becomes the proprietary generator.
- `TemplateService.importFromFreepik(query)` → wraps existing `search-freepik-templates` + `get-freepik-template` + `process-freepik-psd`. Results normalized and saved to the library.
- Canva stays optional (import/export only). No UI change in this task; existing Canva secrets remain.
- Refactor `useTemplates`, `useUnifiedTemplates`, `TemplateBrowser`, `TemplateLibrary`, `TemplateCustomizer` to call `TemplateService` instead of `supabase.functions.invoke` directly.

## Brand Kit architecture

- `BrandService` (already exists) — extend:
  - `lock(brandId)` / `unlock(brandId)` toggling `locked` on `brand_kits`.
  - `importFromWebsite(url)` → new edge function `brandfetch-import` (stub with `BRANDFETCH_API_KEY` secret request). Populates a new `brand_kits` row; after that, only Supabase is read.
  - `toPromptGuardrails()` already returns the constraint string; extend to include a `respectLock` flag so AI jobs refuse logo/color/font/tone mutation when locked (unless `experimental: true`).
- All AI edge functions that touch branding must accept a `brandGuardrails` string in the body and prepend it to the system prompt. Add this to: `generate-ad-copy`, `suggest-ad-style`, `auto-fill-template`, `generate-ad-content`, `generate-ad-draft`, `generate-ad-image`, `generate-ai-campaign`.

## Media Library architecture

- `MediaService`:
  - `upload(file)` → uploads to Cloudinary via new edge function `media-upload` (needs `CLOUDINARY_*` secrets), stores metadata in `media_assets`.
  - `generate(prompt, provider)` → dispatches to OpenAI Images (existing `generate-ad-image`) or Ideogram (new adapter). Saves to `media_assets` with `source: "ai"`.
  - `search(intent, ctx)` → intent-based search. Fans out to: user assets (Supabase), Freepik, Pexels, Pixabay, Unsplash (stub adapters, feature-flagged by presence of API key). Ranks by brand fit + category + goal.
  - Adapters live in `src/services/media/providers/{cloudinary,openai,ideogram,freepik,pexels,pixabay,unsplash}.ts`. Only Cloudinary + OpenAI implemented now; the rest are typed stubs returning empty results if the corresponding secret is missing, so the UI degrades gracefully.
- Refactor `useMediaLibrary` and `MediaLibrary.tsx` to call `MediaService`.

## Publishing architecture

- New `PublishingEngine` singleton:
  - `publish(asset, targets)` groups targets by adapter and executes in parallel.
  - `MarketingAsset` normalized shape links brand, campaign, category, platform, goal, audience, status, variants, decisions, analytics, publishing history — mapped from existing `user_ads` / `generated_ads` / `campaigns` rows via a selector.
- Adapters:
  - `AyrshareAdapter` — social (Facebook, Instagram, TikTok, LinkedIn, X, Pinterest, YouTube). Calls a new `ayrshare-publish` edge function using `AYRSHARE_API_KEY` (secret to be requested when user enables social publishing).
  - `MetaAdsAdapter`, `TikTokAdsAdapter`, `GoogleAdsAdapter` — paid. Ship as typed stubs with clear `throw new NotImplementedError()` so the seams exist but no dead OAuth flows ship.
- Refactor `ExportCenter`, `Campaigns`, `MyAds` publish/export buttons to call `PublishingEngine.publish(...)` instead of any direct function call.

## Analytics feedback loop

- `PublishingEngine.fetchMetrics(assetId)` iterates adapters that published this asset and appends snapshots to `analytics`.
- On completion, call `CampaignMemoryService.record(result)` (already exists) so wins/losses feed the Decision Engine.

## Refactor targets (call-site sweep)

Replace direct `supabase.functions.invoke(...)` in these files with service calls:

- `src/hooks/useAIAssistant.tsx` → `TemplateService` / `AIJobService`.
- `src/hooks/useTemplates.tsx`, `useUnifiedTemplates.tsx`, `useTemplateStorage.tsx` → `TemplateService`.
- `src/hooks/useMediaLibrary.tsx` → `MediaService`.
- `src/hooks/useRealTimeAdGenerator.tsx`, `useGenerateAdDraft.tsx`, `useExportAd.tsx`, `useSimulateAd.tsx` → respective services.
- `src/pages/CreateAd.tsx`, `AdEditor.tsx`, `AIAdEditor.tsx`, `AIVideoGenerator.tsx`, `ExportCenter.tsx` → services.
- `src/components/ad/*`, `src/components/visual-editor/ai/*` → services.

Behavior is preserved; only the transport changes.

## Secrets to request (only when user enables the feature)

- `BRANDFETCH_API_KEY` (onboarding brand import)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `IDEOGRAM_API_KEY`
- `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `UNSPLASH_ACCESS_KEY`
- `AYRSHARE_API_KEY`
- Meta / TikTok / Google Ads app credentials — deferred until paid-ads work starts.

Already present: `OPENAI_API_KEY`, `FREEPIK_API_KEY`, `CANVA_*`, `LOVABLE_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `GROQ_API_KEY`, `RUNWARE_API_KEY`.

## What ships in this task

Scaffolding + refactor, no UI redesign:

1. `src/services/templates/TemplateService.ts` — real, wraps existing edge fns.
2. `src/services/media/MediaService.ts` + `providers/{cloudinary,openai,ideogram,freepik,pexels,pixabay,unsplash}.ts` — Cloudinary + OpenAI real, others stubbed.
3. `src/services/publishing/PublishingEngine.ts` + `adapters/{ayrshare,meta,tiktok,google}.ts` — Ayrshare real when key present, paid ads stubbed.
4. Extend `BrandService` with `lock`, `importFromWebsite`, guardrail flag.
5. New edge functions: `brandfetch-import`, `media-upload` (Cloudinary), `ayrshare-publish`. Each returns a clear "provider not configured" error when its secret is missing.
6. Refactor the call sites listed above to route through services.
7. Update `IntegrationsHub.tsx` to show real connection status per adapter (reads from a `/settings/integrations` service; no visual redesign — just wires the existing tiles).
8. No changes to sidebar, navigation, dashboard, AI context bar, or any page layout.

## What is deferred

- Meta / TikTok / Google Ads OAuth flows and campaign sync.
- LinkedIn / Pinterest / Snapchat / Microsoft Ads adapters.
- Adobe Express / Figma template import.
- Ideogram, Pexels, Pixabay, Unsplash real implementations (stubs only until secrets provided).

## Success criteria

- `rg "supabase.functions.invoke\\(" src/` returns zero matches inside `src/pages` and `src/components`; only service files call it.
- Every AI edge function receives a `brandGuardrails` string.
- Publishing any asset goes through `PublishingEngine.publish`.
- Adding a new provider = adding one adapter file, no page edits.
