# Verify real pages with a self-created test account

## Goal
Sign into the actual app (not a mock) from the preview sandbox, walk the key pages end-to-end at phone width, and fix anything that renders or behaves wrong.

## Approach
1. **Create a test account through the app's own sign-up form**
   - Register a throwaway account (e.g. `qa+<random>@advista-test.dev`) via the `/auth` sign-up screen in Playwright, exactly as a real user would.
   - If Supabase requires email confirmation, this blocks at the confirm step: report it and fall back to the "you click, I fix" loop for data-dependent pages.
2. **Walk the real pages signed-in, phone width (430px) and desktop**
   - Dashboard, Campaigns (empty state + create flow), Create Ad, Templates / gallery, Brand Kit, Media Library, Settings, Visual Editor (new blank canvas: add text, shape, image, undo, export).
   - Screenshot each page; measure horizontal overflow automatically on every page.
3. **Fix anything found**
   - Same standard as the campaign tab-bar fix: nothing outside its box, controls reachable, toasts clear of the bottom nav.
   - Re-verify each fix against the live signed-in session, not mocks.
4. **Cleanup and report**
   - Leave the test account in place (needed for future verification sessions) and note its email in the task list.
   - Report what was verified and what still needs your eyes (e.g. pages that need real campaign/template data on your account).

## Limits
- A fresh account has no campaigns or templates, so data-heavy views are verified for layout and empty states only; pages populated with your real data still need your screenshots.
- Admin-only pages (admin templates, provider keys) can't be reached with a regular test account unless you make it an admin in Supabase.
