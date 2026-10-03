# Make the editor canvas look like the Canva mockup

The circled areas in your screenshot show three problems:
- The design is too small, at 40%.
- The "Start creating" box spills outside the white design.
- The title is white text on the white design, so you can't read it.
- The zoom bar floats on top of everything instead of sitting tidily in a corner.

The top bar, the bottom tool bar and the "Add page" button stay exactly as they are.

## What changes

1. **Bigger, centred design.** On first open, the design fills the dark work area, leaving only a slim margin all round, like the Canva mockups. It no longer shrinks to a small card. "Fit" returns the design to this size.
2. **Start screen inside the design.** The sparkle icon, "Start creating", the help line, the three Text / Shape / Upload tiles and the tip all sit inside the design's edges. Each part shrinks to fit when the design is small, and nothing spills past the edge.
3. **Readable on any design colour.** A white design gets dark text and soft grey tiles. A dark design gets light text, as in your mockup. The title becomes visible again.
4. **Zoom bar in the corner.** The – / % / + / Fit bar moves into the bottom-right corner of the work area, clear of the design and the page dots, using the same dark pill style. The page dots stay centred beneath the design.
5. **Hint text matches the mockup:** "Tap a tool below to add text, images, shapes, or upload your own media" and "Tip: Tap a template to start from a pre-made design".

## How I'll check it
- Screenshots on a phone and a desktop screen, compared side by side with your mockups.
- Check that nothing spills past the design's edges at any zoom level.
- Check that Text, Shape and Upload still work.

## Technical details
- `VisualEditorPage.tsx` `CanvasStage.applyFit`: target about 92% of the available stage width and height, with no small cap.
- Move the empty-state overlay so it is positioned over the artboard wrapper (absolute, inset to the artboard rectangle), not over the whole stage. Use container-relative sizing (`clamp`) so it scales with the artboard.
- Pick the foreground from the artboard background luminance. Use semantic studio tokens, not hardcoded colours.
- Zoom pill: absolute `bottom-3 right-3`, z-index above the canvas and below the sheets.
