# AdVista Core Production-Readiness Work

## Audit scope

Review and complete implemented product areas only. Exclude pages and features explicitly marked Coming Soon. Preserve AdVista’s existing layout, Obsidian + Orange design system, campaign/creative model, and human-first AI behavior. This plan treats “productive” as reliable for real customer work, not just a compiling preview.

## Verified current state

- Hosted data contains 2 active, approved templates, 8 campaigns, 8 creatives, 0 campaign metric rows, 2 publishing jobs, 0 platform connections, 2 decisions, and 0 subscriptions. The two templates are stock makeup imagery, so the library is live but not yet a useful general starter set.
- Publishing currently always returns a 501 “not configured” response; analytics sync currently generates random sample metrics and writes them as campaign data.
- The hosted database has only the `brand_kits` table with JSON `logos`, `colors`, and `fonts`; the Brand Kit UI also queries `brand_colors`, `brand_fonts`, and `brand_assets`, which do not exist in the current schema.
- The AI feedback table and learning RPCs used by `LearningService` are absent in the hosted database. Its error handling can silently turn failed learning writes into empty results.
- The hosted subscription table is read-only to users, but users can insert/update their own usage counters. Plan limits and increments are enforced in the browser, not atomically on the server.
- `generate-ad-draft` and `seed-advista-originals` disable JWT verification. The seed function uses the service-role key without checking caller identity or role.
- The Flutterwave webhook checks a shared signature header but lacks transaction reconciliation and event idempotency; the checkout currently uses the webhook URL as its browser return URL.
- Recent preview diagnostics include a Supabase function type-check failure in `analyze-performance` (`error` is `unknown`). Existing automated tests passed in the prior audit (12 files, 44 tests); they do not cover provider publishing, billing lifecycle, or cross-user isolation end to end.

## Priority findings

### P0 — Secure before serving real customers

1. Require verified user authentication and server-side entitlement/rate-limit checks for every credential-backed AI endpoint. Remove or admin-gate the public service-role template seeder; never rely on hidden UI controls.
2. Move usage accounting and plan enforcement to atomic server-side operations. Users must not be able to raise/reset their own quota or bypass it with concurrent requests.
3. Reconcile payment transactions server-side before granting a plan. Add webhook event idempotency and amount/currency/plan checks, and separate the customer return page from the webhook endpoint.
4. Review the deployed RLS/storage/function grants against the source, then test tenant isolation with two accounts, especially campaign-linked creatives, editor saves, versions, media, platform connections, and privileged functions.

### P1 — Make the core product truthful and usable

1. Disable synthetic analytics writes immediately; then implement authenticated provider metric retrieval, ownership checks, stable date/platform upserts, and truthful empty/error states. Do not use synthetic data in dashboards, recommendations, or learning.
2. Complete real platform connections and organic publishing for explicitly supported channels, including OAuth/account selection, secure token handling/refresh, provider payloads, failure reporting, retries, and scheduling. Keep unsupported paid ads unavailable until their provider workflow is real. Report per-platform outcomes instead of “Publishing started” after a 501.
3. Make billing complete end to end: verified checkout, return/status screen, webhook reconciliation, renewals/failures/cancellations, and plan/usage refresh. Clearly label plans unavailable until provider configuration and tests pass.
4. Align Brand Kit features with the deployed schema without creating duplicate storage: use the existing JSON fields or migrate to a single normalized design, then verify create/edit/upload/delete and template token handoff.
5. Persist recommendation feedback in a schema that exists, make failures visible, and verify that accept/dismiss choices affect later suggestions. Keep suggestions optional, explainable, previewable, and reversible.
6. Replace mock creative-generation responses/fallbacks with real provider results or explicit errors; never present placeholder output as generated work.
7. Make the template library useful for a new account: provide a reviewed, licensed, multi-category set of active starters, with source attribution and valid editable documents. Current library contains only two makeup stock templates.
8. Repair the Create Ad autosave dependency gap so edits to copy, media, CTA, website, and audience are saved, with clear saved/failed status.

### P2 — Reliability and release confidence

1. Fix the current Edge Function type-check error in `analyze-performance` and check all deployed functions for type, auth, and secret handling issues.
2. Correct dashboard analytics time buckets to use unique dates/weeks/months and add tests across range boundaries.
3. Add meaningful service tests and end-to-end checks for sign-in/recovery, campaign create/edit/duplicate/restore, creative save/reopen/export, template opening, Brand Kit persistence, AI feedback, quotas, payments, and provider failures.
4. Run the requested responsive route/interaction audit on actual signed-in accounts; include empty accounts and error/loading states. Validate logs and network failures without replacing the existing design.

## Delivery sequence

1. **Contain and verify:** secure the unauthenticated endpoints, server-owned limits, current deployed policies, and analytics write path; remove or disable unsafe behavior before wiring more production actions.
2. **Stabilize core data:** reconcile the Brand Kit schema, AI feedback persistence, campaign/creative ownership, dashboard metric definitions, and Create Ad autosave. Add rule-specific tests alongside each change.
3. **Complete customer workflows:** implement supported OAuth publishing and real analytics sync; fix provider status and per-platform result handling; complete payment reconciliation and subscription lifecycle.
4. **Make AI and templates honest/useful:** replace mock output and missing recommendation persistence, seed reviewed starter templates, and verify learning from saved user decisions without automatic editing.
5. **Release verification:** run TypeScript/build/tests, edge-function checks, cross-account security tests, and signed-in Playwright workflows across phone/tablet/desktop. Publish only after external provider credentials and hosted settings are confirmed.

## External dependencies and limits

- Real publishing requires approved Meta/TikTok/Google app registrations, OAuth redirect configuration, scopes, and user-owned account credentials. Existing edge-function secrets alone do not implement publishing.
- Billing verification requires a Flutterwave test/live configuration and valid webhook setup. Do not test charges against real customers during QA.
- Hosted auth settings (including leaked-password protection) and deployed-function configuration must be inspected in the connected Supabase project; source code alone cannot prove dashboard settings.
- Signed-in, cross-account end-to-end verification requires test accounts and suitable provider sandbox accounts. Do not use the user's real ad accounts or charge a real payment method for tests.

## Technical approach

- Keep the existing React/Supabase architecture and current `ads` + `CreativeService` ownership model; do not create a second campaign or creative store.
- Use server-side Supabase Edge Functions for provider credentials, payment verification, and quota checks. Keep RLS owner-scoped and validate ownership before any service-role write.
- Avoid mock/fallback success in production paths. If a real service is unavailable, return a clear actionable unavailable/error state and keep the user’s work intact.
- Preserve human control: AI recommendations never modify campaign or creative content unless the user previews and explicitly applies the change.