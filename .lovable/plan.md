# Visual Editor V3 — Full Rebuild

Rebuild `/visual-editor` from scratch to mirror the uploaded mockup exactly and act as AdVista's core creative workspace (Canva + Adobe Express + CapCut for ads).

## Layout (matches mockup 1:1)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Logo │ ‹ Project Name ✎  •  Saved ✓  ↶ ↷ │  − 100% +  ▦ ⛶  ▶ Preview  ⤓ Export  ✈ Publish  ? 🔔 👤 │
├──────┬──────────────────────┬──────────────────────────────┬────────────┤
│ Tabs │ Contextual Panel     │        Canvas Area            │ Properties │
│ 📄 T │ (Templates / Media / │  ┌─ ruler ──────────────┐    │   Panel    │
│ 🖼 M │  Text / Elements /   │  │                      │    │ Design |   │
│ T Tx │  Brand / Uploads /   │  │      Design canvas   │    │ Animation |│
│ ⬢ El │  Layers / Projects)  │  │                      │    │ Position   │
│ 🎨 B │                      │  └──────── + Add Page ──┘    │            │
│ ⬆ Up │                      │                              │  Dynamic   │
│ ▤ Ly │                      │  Timeline (only if video)    │  by select │
│ 📁 Pr│                      │                              │            │
│ ─────│                      │                              │            │
│ Pro  │                      │                              │            │
│ ⚙ ☾ ?│                      │                              │            │
└──────┴──────────────────────┴──────────────────────────────┴────────────┘
```

Dark theme editor chrome (not the app shell). Route stops using `DashboardLayout` — the editor is a full-viewport surface like Canva.

## Component tree (new)

- `src/pages/VisualEditorPage.tsx` — full rewrite, orchestrator only
- `src/components/visual-editor/v3/`
  - `EditorShell.tsx` — dark full-viewport frame
  - `TopBar.tsx` — logo, project name+save state, undo/redo, zoom, grid/fit, Preview, Export, Publish, help/notif/avatar
  - `IconTabRail.tsx` — vertical tabs (Templates, Media, Text, Elements, Brand Kit, Uploads, Layers, Projects) + Upgrade card + settings/theme/help
  - `panels/TemplatesPanel.tsx` — search, chips (All/Social/Ads/Stories/Video), sections: Recommended, Instagram Post, Instagram Story with "See all"
  - `panels/MediaPanel.tsx` — pulls from `useMediaLibrary`; images/videos/logos/icons/audio + folders + search + drag handle
  - `panels/TextPanel.tsx` — heading/subhead/body/CTA presets, font browser
  - `panels/ElementsPanel.tsx` — shapes, lines, arrows, icons, backgrounds, frames, grids, buttons, badges, social icons
  - `panels/BrandKitPanel.tsx` — pulls `useBrandKit`; logos/colors/fonts/assets + "Apply Brand Kit"
  - `panels/UploadsPanel.tsx` — dropzone, upload progress list, supported formats
  - `panels/LayersPanel.tsx` — layer list with lock/hide/duplicate/delete/reorder
  - `panels/ProjectsPanel.tsx` — recent/saved/drafts/campaign designs from `projects` table
  - `CanvasWorkspace.tsx` — rulers, ContextToolbar (Animate/Position/align/lock icons), Fabric canvas host, floating selection actions (edit/duplicate/delete/•••), "+ Add Page"
  - `Timeline.tsx` — video-only bottom dock with tracks (Text/Image/Shape/Video/Audio) + Add Track + playhead + playback
  - `properties/PropertiesPanel.tsx` — tabbed Design/Animation/Position, dispatches to:
    - `TextProperties.tsx`, `ImageProperties.tsx`, `VideoProperties.tsx`, `ShapeProperties.tsx`
  - `PreviewModal.tsx` — live device previews (IG/FB/TikTok/LinkedIn/YT/Google)
  - `ExportCenter.tsx` — format (PNG/JPG/SVG/PDF/MP4/GIF/WEBP) × quality (Low/Med/High/Ultra)
  - `MobileEditor.tsx` — mobile shell with top bar, bottom nav (Templates/Media/Text/Brand/Layers), FAB, bottom sheets

Reuse where present: existing Fabric init logic, `DesignScorePanel`, `AISuggestionsList`, `useAutoSave`, `useBrandKit`, `useMediaLibrary`, `useTemplates`.

## Canvas & presets

- Presets: Instagram Post 1080², IG Story 1080×1920, Facebook Ad 1200×628, TikTok 1080×1920, YouTube Thumb 1280×720, Google Display 300×250 / 728×90, LinkedIn 1200×627, Custom.
- Rulers, snap-to-grid, guides, infinite zoom (10–400%), pan (space+drag), multi-page via "+ Add Page".

## Save / auto-save / versions

- Auto-save every 2s to `projects.canvas_data` (debounced via existing `useAutoSave`).
- Manual save, Save As Template, Save As Campaign Asset, Save Draft menu on TopBar.
- Snapshot to `project_versions` on manual save + on export.

## Data / backend

New migration:

- `projects(id, user_id, name, project_type, canvas_data jsonb, thumbnail_url, width, height, created_at, updated_at)`
- `project_assets(id, project_id, asset_id, created_at)`
- `project_versions(id, project_id, version_data jsonb, created_at)`
- Storage buckets: `projects`, `project-thumbnails`, `project-exports`, `project-assets`
- RLS: owner-only via `auth.uid() = user_id`; grants per project rules.
- Activity logging: extend existing `activity_logs` inserts for Created / Edited / Exported / Deleted / Template Applied / Brand Applied / Asset Inserted.

## Integrations wired in

- Brand Kit → one-click Apply (colors/fonts/logos/assets).
- Media Library → drag assets onto canvas; inserted assets recorded in `project_assets`.
- Templates → Insert / Replace / Preview from Templates panel.
- Campaigns → "Attach to campaign" from Save menu.
- Canva / Freepik → import buttons in Templates panel (Canva via existing OAuth secrets; Freepik via existing key). Sync-back stubbed.

## Mobile

Below `md`: render `MobileEditor` — fullscreen canvas, top bar (Back/Name/Save/Export), bottom nav (Templates/Media/Text/Brand/Layers) opening bottom sheets, FAB for Add Element, pinch/drag/touch.

## States

- Empty: "Start New Design / Choose Template / Upload Design" overlay.
- Loading: canvas + asset skeletons.
- Error: retry + "Restore autosave" from `useAutoSave`.

## Out of scope (stubs only)

Real-time collaboration, comments, approvals, Canva sync-back — architecture prepared, UI hooks disabled behind "Coming soon".

## Files touched

Create: 20 files under `src/components/visual-editor/v3/` + 1 migration.
Rewrite: `src/pages/VisualEditorPage.tsx`.
Edit: `src/App.tsx` (route no longer wrapped in `DashboardLayout`), `src/integrations/supabase/types.ts` (regenerated by migration).
