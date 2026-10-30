# Fix "content outside the box" — campaign page and app-wide

## What's wrong (from your screenshot)

1. **Campaign tab bar (circled)** — The tab rail (Analytics / AI Assistant / Versions / Files) clips the focused tab's pill and focus ring at the container's bottom edge, so the white pill looks cut off and the box "doesn't cover" the content. Cause found in code: the shared `.tabs-scroll-shell` style uses `overflow-y: hidden` with too little vertical padding, so anything taller than the tab row (active pill, focus ring) gets sliced. This class is shared by five rails: campaign page, template gallery, campaign analytics tab, performance prediction, and A/B testing — all get fixed at once.
2. **Campaign header** — Long campaign names + status badge sit in a rigid row; a long name pushes the badge outside the screen edge. Needs min-width guards and truncation.
3. **Toast overlapping the bottom bar** — The dark "Making campaign saves reopenable…" toast sits over the mobile bottom bar and leaves the purple Create button's top half peeking out as a stray purple dot. Toasts need to sit fully above the bottom navigation on mobile.

## The plan

### 1. Central fix for every tab rail (shared CSS)
- In `src/index.css`: give `.tabs-scroll-shell` vertical breathing room (inner padding with compensating negative margins) so focus rings, active pills and shadows stay fully inside the scroll box instead of being clipped; keep horizontal scrolling behavior unchanged.
- Adjust the campaign page's sticky rail (`CampaignWorkspace.tsx`) to use the fixed shell without its own band-aid padding.
- No layout, order, or design changes — the rails keep their current look.

### 2. Campaign page containment
- Header: title gets `min-w-0` + truncation on small screens; status badge and action buttons stay inside (`shrink-0`, wrap allowed).
- Metric cards and tab panels: ensure no fixed-width children escape their cards on 430px viewports.

### 3. Toasts above the bottom navigation
- Position the toast layer bottom-center on mobile with an offset that clears the bottom nav + safe area, and a stacking level above it, so it never reveals the purple Create button behind it.
- Ensure only one toast system renders (App currently mounts the Radix Toaster and imports Sonner; keep whichever is in use, drop the dead import).

### 4. App-wide sweep for escaped content
- Drive the app with Playwright at 430px and 768px across all routed pages, measuring horizontal overflow (`scrollWidth > clientWidth`) and screenshotting each page; fix every page where content escapes its box (same patterns: `min-w-0`, wrapping, truncation, breathing room in rails).
- Authenticated pages can't be signed into from the sandbox (external backend), so a temporary dev-only QA route renders the campaign workspace with mock data for visual verification; it is removed before finishing.

## Verification
- Playwright pass at mobile + tablet widths over all routes: zero horizontal overflow, tab pills and rings fully inside their rails, toasts clear of the bottom bar.
- Temporary QA route screenshots confirm the campaign page tab bar renders complete, then the route is deleted.
- Typecheck and build pass.
