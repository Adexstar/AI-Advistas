# Project Rules

- Centralize Fabric image cover/replacement geometry in `canvasImagePlacement.ts` so uploads, replacements, templates, and resizing use identical non-distorting behavior.
- Store creatives in `ads` through CreativeService, with complete canvas documents and owner-validated campaign links; browser storage is recovery-only to avoid orphaned designs.
- Use database transactions for campaign duplication and version restore; remap copied creative IDs so copies cannot alter source campaigns.
- Route all template personalization through TemplateEngine with AI opt-in; template selection must preserve authored copy.
- AIContext owns global context, status and brain state; old hooks are compatibility facades to prevent conflicting AI modes.
- AppContext is a React Query-backed compatibility facade, never a second campaign store; retain legacy records during migration for recovery.

## Cursor Cloud

- Install with `npm ci --legacy-peer-deps`. Plain `npm ci` fails because the lockfile omits Vitest's optional `esbuild` peer.
- Run the app with `npm run dev` (Vite on port 8080). Checks that pass here are `npm test` and `npm run build`. `npm run lint` reports existing repository issues.
- The UI uses the hosted Supabase project already configured in `.env`. Local Supabase and Docker are not required for the UI, tests, or production build.
- Native `canvas` is an optional Fabric dependency and is not required for the browser app or Vitest.
