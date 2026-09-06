# Remove AI-made templates from AdVista

Templates should only ever be the real, curated designs in the library. Nothing should be conjured up by AI as a ready-made template.

## What changes for you

- The "Create with AI" buttons disappear from both template pages.
- The AI template generator page is gone; anyone who lands on its old link is sent back to the template library.
- The template library keeps showing only the real templates, and every one of them stays fully editable in the editor.
- Nothing else moves: same layout, same sidebar, same cards, same editor.

## Nothing to clean up in your library

Checked the saved templates: all 30 are real AdVista Originals, none were AI-made, so no designs get deleted.

## Technical details

- Delete `src/pages/TemplateGenerate.tsx` and `src/components/ad/GenerateTemplateDialog.tsx`.
- Remove the lazy import and both `generate` routes in `src/App.tsx` (`/templates/generate`, `/template-library/generate`); add redirects to the parent template routes so old links do not 404.
- Remove the "Create with AI" button and unused `Sparkles`/navigate wiring in `src/pages/Templates.tsx` (line ~179) and the hero-banner button in `src/pages/TemplateLibrary.tsx` (line ~566), keeping the banner copy and layout intact.
- Delete the generator service folder `src/services/templates/generator/` (`AITemplateGeneratorService`, `TemplateBlueprintService`, `TemplateRenderingService`, `MarketingCopyService`, `LayoutSelectionService`, `TemplateLearningService`, `index.ts`) after confirming no other imports remain.
- Remove the `generate-ai-template` edge function source and un-deploy it.
- Leave the AI copy/suggestion helpers inside the Visual Editor untouched — they assist editing real templates and stay optional and reversible.
- Verify with `npx tsgo --noEmit -p tsconfig.app.json`.
