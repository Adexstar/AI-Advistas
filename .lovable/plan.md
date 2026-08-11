# Make the Visual Editor fully functional

Goal: every tool, button and panel in the existing Creative Studio actually does something, so a design can be built from scratch or from a template without errors. No structural or visual redesign — same layout, same dark studio look, same panels.

## What is broken today

Confirmed by reading `src/pages/VisualEditorPage.tsx` and the studio panels:

- **Floating selection toolbar** (AI, Edit, Duplicate, Delete, More) — buttons render but have no handlers at all.
- **Canvas sub-toolbar** (Animate, Position, align, bring forward/back, lock/unlock, size preset dropdown) — no handlers; the size dropdown does not resize the artboard.
- **Undo / Redo** — snapshots are re-recorded while a snapshot is being restored, so history corrupts itself after the first undo; the restore also uses the old Fabric v5 callback form.
- **Copy / Paste** — paste rebuilds the whole canvas from raw JSON instead of cloning the object; pasted items come back unselectable or not at all.
- **Layers panel** — reorder rebuilds the canvas by clearing and re-adding (loses selection/history) and lock only updates local state, not the object.
- **Dead legacy panels** left in the file (`TemplatesPanel`, `BackgroundPanel`, `ElementsPanel` with hardcoded gradient thumbs) that are no longer rendered — the live panels come from `StudioPanels.tsx`.
- **Text panel** — "AI Copy", font search and the four font-combination tiles do nothing.
- **Top bar** — Preview, Share/Publish and the notification bell have no handlers.
- **"Add page"** button at the bottom does nothing.
- Onboarding overlay renders with a full-size absolute layer; clicking a shape/text via the overlay works, but the overlay can sit above the canvas after the first object is added on some renders.

## What will be done

### 1. Reliable history (foundation)
Add an `isRestoringRef` guard so `object:added/modified/removed` do not record snapshots while undo/redo is loading. Await the Fabric v6 promise from `loadFromJSON`, then `requestRenderAll`, restore selection state and refresh layer/timeline views. Fix the index arithmetic so the 50-snapshot cap and the redo pointer stay in sync.

### 2. Object actions everywhere
One shared set of canvas actions (duplicate, delete, lock/unlock, bring forward/backward, align to artboard, opacity, flip) used by the floating toolbar, the canvas sub-toolbar, the layers panel and the right properties panel — so all four stay consistent.

- Floating toolbar: AI opens the existing AI actions menu for the selected object; Edit enters text editing (or opens the fill/replace tool for images/shapes); Duplicate clones with a small offset and selects the clone; Delete removes; More opens a menu with lock, layer order, flip, opacity.
- Sub-toolbar: align/order/lock buttons wired; the preset dropdown resizes the artboard (Instagram post/story, Facebook, TikTok, YouTube, desktop, mobile) and re-fits the zoom, keeping objects proportionally placed.
- Copy/paste rewritten with Fabric's async `clone()` and offset placement.

### 3. Layers panel
Reorder via Fabric's own `moveObjectTo`/z-index API instead of clear-and-re-add. Lock writes `lockMovementX/Y`, `lockScalingX/Y`, `lockRotation`, `selectable` on the object. Visibility, delete and select-on-click work off the real object reference (not a mutable index) so the list stays correct after reordering.

### 4. Text panel
"Add a text box" and the three default styles already work and stay as they are. Wire the remaining items: the font search filters the loaded font list, the font-combination tiles insert a matching heading + body pair, and "AI Copy" reuses the existing AI Studio copy generation — proposed as a preview the user accepts, never auto-applied (keeps the human-first rule).

### 5. Elements / Background / Media / Uploads / AI Studio panels
Audit each control in `StudioPanels.tsx` and wire anything inert: shape and sticker inserts, background colour/gradient/image apply, upload → place on canvas, media search result → place on canvas, and AI actions routed through the existing preview dialog. Failures show a toast instead of throwing.

### 6. Top bar and page controls
- Preview: opens a modal showing the rendered canvas at export resolution.
- Share/Publish: exports and hands off to the existing export flow (no new backend).
- Export: keeps PNG, adds JPG and the AdVista JSON option already used elsewhere.
- Notification bell: routes to Notifications.
- "Add page": either wired to a simple multi-page array (page thumbnails, switch, delete) or removed if you prefer to keep scope tight — see the question below.

### 7. Cleanup and safety
Delete the unused legacy panel components and the hardcoded template-thumb arrays from `VisualEditorPage.tsx`. Guard every canvas action with a null-canvas / no-selection check so nothing throws when the canvas is still mounting. Fix the React Fragment `data-lov-id` warning in `AIQuickActionsMenu.tsx` seen in the console.

### 8. Verification
Drive the editor headlessly and confirm, with no console errors: blank canvas → add text, shape, upload image → move/resize → undo/redo → duplicate → delete → change background → export; then load a template from the Templates panel → edit a text layer → reorder layers → export.

## Technical notes

- All work stays in `src/pages/VisualEditorPage.tsx`, `src/components/visual-editor/panels/StudioPanels.tsx` and the small `ai/` menu components. No database, edge function or layout changes.
- Fabric v6 API only: promise-based `loadFromJSON` and `clone`, `canvas.bringObjectForward` / `sendObjectBackwards`, `canvas.setDimensions`.
- The shared object-action helpers will move into a small `src/components/visual-editor/canvasActions.ts` module so the four call sites cannot drift apart. This adds a file but changes no UI.
- AI stays optional, previewable and reversible — no AI path writes to the canvas without an explicit user confirmation.
