# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev        # Start Vite dev server
yarn build      # Production build
yarn preview    # Preview production build
```

## Architecture

**MediaCrate** is a Vue 3 SPA for managing personal physical music media collections (CDs, vinyl, etc.).

**Stack:** Vue 3 (Composition API) + Vue Router + Vite + SCSS + Supabase (auth/DB/storage) + Discogs API + PWA (Workbox)

### State Management

There is no Pinia/Vuex. All shared state lives in composables:

- `src/composables/useAuth.js` — authentication, user profile, session tracking
- `src/composables/useReleases.js` — collection CRUD, artwork uploads, bulk add
- `src/composables/useSources.js` — acquisition source/vendor management

These composables are initialized in `src/main.js` and injected via `provide`/`inject` through the app.

### Routing & Layouts

`src/router/index.js` uses named layouts via route meta (`meta.layout`):
- `AuthLayout` — login/signup pages
- `MainLayout` — authenticated pages (navbar, collection views)
- `PublicLayout` — public collection sharing view (`/collection/:slug`)

Router guards check Supabase auth state before allowing access to protected routes.

### Key Data Flows

**Collection items** are stored as a join: `collections → releases → artworks`. The composable flattens this into a single object per item.

**Release deduplication** uses `discogs_master_id`. Before inserting a new release, the app checks if one already exists with that ID.

**Artwork uploads** include quota checking (against `profiles.upload_quota_mb`), hash-based deduplication, and storage in Supabase Storage with the CDN URL tracked in the `artworks` table.

**Random picker** and **bulk add** call Supabase Edge Functions (`randomize-collection` and a bulk-add endpoint).

**Public sharing** uses a user-set `slug` on the `profiles` table with an `is_public` flag.

### External Services

- **Discogs API** (`src/lib/discogs.js`) — search release metadata by artist/title; returns master releases only
- **Supabase** (`src/lib/supabase.js`) — auth, PostgreSQL (collections/releases/artworks/profiles/sources), Storage (artwork images), Edge Functions
