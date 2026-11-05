# AdVista Responsive UI Audit — Baseline

Date: 2026-11-04  
Scope: inspect first, then fix the highest-impact public-layout defects. Not a redesign.

## Tool and skill availability

| Tool / skill | Status | How it was used |
|---|---|---|
| UI UX Pro Max | Installed at `~/.cursor/skills/ui-ux-pro-max` | Queried UX + html-tailwind guidance for overflow, chips, wrap-anywhere |
| Taste (`design-taste-frontend`) | Installed | App-screen chapter read; **not** used to restyle the product. This is a stabilization pass. |
| Playwright MCP | **Not available** in this session | No Playwright package in the repo |
| Live browser | cursor-ide-browser + CDP | Viewport emulation, overflow probes, screenshots |
| Authenticated app | Session available in the running preview | `/create-ad`, `/dashboard`, `/visual-editor` measured |

UI UX Pro Max guidance applied: wrap long tokens with `min-width: 0` / wrap-anywhere; do not use overflow-hidden as a conceal strategy. The skill’s generic `overflow-x-hidden` example was **not** followed — it conflicts with the project constraint.

## Route inventory (from `src/App.tsx`)

### Public
- `/` landing
- `/auth` login / signup
- `*` NotFound

### Protected (DashboardLayout)
- `/dashboard`, `/campaigns`, `/campaigns/:id`
- `/create-ad`, `/templates`, `/templates/generate`
- `/media-library`, `/brand-kit`, `/analytics`
- `/settings`, `/billing`
- `/exports`, `/integrations`, `/notifications`, `/automation`, `/team` (several marked Soon)
- `/marketplace`, `/developer` (disabled/soon)
- `/system` admin monitor

### Protected (own chrome)
- `/visual-editor` (`VisualEditorPage`, Fabric.js)

### Admin
- `/admin`, `/admin/users`, `/admin/templates`, `/admin/templates/gallery`, `/admin/decisions`, `/admin/analytics`, `/admin/providers`, `/admin/playbooks`, `/admin/settings`

## Live viewport results

Viewports used: 320×700, 768×1024, 1024×768, 1280×800.

### `/` landing — before

| Viewport | Finding |
|---|---|
| 320 | Header hamburger sat next to the logo (not trailing). Hero badge wrapped awkwardly. Cards probed ~8px past the viewport. **Page could not scroll**: `html, body, #root { overflow: hidden }` while `#root` content was ~5400px tall. |
| 768 | Public nav stacked into **three rows** inside a pill and overlapped the hero. Typical tablet failure. |
| 1024 | Same stacked nav overlapping the two-column hero. |

### `/` landing — after first fixes

| Viewport | Finding |
|---|---|
| 320 | Single-row header, hamburger trailing. Page scrolls. Badge still wraps “TEAMS” on a second line (acceptable). |
| 768 | Compact header + hamburger (full link row reserved for `lg+`). No overlap, no overflow offenders, page scrolls. |
| 1280 | One-row header: logo, links, launch chip, Sign In, Get Started. Vertical scroll works. |

### `/auth` at 320×700

Form fits. No overflow offenders. Login/Sign Up tabs, fields, and primary button stay inside the card.

### Protected routes

Not live-inspected. `/dashboard` → `/auth`.

## Code-level defects still open (not yet live-verified)

1. **Dashboard shell** `.page-content { overflow-x: hidden }` and `.app-shell { overflow: hidden }` — local containment, but `.page-content` can still hide grid/card overflow. Prefer local `overflow-x: auto` on tables/rails, then drop the pane clip.
2. **Global `* { min-width: 0; word-break: break-word }`** — helps shrink, but fights compact chips and can wrap buttons/labels badly (UI UX Pro Max: don’t `break-all` globally).
3. **Unused `src/components/advista/Header.tsx`** — date-range header with `whitespace` actions; not the live shell header (`DashboardLayout`).
4. **Visual Editor** — mobile header is already compact (back, title, undo/redo, save, more, export). Desktop `TopToolbar` is dense. Needs logged-in inspection at 320–768 for canvas vs bottom sheet vs keyboard.
5. **Tables** — `.data-table td { white-space: nowrap }` is fine only if the table lives in a local horizontal scroller.
6. **No Playwright** — no automated overflow gate yet.

## Root causes already fixed

1. **Global clip** — `html/body/#root { overflow: hidden }` hid landing/auth overflow and blocked scrolling. Now `html` scrolls vertically; `overflow-x: clip` only to avoid scrollbar/`100vw` artifacts. `.app-shell` width is `100%`, not `100vw`.
2. **Public header structure** — logo, links, and actions were stacked siblings, shown from `md` (768px). Now one flex row; full desktop chrome from `lg`; hamburger through tablet.

## Files changed so far

- `src/index.css` — document overflow, app-shell width
- `src/components/Navigation.tsx` — single-row responsive header
- `src/pages/Index.tsx` — heading clamp, badge wrap, card text `min-w-0`

## Authenticated spot check (2026-11-04, live session)

Playwright is not in this repo. Measurements used the Cursor browser at emulated viewports. Document `scrollWidth` stayed within the viewport because `.page-content` and the editor shell clip overflow. Elements still extend past the viewport inside that clip.

| Route | Viewport | Document overflow | What is wrong |
|---|---|---|---|
| `/create-ad` | 320×700 | 0 | No elements past the viewport |
| `/dashboard` | 320×700 | 0 | `.metric-cards-grid` becomes a 200px-wide horizontal rail below 768px. The “Customize” control is clipped to “Customiz”. The subtitle breaks as “your c / today”. |
| `/visual-editor` | 375×812 | 0 | Canvas fits (about 335×419). Bottom toolbar items extend to about x=426. Header title truncates on purpose. |

Live shell is `DashboardLayout` (`top-bar`, sidebar, `MobileBottomNav`). `src/components/advista/Header.tsx` and `Sidebar.tsx` are not mounted by `App.tsx`. `src/pages/advista.tsx` is unused.

## Next

Fix the dashboard action row and the mobile metric rail at the component, then the editor bottom toolbar. Do not remove `.page-content` overflow clipping until those children fit or scroll locally. Playwright is still not installed.
