# Rebuild the Visual Editor as AdVista Studio

The selected direction is the Canva-inspired studio, adapted to AdVista rather than copied. The existing bottom tool bar, its item order, and all current editing functions stay intact.

## Visual direction

- Use an AdVista purple command-bar gradient from `#6C63FF` to `#A78BFA`; no pink.
- Show **AdVista Studio** in Outfit in the top bar, with Figtree for editor controls and panel content.
- Keep the workspace and panels in the existing dark `#1A1A1A` / `#2D2D2D` system.
- Keep Export as white text directly on the gradient bar, alongside compact undo, redo, more, and navigation controls.
- Preserve the current editor’s functional controls, selection states, zoom, template loading, upload, layers, properties, preview, publishing, and Human-First AI behavior.

## Mobile editor

- Rebuild the phone layout as a stable three-part studio: gradient command bar, dominant dark canvas viewport, and the existing bottom tool bar.
- Keep the artboard centered and fully visible at Fit across portrait, square, landscape, custom template, and video dimensions.
- Remove the large empty-canvas overlay that currently obscures the artboard. Use a quieter empty state that does not cover the canvas controls.
- Convert the current light, short slide-up sheet into a dark draggable work tray matching the references. It will support closed, compact, and expanded states without covering the bottom tool bar.
- Make Templates open directly into a useful creation tray: search/prompt controls, relevant categories, recent items, and a responsive two-column template grid using real available template data.
- Keep the bottom tool bar’s current AdVista items and order unchanged. Improve only its dark visual treatment, active state, safe-area spacing, and scrolling behavior.
- Keep zoom controls available but visually subordinate, repositioning them so they never collide with the tray, artboard, or bottom tools.

## Desktop editor

- Carry the same hierarchy to desktop without turning it into a phone mockup.
- Use the AdVista gradient command bar across the top.
- Keep the existing left creation panel and right selected-element inspector, restyled in the same dark surface system.
- Keep the artboard dominant, centered, and fitted between the panels and timeline.
- Preserve the timeline and current desktop workflows, while aligning panel spacing, typography, search fields, templates, and selection states with the chosen mobile direction.

## Interaction behavior

- Tool taps open the matching tray or panel; tapping the active tool can collapse it.
- Mobile tray drag and close actions will feel weighted and predictable, with reduced-motion support.
- Opening, expanding, or closing a tray will recalculate Fit so the artboard never hides behind it.
- Template cards remain one-click editable; upload, text, element, brand, media, AI Studio, background, and layers retain their existing actions.
- AI actions remain optional, explainable, previewable, and reversible; no suggestion edits the design automatically.

## Technical scope

- Update `src/pages/VisualEditorPage.tsx` for the command bar, canvas hierarchy, mobile tray states, responsive desktop structure, and collision-free Fit behavior.
- Update `src/components/visual-editor/panels/StudioPanels.tsx` so all creation panels share the dark studio styling and the Templates panel follows the selected search-and-grid composition.
- Add editor-scoped semantic tokens and typography rules in `src/index.css`, then expose the font families through `tailwind.config.ts`.
- Update the font link in `index.html` only to load Outfit and Figtree for the selected visual direction.
- No database, template schema, campaign, publishing, or unrelated page changes.

## Verification

- Test at 430×675 and a taller phone viewport: empty canvas, template loaded, tray compact/expanded/closed, each bottom tool, zoom, Fit, selection, and safe-area spacing.
- Test desktop at 1280×1800: left panel, artboard, right inspector, timeline, template loading, and resizing.
- Confirm no panel or control overlaps, no artboard clipping, no horizontal page overflow, and no bottom-tool changes in content or order.
- Run the production build and focused editor checks before completion.

After the rebuild, verify these AdVista-specific 

behaviors are preserved:

1. Hook/Body/CTA zone indicators still show  on the timeline

2. Object role tagging (✨ sparkle button) still appears in the floating toolbar

3. Brand Kit enforcement flags still appear in the right panel when non-brand colors used

4. Pre-export ad health checklist still fires on Export click

5. ai_context is still read on editor load

6. decisions table is still written to on every confirmed AI action.

These are AdVista's differentiators — do not remove them during the rebuild.

&nbsp;