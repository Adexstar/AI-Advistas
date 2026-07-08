# Visual Editor — Mirror Mockup Exactly

The current `/visual-editor` page uses a dark custom icon rail on the far left and a template browser panel. The mockup instead shows the standard AdVista **main app sidebar** on the far left, followed by a light **Elements / Uploads tabbed panel**, a mockup-accurate top bar, formatting toolbar, canvas, right AI Creative Assistant panel, and a bottom AI suggestion banner.

## Changes

1. **Left rail → main AdVista sidebar**
   - Wrap `/visual-editor` route in `DashboardLayout` (matches every other app page).
   - Remove the dark custom `IconRail` from `VisualEditorPage.tsx`.
   - "Visual Editor" nav item stays highlighted from the main sidebar as in the mockup.

2. **Secondary left panel (Elements / Uploads)**
   - Replace the multi-tab "Templates / Media / Text / Elements / Brand / Uploads / Layers / Projects" panel with a 2-tab pill switch: **Elements** (default) and **Uploads**, matching the mockup.
   - Elements tab sections in order: **Search elements**, **Quick Add** (Headline, Subheadline, Body Text, Button), **Brand Kit** summary (Logos 12, Colors 18, Fonts 6 + View all), **Shapes** (5 shape thumbnails + See all), **Graphics** (4 graphic thumbnails + See all), **AI Tools** (BETA badge) with rows: Generate Image, Remove Background, Magic Resize, Text to Image.
   - Keep click handlers wired to existing canvas actions (add text, add shape) so functionality is preserved.

3. **Top workspace bar**
   - Above the canvas: Project title `Summer Glow Serum Ad` with inline edit, "Saved a few seconds ago", `1080 × 1350`, zoom `100%`.
   - Above that: full-width bar with **Workspace** (AdVista Agency), **Category** (Beauty), **Goal** (Conversions), **Mode** (Assisted), **AI Ready** pill, Undo/Redo, **Resize**, **Preview**, **Download**, **Publish**, overflow menu.

4. **Formatting toolbar** (canvas top)
   - Alignment / distribute icons, font family (Montserrat), size (48), Bold/Italic, color swatch, alignment, **Effects**, **Animate**, overflow — mirroring the mockup order.

5. **Canvas frame**
   - Center canvas on soft pink/lavender background, floating handles on selection, tiny page thumbnail + **Add Page** below.
   - Left-of-canvas floating action rail (layers, duplicate, comment, lock, delete).

6. **Right panel — AI Creative Assistant**
   - Keep existing `DesignScorePanel` + `AISuggestionsList` (already built) but pin them as the persistent right column with **View all** in header.
   - Add **Layers / Pages** tabbed section below with the layer list (Logo, Headline, Subheadline, Feature List, Product Image, Flowers, CTA Button, Bottom Icons, Background) with eye + overflow icons.

7. **Bottom AI suggestion banner**
   - Sticky bar spanning the canvas + right panel: "AI Suggestion: This layout has a 24% higher CTR in Beauty campaigns. Would you like to create 3 variations of this design?" with **Generate Variations** / **Not now** / dismiss.

8. **Preserve behavior**
   - Keep Fabric canvas init, selection handlers, zoom, export, AIActionsMenu, AIQuickActionsMenu, EmptyCanvasAIStart, DesignScorePanel logging.
   - Mobile: collapse secondary panel + right panel into sheets (already wired).

## Technical

- Edit `src/App.tsx`: move `/visual-editor` route inside a `DashboardLayout` parent route (use `<Outlet />` pattern already used by other pages).
- Rewrite `src/pages/VisualEditorPage.tsx`:
  - Remove `IconRail`.
  - Replace `TemplatesPanel` / `TextPanel` / `ElementsPanel` / `BrandKitPanel` / `LayersPanel` etc. with a single new `ElementsUploadsSidebar` component matching mockup sections.
  - Add `WorkspaceBar` (chips row) above `TopToolbar`.
  - Extend `RightPanel` with `LayersPagesSection` at bottom.
  - Add `AIBanner` sticky bottom component.
- No schema changes. No new dependencies.

## Out of scope
- Wiring the top chips (Workspace/Category/Goal/Mode) to real state — they render as static presets for now, matching the mockup.
- Building real Shapes/Graphics libraries beyond visual placeholders.
