# AdVista Admin Dashboard (admin as a superset of user)

Admin stays inside the existing AdVista app shell: same dark sidebar, same header, same cards. No separate app, no new design language. Admins simply get one extra sidebar group and a set of admin pages.

## 1. Sidebar

Add an `ADMIN` group to the existing `DashboardLayout` sidebar, rendered only when `useAdmin()` returns `isAdmin` (same styling as Creative Workspace / Operations / Account groups — no visual changes to those):

- Admin Dashboard `/admin`
- Users `/admin/users`
- Templates `/admin/templates` (exists)
- AI Decisions Log `/admin/decisions`
- System Analytics `/admin/analytics`
- API & Providers `/admin/providers` (exists)
- Category Playbooks `/admin/playbooks`
- System Settings `/admin/settings`

Also add page titles/descriptions for each admin route to the existing `pageMeta` map so the header reads correctly.

## 2. Admin Dashboard (`/admin`) — rebuild

Replaces the current upload-only page. Sections, in mockup order:

- System Overview: 4 KPI cards (Users, Campaigns, Revenue, Active Templates) with trend vs previous period.
- Requires Attention: prioritized alert list (templates pending review, users near usage limits, provider quota warnings, all-clear state) each with an action link.
- Usage by Plan: horizontal bars per plan + MRR line.
- User Growth chart with 7d / 30d / 90d / 1y toggle (recharts, same chart styling used on Dashboard).
- Top Templates (by usage_count) and AI Decisions Summary (totals, approved/ignored/pending, avg confidence, top action) with a link to the full log.

The existing batch/single template uploaders move to the Templates curation page so the dashboard stays an overview.

## 3. Users (`/admin/users`)

Table of users from `profiles` joined with `subscriptions` / `user_usage`: name, email, plan, campaigns, storage, AI credits with mini usage bars, status, joined date. Search + plan/status filters + pagination.

Row gear opens a right side panel: identity block, Actions (view workspace, view campaigns, view decision log, reset AI credits, change plan, suspend, delete), Details (plan, next billing, counts, last login), and Recent Activity from `activity_logs`. Destructive actions confirm first; actions with no backing capability yet are shown disabled rather than faked.

## 4. Template Curation (`/admin/templates`) — extend existing page

Add tabs: Pending Review / All Templates / Reported, plus the existing add + batch upload entry. Pending cards show preview, submitter, category, submitted date and Approve / Reject / Feedback. All Templates keeps the current list plus a `...` action menu (edit, preview, performance, edit AI tags, feature, unpublish, delete).

## 5. AI Decisions Log (`/admin/decisions`)

Filterable table over the `decisions` table (search, category, action, status, date range). Rows expand into the detail block: action, input, output, reasoning, patterns used, playbook version, campaign, user context.

## 6. System Analytics (`/admin/analytics`)

Three headline stat cards (active users, campaigns published, AI decisions), Usage by Category bars, Trending AI Actions and Top Ignored Decisions lists, Storage Usage panel with largest users, and Export CSV.

## 7. Category Playbooks (`/admin/playbooks`)

Card per row in `category_playbooks`: focus-area chips, tone guidance, learned performance patterns, auto-update flag, last updated, with Edit and History actions. Footer: Add Category, Import Patterns, Reset to Defaults.

## 8. System Settings (`/admin/settings`)

Grouped cards: General (platform name, default plan, signups, maintenance mode), AI Defaults (autonomy, models, free credits, log retention), Pricing (read-only with a Stripe link), and a clearly separated Danger Zone.

## Technical notes

- Routes registered in `App.tsx` wrapped in `ProtectedRoute` + `AdminRoute` + `DashboardLayout` (also fixing `/admin/providers`, which currently lacks the admin guard).
- Data access via new hooks in `src/hooks/admin/*` using the existing supabase client and react-query patterns.
- Reads that RLS blocks for admins (cross-user `profiles`, aggregate counts) will be added as `security definer` functions gated on `has_role(auth.uid(), 'admin')`, in a migration presented for approval. A small `system_settings` table (single row) is needed for section 8.
- No new colors or fonts: existing semantic tokens, existing card/table/badge components, recharts for charts.
- Any metric without a real data source renders an empty/zero state rather than mock numbers.
