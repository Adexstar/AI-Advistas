
## Scope
Improve AdVista's navigation architecture, add scaffolding for future modules, and prepare AI-ready primitives. Existing page designs (Dashboard, Campaigns, Create Ad, Templates, Brand Kit, Media Library, Visual Editor, Analytics) are **not touched**.

## 1. Sidebar restructure (`src/components/DashboardLayout.tsx`)
Replace current 3-group nav with 4 grouped sections. All existing styling (dark chrome, active purple, spacing, icons, usage widget, profile card, create button, upgrade button) preserved.

```text
CREATIVE WORKSPACE
  Dashboard, Campaigns, Create Ad, Templates, Visual Editor,
  Brand Kit, Media Library, Analytics & Reports
OPERATIONS
  Export Center, Integrations Hub, Notifications,
  Automation Center, Team Workspace
ACCOUNT
  Settings, Billing
FUTURE
  Asset Marketplace [Soon], Developer Center [Soon]   (non-clickable)
```
Section titles: uppercase, muted, non-clickable, thin `border-t border-white/10` divider between groups.

## 2. Sidebar search (`src/components/sidebar/SidebarSearch.tsx` — new)
Reusable input, sits **above** the Create Ad button. Placeholder: `Search campaigns, templates, brands...`. Opens global search palette (⌘K). No search logic yet — UI + event only.

## 3. Global Command Palette (`src/components/GlobalSearch.tsx` — new)
`shadcn/command` dialog triggered by ⌘K / Ctrl+K, listing categories: Campaigns, Templates, Media, Brand Kits, Exports, Notifications, Settings, AI Decisions, Automation Rules, Users, Integrations. Empty state "Search coming soon". Mounted once in `DashboardLayout`.

## 4. AI Status pill (`src/components/ai/AIStatusPill.tsx` — new + `src/contexts/AIStatusContext.tsx`)
Small pill in desktop header (left of search) and compact variant in mobile header. Shows: `status` (Ready/Working/Approval/Learning), `category` (e.g. Beauty), `mode` (Manual/Assisted/Smart/Growth). Global context provider wraps app; default `{ status: 'ready', mode: 'manual', category: 'General' }`.

## 5. Notification badge (`src/components/ui/NotifyBadge.tsx` — new)
Reusable pill with count + variant (unread, ai, automation, export, campaign). Header bell reuses it; sidebar Notifications item accepts optional badge count.

## 6. Coming Soon page + module stubs
- `src/pages/ComingSoon.tsx` — reusable, accepts `title`, `description`. Uses existing card/spacing tokens.
- New page shells (each renders `<ComingSoon>` initially, structured for future expansion, using existing DashboardLayout wrapper):
  - `src/pages/ExportCenter.tsx` — sections: Formats (PNG/JPG/PDF/SVG/MP4/GIF/ZIP), Social Presets, Queue, History (placeholders).
  - `src/pages/IntegrationsHub.tsx` — category grid: Advertising, Creative, Storage, Backend, Developer with cards (Connected/Not Connected/Last Sync/Connect/Disconnect/Health).
  - `src/pages/Notifications.tsx` — categories, read/unread/archive/mark-all/filter/search shell.
  - `src/pages/AutomationCenter.tsx` — sections: Overview, Approval Queue, Rules, Decision History, Running, Scheduled, Growth Agent Status, Recent AI Activity, Autonomy Level selector.
  - `src/pages/TeamWorkspace.tsx` — Members, Roles, Permissions, Brand/Campaign Access, Template Sharing, Activity Log, Approvals.
  - `src/pages/AssetMarketplace.tsx` — ComingSoon.
  - `src/pages/DeveloperCenter.tsx` — ComingSoon.
  - `src/pages/SystemMonitor.tsx` — admin-only (AdminRoute), sections: AI Jobs, Queue Status, Failed Jobs, API Health (OpenAI/Canva/Freepik/Supabase), Webhook Logs, Rate Limits, DB Health. Not in sidebar.

## 7. Settings restructure (`src/pages/Settings.tsx`)
Convert to tabbed layout using existing card/tab tokens: General, Workspace, AI Preferences, Notifications, Security, Appearance, Connected Accounts, Advanced. Existing form fields moved into General; other tabs are structured placeholders.

## 8. AI Preferences panel (`src/components/settings/AIPreferences.tsx` — new, used in Settings tab)
Sections: AI Mode (Manual/Assisted/Smart/Growth Agent [Beta]), Approval Rules, Brand Protection (Lock Logo/Colors/Fonts/Tone), Automation toggles, Learning toggles. Writes into local state hook `useAIPreferences` (in-memory) — backend later.

## 9. Mobile bottom nav (`src/components/MobileBottomNav.tsx` — new)
5 tabs: Dashboard, Campaigns, ＋Create (raised), Templates, More. "More" opens a `Sheet` bottom-sheet listing the four sidebar groups. Rendered inside `DashboardLayout` for `lg:hidden`. Existing mobile header preserved.

## 10. Routing (`src/App.tsx`)
Add lazy routes for: `/exports`, `/integrations`, `/notifications`, `/automation`, `/team`, `/marketplace` (coming-soon; visible but non-clickable in sidebar so route is optional), `/developer`, `/system` (admin). All wrapped in `DashboardLayout` + `ProtectedRoute`; `/system` also wrapped in `AdminRoute`.

## 11. Remove standalone AI Assistant
Grep for any AI Assistant page/route/nav entry and remove. (Current codebase already has none in sidebar; verify no orphan route.)

## Files
**New**
- `src/pages/ComingSoon.tsx`
- `src/pages/ExportCenter.tsx`, `IntegrationsHub.tsx`, `Notifications.tsx`, `AutomationCenter.tsx`, `TeamWorkspace.tsx`, `AssetMarketplace.tsx`, `DeveloperCenter.tsx`, `SystemMonitor.tsx`
- `src/components/sidebar/SidebarSearch.tsx`
- `src/components/GlobalSearch.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/components/ai/AIStatusPill.tsx`
- `src/contexts/AIStatusContext.tsx`
- `src/components/ui/NotifyBadge.tsx`
- `src/components/settings/AIPreferences.tsx`

**Edited**
- `src/components/DashboardLayout.tsx` (nav groups, search slot, AI pill, mobile bottom nav mount, global search mount)
- `src/App.tsx` (new routes, AIStatusProvider)
- `src/pages/Settings.tsx` (tabbed layout wrapper — existing content preserved in General tab)

## Out of scope
- No backend/DB changes.
- No redesign of the eight approved pages.
- Search logic, notification data, AI job execution — hooks only.

## Approve to build.
