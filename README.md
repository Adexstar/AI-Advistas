# AdVista

AdVista is a campaign workspace for briefs, creatives, templates, brand kits, and the records saved to an account. The interface is a Vite + React + TypeScript app. Data and sign-in go through Supabase. AI, stock media, uploads, and billing run as Supabase Edge Functions and only succeed when the matching secret is set.

Coming Soon pages (Export Center, Notifications, Automation Center, Team Workspace, Asset Marketplace, Developer Center) are placeholders and are not part of the working product.

## Run it locally

```sh
npm ci --legacy-peer-deps
npm run dev
```

The dev server is Vite on port 8080. `npm test` and `npm run build` are the checks that should pass. `npm run lint` still reports older issues in the repository.

Create `.env` from `.env.example` and set the three `VITE_SUPABASE_*` values for the project you want to use. The browser does not read provider secrets from `.env`. Those belong on the Supabase project.

## Keys the owner must supply

| Variable | Where it lives | What it enables |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `.env` | The Supabase project the app talks to |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` | Sign-in and database access for the browser |
| `VITE_SUPABASE_PROJECT_ID` | `.env` | Project reference kept with the client config |
| `VITE_CLOUDINARY_CLOUD_NAME` | `.env`, optional | Browser-side Cloudinary image URLs. Uploads still need the server secrets |
| `GROQ_API_KEY` | Supabase secret | Ad copy, drafts, template fill, and the default rewrite route |
| `OPENAI_API_KEY` | Supabase secret | AI gateway OpenAI route, image generation, and optional ad scoring |
| `GOOGLE_GEMINI_API_KEY` or `GEMINI_API_KEY` | Supabase secret | Gemini copy and the AI gateway Gemini route |
| `ANTHROPIC_API_KEY` | Supabase secret | AI gateway Claude route |
| `LOVABLE_API_KEY` | Supabase secret | AI template generation and template preview jobs |
| `RUNWARE_API_KEY` | Supabase secret | Video generation in AI Studio |
| `LEONARDO_API_KEY` | Supabase secret | Leonardo image generation |
| `IDEOGRAM_API_KEY` | Supabase secret | Ideogram image generation |
| `PEXELS_API_KEY` | Supabase secret, or a key saved in Admin → Imports | Pexels stock search and template import |
| `PIXABAY_API_KEY` | Supabase secret, or a key saved in Admin → Imports | Pixabay stock search and template import |
| `UNSPLASH_ACCESS_KEY` | Supabase secret, or a key saved in Admin → Imports | Unsplash stock search and template import |
| `BRANDFETCH_API_KEY` | Supabase secret | Import a public brand into a brand kit |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Supabase secrets | Media upload and hosted template previews |
| `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_SECRET_HASH` | Supabase secrets | Paid plan checkout and the payment webhook |
| `SITE_URL` | Supabase secret | Where Flutterwave sends the browser after checkout |
| `META_ACCESS_TOKEN`, `META_PAGE_ID`, `META_AD_ACCOUNT_ID` | Supabase secrets | Reserved for Meta publishing. Publishing is not implemented |
| `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID` | Supabase secrets | Reserved for TikTok publishing. Publishing is not implemented |
| `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ACCESS_TOKEN` | Supabase secrets | Reserved for Google Ads. Publishing is not implemented |
| `RUNWAY_API_KEY`, `KLING_API_KEY`, `VEO_API_KEY` | Supabase secrets | Recognized by admin status. The generators return "not implemented" |

If a key is missing, the screen that needs it shows the failure. It does not fill in sample copy, sample images, or a successful payment.

Admin → Providers lists which secrets are present and can run a live check. Settings does not issue a personal API key.

Admin → Imports can save a Pexels, Pixabay, Unsplash, or Lovable key on the signed-in admin account. That saved key is what “Test saved key” and “Fetch with saved key” call. “Fetch with project secret” calls the edge function, which still reads the Supabase secret. Import stores the photos you already fetched, then leaves them pending. Approve them in the same gallery and they show on Templates. Lovable returns copy and is not stored as a library template. The Templates page lists approved, active rows only. Templates already stored from an older import stay in that library and still open.

A saved key is not written into the Supabase secret. Redeploy `import-stock-templates` and `provider-status` after pulling this branch. Pixabay rejects a search that asks for fewer than 3 photos, and `import-stock-templates` now requests at least 3 and names `PIXABAY_API_KEY` when Pixabay rejects the key. That behavior is not live until the function is redeployed. Freepik is no longer a template source. In the Supabase dashboard, delete the `FREEPIK_API_KEY` secret and the deployed `search-freepik-templates` function. `get-freepik-template` and `process-freepik-psd` can be deleted as well if they are still deployed.

Lovable template generation calls `public.consume_quota`. That function, and the `checkout_sessions` table, are created by `supabase/migrations/20261113140000_server_quota_and_payments.sql`. Paste that file into the Supabase SQL editor and run it as the database owner. If the API still says the function is missing, run `notify pgrst, 'reload schema';` in the same editor. Until then Lovable returns “Could not check your plan limit” before it uses `LOVABLE_API_KEY`. A key saved on the account can still be tested directly against the Lovable gateway.

## Making an account an admin

The app cannot grant the first admin. `user_roles` only lets an existing admin insert a role. In the Supabase SQL editor, signed in as the database owner:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'you@example.com'
on conflict (user_id, role) do nothing;
```

Sign out and back in, then open `/admin`. A user without that row is sent back to the dashboard.

## What is not finished

- Live posting to Meta, TikTok, Google, and the other ad accounts. The buttons explain that OAuth is not configured, and the publish function does not send an ad.
- Runway, Kling, and Veo generation.
- The Coming Soon pages listed above.
- Hosted Supabase leaked-password protection, which is an Auth setting outside this repo.
