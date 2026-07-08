# Global AI Context — Consolidation Plan

Goal: One Global AI Context Bar in the header, one service, one hook. Every page consumes it. No dedicated AI page. Support temporary Campaign and Brand Kit overrides.

## 1. Remove duplicates

- Delete `src/components/ai/AIContextPill.tsx` (superseded by `AIContextBar`).
- Delete `src/components/ai/AIStatusPill.tsx` (status now lives inside `AIContextBar`).
- Remove the standalone `<AIContextBar />` from `src/pages/Dashboard.tsx` — keep it only in the global header (`DashboardLayout`).
- Search the codebase for any lingering AI Context routes/pages; none currently exist, but confirm during implementation and remove if found.

## 2. Single source of truth

Keep exactly one provider chain in `src/App.tsx`:
`AIStatusProvider → AIContextProvider → routes`.

- `AIContextService` (already present) is the only module that touches the `ai_context` table.
- `useAIContext()` is the only hook pages use to read/update context. No page queries Supabase for context directly.
- `AIContextBar` (header) is the only UI that mutates global context via the Context Switcher popover.

## 3. Header integration

- `DashboardLayout` already renders `<AIContextBar />` in mobile and desktop headers — keep as-is.
- Confirm no other layout/page renders it.

## 4. Context Switcher behavior

Already in `AIContextBar`. Confirm:
- Fields: Workspace (Brand), Category, Goal, Mode, "Remember this context".
- Apply → `AIContextService.upsert` → provider updates → all consumers re-render automatically (React context). No page reloads.
- Cancel discards draft.

## 5. Campaign & Brand overrides (new)

Add temporary override capability without persisting to `ai_context`:

- Extend `AIContext` provider with:
  - `override: { source: "campaign" | "brand"; ... } | null`
  - `pushOverride(source, patch)` / `clearOverride()`
  - `effectiveContext` = `override ?? context` (what consumers actually read for AI calls).
- `AIContextBar` shows a small `🔒 From Campaign` / `🔒 From Brand Kit` badge when an override is active, and disables Apply while locked (or offers "Exit campaign context").
- Wire into pages:
  - `src/pages/Campaigns.tsx` (or campaign detail view): on mount with a selected campaign, call `pushOverride("campaign", { brand_id, active_category, current_goal })` from campaign metadata; `clearOverride()` on unmount/route change.
  - `src/pages/BrandKit.tsx`: on entering edit for a brand, `pushOverride("brand", { brand_id })`; clear on leave.

## 6. Page consumption pattern

No visual page changes. Each page that runs AI reads `useAIContext().effectiveContext` (falls back to `context`) and passes it to AI service calls (`DecisionService`, `AIJobService`, edge functions). Update the small number of existing call sites:

- `Dashboard.tsx` — already uses context via `AIAssistantPanel`; switch to `effectiveContext`.
- Visual Editor AI menus (`AIActionsMenu`, `AIQuickActionsMenu`, `AITimelineMenu`) — read `effectiveContext` instead of `context`.
- Any future page follows the same rule; documented in `src/contexts/AIContext.tsx` header comment.

## 7. Modes

Keep existing four modes in `AIStatusContext`: manual, assisted, smart, growth. Growth remains selectable but non-executing (no automation runner change in this task).

## Technical summary

```text
DashboardLayout (header)
  └─ AIContextBar  ── opens ──► Context Switcher popover
                                  └─ AIContextService.upsert → ai_context

AIContextProvider
  ├─ context      (persisted, from ai_context)
  ├─ override     (in-memory, campaign/brand scope)
  └─ effectiveContext = override ?? context   ← all pages read this

Pages: Dashboard, Campaigns, CreateAd, Templates, BrandKit,
       MediaLibrary, VisualEditor, Analytics
  └─ useAIContext().effectiveContext → AI services (Decision, Jobs, edge fns)
```

Files touched:
- Delete: `src/components/ai/AIContextPill.tsx`, `src/components/ai/AIStatusPill.tsx`.
- Edit: `src/contexts/AIContext.tsx` (add override API), `src/components/dashboard/AIContextBar.tsx` (override badge + lock), `src/pages/Dashboard.tsx` (remove duplicate bar), `src/pages/Campaigns.tsx` and `src/pages/BrandKit.tsx` (push/clear override), visual-editor AI menu files (use `effectiveContext`).
- No DB migration. No new routes. No UI redesign.
