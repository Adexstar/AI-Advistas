# Make uploaded media fill the selected design size

## Goal
Match the Canva references: the blank white design uses the exact selected format, and any uploaded photo or opened template immediately fills that design edge to edge instead of appearing as a small object with large white margins. Keep the existing bottom editor controls unchanged.

## Plan
1. **Use real social-media dimensions**
   - Replace the editor’s reduced placeholder sizes with production pixel sizes.
   - Add clear choices for:
     - Instagram Portrait Post — 1080 × 1350 px
     - Pinterest Pin (2:3) — 1000 × 1500 px
     - Instagram Reels / Mobile Video — 1080 × 1920 px
     - TikTok Video — 1080 × 1920 px
   - Keep the canvas auto-fit behavior so these large dimensions still appear fully centered on phone and desktop screens.

2. **Make first uploads fill the design automatically**
   - When the design is empty, place the uploaded photo at the canvas origin and scale it proportionally to cover the entire selected design.
   - Center the crop so no white gaps remain; preserve the source aspect ratio instead of stretching the photo.
   - Keep the image editable after placement so it can still be moved, resized, cropped, replaced, undone, and exported.

3. **Make replacement images retain their frame**
   - When replacing a selected image, preserve its displayed frame, position, angle, layer order, and metadata.
   - Scale the new source with cover behavior inside that frame, preventing gaps or distorted images.

4. **Normalize opened templates to their authored frame**
   - Continue adopting valid template width and height metadata.
   - For templates whose layer coordinates differ from their declared frame, scale and center all layers consistently so the complete composition lands inside the artboard.
   - Treat a single flattened template image as a full-bleed design rather than a small centered layer.

5. **Keep blank and filled states visually consistent**
   - Blank state: show a clean white artboard with the chosen aspect ratio, centered like the second reference.
   - Filled state: show the photo/template edge to edge like the third reference, with the editor controls outside the artboard.
   - Do not change the existing bottom bar styling or item order.

6. **Verify the full flow**
   - Check blank and uploaded states at mobile and desktop widths for every requested aspect ratio.
   - Test camera-roll upload, image replacement, template opening, size switching, fit-to-screen, undo, and PNG export.
   - Confirm no white gaps, overflow, clipping of the artboard itself, or stretched media.

## Technical details
- Centralize `cover` scaling as `max(canvasWidth / imageWidth, canvasHeight / imageHeight)` with centered placement.
- Update the shared artboard preset map so every editor control reads the same dimensions.
- Apply frame-aware replacement without changing the canvas size unless the user changes the design format or opens a template with its own valid dimensions.
- Preserve Fabric layer editability and history snapshots throughout upload and template loading.
