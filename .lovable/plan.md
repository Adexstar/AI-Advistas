# Keep every page and tab inside its container

## Goal
Fix the campaign navigation first, then audit every active user and admin page so tabs, controls, tables, cards, and long content never extend beyond their visible box at mobile, tablet, or desktop widths. Preserve the existing layout and visual language.

## Confirmed issues
- The campaign workspace contains 11 tabs and relies on horizontal scrolling, but the available overflow is not visually clear.
- The Campaign Analytics sub-navigation contains five single-line tabs with no wrapping or scroll containment, so it can escape its parent on narrow screens.
- The Campaigns status filters wrap without row spacing, which can crowd or overlap when the row breaks.
- The shared tab control defaults to one fixed-height, single-line row; several pages use that default with labels too wide for mobile.

## Implementation
1. **Harden the shared page frame**
   - Ensure the main content area and immediate page wrappers can shrink within the sidebar layout.
   - Prevent accidental page-level horizontal scrolling while preserving deliberate scrolling inside tables, timelines, editors, and tab rails.

2. **Fix campaign navigation**
   - Keep the campaign workspace tabs inside a dedicated full-width scroll rail with stable tab sizing and visible scroll affordance.
   - Make labels remain readable without changing the tab order or content.
   - Contain the Campaign Analytics sub-tabs using the same responsive pattern.
   - Give the Campaigns status filters predictable gaps and sizing when they wrap.

3. **Standardize tab behavior across the app**
   - Add reusable, opt-in patterns for scrollable tab rails and wrapped tab grids rather than forcing one behavior on every tab set.
   - Apply the correct pattern to all active tab interfaces, including Settings, Media Library, template browsing and approval, previews, testing, predictions, and dashboard insight panels.
   - Keep compact tab groups compact when they already fit.

4. **Audit every routed page**
   - Check all user, admin, editor, authentication, and public pages for overflowing flex rows, fixed/minimum widths, long labels, dense button groups, tables, charts, media, and preformatted content.
   - Add `min-width: 0`, wrapping, truncation, responsive grids, or local horizontal scrolling at the narrowest responsible container.
   - Do not hide useful content merely to suppress overflow.

5. **Responsive verification**
   - Test representative narrow mobile, tablet, laptop, and wide desktop widths.
   - Programmatically detect elements extending beyond the viewport or their intended container.
   - Exercise every tab group and verify active states, keyboard focus, sticky positioning, and intentional horizontal scrolling.
   - Run the existing checks and correct any regressions found.

## Technical notes
- Changes stay in presentation and layout code; campaign behavior and data remain unchanged.
- The shared tab primitive will retain its current default appearance. Reusable classes or wrappers will provide explicit `scroll` and `wrap` behavior per use case.
- Wide data tables remain locally scrollable instead of compressing columns into unreadable widths.
