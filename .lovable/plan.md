# Fix: templates render at the wrong size in the canvas

Right now a template opened in the Visual Editor shows only part of itself and at the wrong proportions. Three things in the current code cause this:

1. The canvas artboard is always one of the fixed presets (default Mobile, 360x640). A 1080x1080 or 1080x1350 template is squeezed into that box and then each layer is re-scaled/offset by hand, so the design no longer matches its own frame.
2. The fit calculation caps zoom at 100% (`Math.min(..., 1)`), so a small artboard can never grow to fill the viewport, and the padding is applied twice (viewport padding plus a hardcoded pad).
3. The artboard is scaled with a CSS `transform` while its layout box stays at full unscaled size inside a centered, `overflow-hidden` flex container. When the unscaled box is bigger than the viewport, flex centering pushes the top/left outside the container and it gets clipped — the "half the template" symptom.

## What will change

**Artboard follows the template.** When a template is loaded, the canvas is resized to the template's own width/height (from the template record, falling back to its Fabric JSON, then to the current preset). A "Custom (WxH)" entry is added to the artboard dropdown so the size is visible and the user can still switch presets afterwards.

**No more per-layer rescaling on load.** Since the artboard now matches the template frame, layers load at their authored coordinates. The existing text-inside-bounds clamp stays, but the manual `fit`/offset pass over every object is removed.

**Correct gallery-style fit.** Fit-to-screen scales the artboard up or down (removing the 100% cap, clamped to the existing min/max zoom) so the whole template is always visible with a small margin — like viewing a picture in a gallery, never cropped, aspect ratio preserved.

**Scaled box takes real space.** The artboard is wrapped so its scaled footprint is what the layout centers on: `transform-origin: top left` with an outer element sized `width*zoom / height*zoom`. Centering then works at any zoom, and when the user zooms past fit, the viewport scrolls instead of clipping.

Fit runs on template load, artboard change, viewport resize, and the Fit button — as it does today.

## Technical notes

- `src/pages/VisualEditorPage.tsx`
  - `preset`/`artboard` state gains a custom size (`customArtboard` state consulted before `ARTBOARD_PRESETS`).
  - `fitZoom`: drop the `1` cap, use a single margin (24px desktop / 16px mobile), return a value clamped to `MIN_ZOOM`/`MAX_ZOOM`.
  - `CanvasStage`: wrapper markup gets the outer sized box + `transformOrigin: 'top left'`; viewport switches to `overflow-auto` with centered content so zoomed-in views pan rather than crop.
  - `loadTemplateRecord`: set artboard from template dims, `canvas.setDimensions`, drop the fit/offset loop, trigger a fit after load.
- `src/components/visual-editor/canvasActions.ts`: no behaviour change; the dropdown renders the custom entry from the page.
- No layout, styling, or panel structure changes beyond the canvas wrapper sizing.

## Verification

Load an original template via "Use this template" on both desktop and a 430px-wide viewport: the full design is visible, correctly proportioned, no clipping; Fit re-centers it; zooming in pans instead of cutting the frame.
