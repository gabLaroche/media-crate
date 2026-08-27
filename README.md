# MediaCrate

A personal physical music collection manager. Track every CD, vinyl, and cassette you own: where you got it, what condition it's in, and let the app pick something to listen to tonight.

## Features

- **Collection management**: add, edit, and delete releases with full metadata (artist, album, year, format, condition, acquired date, source, notes)
- **Discogs integration**: search Discogs by artist or album to auto-fill metadata and cover art; look up by master/release ID or URL
- **Bulk add**: search once and select multiple releases to queue them all at once
- **Random picker**: pick a random release from your collection; individual entries can be excluded from the pool
- **Collection stats**: breakdowns by format, condition, acquisition source, and year
- **Public sharing**: optionally make your collection public and share it via a personal URL slug
- **Artwork uploads**: upload custom artwork with server-side deduplication and per-user storage quotas
- **PWA**: installable as a Progressive Web App with offline support

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 (Composition API), Vue Router, SCSS |
| Build | Vite, Workbox (PWA) |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| External API | Discogs (proxied through a Supabase Edge Function) |

State is managed entirely through composables (`useAuth`, `useReleases`, `useSources`) with no Pinia or Vuex.

## Getting started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- A Supabase project with the schema, RLS policies, storage buckets, and Edge Functions deployed
- A Discogs API token configured in the Edge Function environment

### Environment variables

Create a `.env.local` file at the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### Install and run

```sh
yarn          # install dependencies
yarn dev      # start dev server
yarn build    # production build
yarn preview  # preview production build locally
```

## Project structure

```
src/
  composables/     # shared state (useAuth, useReleases, useSources)
  components/      # reusable UI components
  pages/           # route-level views
  layouts/         # MainLayout, AuthLayout, PublicLayout
  lib/             # supabase client, discogs helpers
  router/          # Vue Router config with auth guards
supabase/
  functions/       # Edge Functions (discogs-search, bulk-add-releases,
                   #   randomize-collection, upload-artwork, ...)
```
