# Fix template rendering in the Visual Editor

The screenshot shows "Flash Sale 48H" opened in the editor as a plain pink block with a grey square, nothing like the finished design shown on its own card in the Templates panel.

## What the data shows

Checked the stored design for that template:

- Its picture layer has no real picture attached — it stores the marker `{{product_image}}`, and the logo layer stores `{{brand.logo}}`. When nothing fills those markers, the editor swaps in the grey "Image" box. That is exactly the grey square in the screenshot.
- The pink is the design's background colour, so with the photo missing there is nothing left to see.
- The design has a finished picture already saved (its preview image), which is what the card thumbnail shows — the editor just never falls back to it.
- The design also does not record its own frame size, so the editor has to guess from other fields.

Text layers should be drawing on top; whether they render is not confirmed yet, so verifying that in the running editor is the first step.

## Fix

1. Open the template in the editor with a browser check and confirm what is actually on the canvas (text present or missing, image layer state, canvas size vs frame size).
2. Fill picture markers before drawing: `{{product_image}}` falls back to the template's saved preview image, `{{brand.logo}}` to the active brand kit logo. Only when both are absent do we show the grey placeholder, and it keeps a visible "replace image" affordance.
3. When a design does not record its own frame size, take the frame from the template record (1080x1080 here) and scale the layers into it, so no layer sits half outside the frame.
4. Fix whatever step 1 turns up for the missing text, then re-check the same template renders like its thumbnail at fit zoom on a phone-sized screen.

## Technical notes

- `src/services/templates/loadIntoCanvas.ts`: extend `sanitizeObject` so unresolved image markers try the fallback source (already passed in as `fallbackImageSrc`) before creating a placeholder; currently the fallback is only used when `src` is empty/unresolvable in a narrower path.
- `src/services/templates/TemplateEngine` instantiate step: map `product_image`/`hero_image` variables to `template.preview_url` and `brand.logo` to the active brand kit logo so placeholders resolve upstream of the canvas.
- `src/pages/VisualEditorPage.tsx` `loadTemplateRecord`: set canvas dimensions from `template.width/height` before enlivening objects, and normalise object coordinates when the JSON authoring frame differs from the artboard.
- No database or schema change; no layout, panel, or sidebar changes.
