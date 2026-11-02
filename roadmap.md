# Approved architecture implementation

- [x] 1. Align canonical `ads` storage with campaign ownership and complete canvas documents.
- [x] 2. Connect Create Ad and Visual Editor to campaign creative persistence.
- [x] 3. Show canonical creatives in campaign workspaces and duplicate them atomically, including version IDs.
- [x] 4. Standardize template handoffs and redirect the duplicate library.
- [x] 5. Consolidate AI context, status and brain state without automatic creative edits.
- [x] 6. Remove superseded routes/state; migrate existing drafts and recommendations without deleting recovery records. New application functions use owner checks and restricted grants. Existing admin security-definer functions retain required role-checked access.
- [x] Targeted tests and public/protected-route browser checks passed.
- [x] /dashboard, /campaigns and /create-ad walked signed in at phone (430px) and desktop (1280px) widths: created a real campaign through the create-ad wizard, opened its workspace, and scrolled all 11 tabs — zero content escaping its box. Remaining: visual editor save/reopen/export and campaign duplication end-to-end checks (now unblocked; run them on request).
- [ ] Hosted leaked-password protection: requires an external Supabase authentication setting change, unavailable through current tools.