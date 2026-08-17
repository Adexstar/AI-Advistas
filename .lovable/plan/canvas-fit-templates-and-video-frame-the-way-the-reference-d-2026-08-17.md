# Canvas fit: templates and video frame the way the reference does

Keeping the current bottom tool bar, sheets, panels and design language exactly as they are. The only work is inside the canvas viewport so the artboard (image template or video frame) always sits centered, fully visible, and correctly proportioned — like the reference screenshots.

## What is wrong today

- The fit calculation subtracts a 16/24px margin, but the centering shell then adds its own `p-4 / sm:p-6` padding on top. At exact fit the scaled artboard is already as wide as the scroll box, so the extra padding pushes it out and the viewport crops it.
- That centering shell is `min-w-full` with an inline `width: max-content`, so at small zoom it no longer centers reliably and at large zoom it can collapse instead of scrolling cleanly.
- Fit is recomputed on artboard change, resize and the Fit button, but not when the space around the canvas changes: mobile bottom sheet expanding/collapsing, the pages bar, the desktop timeline opening/closing. The canvas then keeps a zoom sized for a taller viewport and the bottom of the design hides behind the sheet.
- In video mode the canvas area shows the same Fabric artboard with no video frame treatment, so the "video should fit well" case behaves like an oversized still.

## What will change

**One source of spacing.** The padding moves out of the centering shell and into the fit math only — a single gutter value (16px mobile, 24px desktop). Scaled artboard + gutter always equals at most the viewport, so nothing is ever cropped at fit.

**Reliable centering and panning.** The scroll layer holds a simple centered grid: the artboard's *scaled* footprint is what gets centered, so a small artboard sits in the middle of the dark backdrop and a zoomed-in one scrolls in both axes instead of clipping.

**Fit reacts to every space change.** The existing ResizeObserver stays, and the pages bar plus the mobile sheet/timeline are moved outside the measured viewport (or their height is excluded), so the measured box is the true free area. Fit re-runs when the sheet opens/closes and when the timeline toggles.

**Video frames like the reference.** In video mode the artboard adopts the video's aspect ratio and uses the same fit path, so the frame is centered in the dark area above the timeline with the play/time controls under it — same components, no layout change.

## Technical notes

- `src/pages/VisualEditorPage.tsx`
  - `fitZoom`: single `GUTTER` constant; keep `MIN_ZOOM`/`MAX_ZOOM` clamp.
  - `CanvasStage` markup: drop `p-4 sm:p-6` and `width: 'max-content'`; scroll layer becomes `overflow-auto` with an inner `min-w-full min-h-full grid place-items-center`; outer sized box keeps `width/height = artboard * zoom/100` and the inner artboard keeps `transformOrigin: 'top left'`.
  - `applyFit` dependency list gains the sheet-expanded and timeline-open flags (passed into `CanvasStage` as part of `fitToken`).
  - Pages bar stays where it is visually but is rendered as a sibling of the measured viewport so it no longer eats fit height silently.
  - Video mode: derive artboard dimensions from the loaded video's intrinsic size (fallback 9:16) and route through the same custom-artboard state used for templates.
- No changes to toolbars, bottom tabs, panels, colors or typography.

## Verification

On a 430px-wide viewport and on desktop: open an image template — the whole design is visible, centered, correct proportions, nothing cut off; expand the bottom sheet and the canvas re-fits above it; zoom in and the view pans instead of cropping; switch to video and the frame fits the same way.
