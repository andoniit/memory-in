# MemoryPin

An NFC memory-map PWA — pin photos/videos to real-world locations and tap a
physical NFC sticker to relive them. Use it solo, or invite a partner or friends
to share a circle (up to 4 people). Built with Next.js 14 (App Router), Supabase,
Cloudinary, Three.js, and Tailwind.

> **Sharing model:** every account gets a personal "circle" at signup, so the app
> works solo with zero setup. The owner can invite a partner or friends via a
> share link — up to 4 members per circle, all sharing the same pins.

## Setup

1. **Install** (already done if scaffolded): `npm install`

2. **Environment** — copy `.env.example` to `.env.local` and fill in:
   - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`
   - Cloudinary: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
     `CLOUDINARY_API_SECRET`
   - `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)

3. **Database** — run `supabase/migrations/001_initial.sql` in the Supabase SQL
   editor (or `supabase db push`). This creates the schema, RLS policies, and the
   `increment_pin_view` / `user_in_couple` functions.

4. **Auth providers** — in the Supabase dashboard enable Email (magic link) and,
   optionally, Google OAuth. Add `http://localhost:3000/auth/callback` (and your
   prod URL) to the allowed redirect URLs.

5. **Cloudinary** — uploads are signed server-side via `/api/upload-url`; no
   unsigned preset is required. Mobile uploads use `resource_type: auto` so one
   path handles both photos and videos.

6. **Run**: `npm run dev`

## The core loop

1. Sign in (`/login`) → you're ready (a personal circle exists already).
2. Create a pin (`/pin/new`) → copy the `…/p/<id>` URL onto an NTAG213 sticker
   with the **NFC Tools** app.
3. Add photos/videos (`/p/<id>/upload`).
4. Tap the sticker → the public `/p/<id>` page opens fast, no login needed.
5. Optional: invite a partner or friends from `/settings` (up to 4 per circle).

## Notes

- Uses `@supabase/ssr` (the spec's `@supabase/auth-helpers-nextjs` is deprecated).
- `types/index.ts` hand-writes the `Database` type. Row types **must** stay as
  `type` aliases, not `interface` — interfaces don't satisfy supabase-js's
  `Record<string, unknown>` constraint and silently degrade queries to `never`.
- `lat`/`lng` are optional in Phase 1 (geocoding arrives with the globe in
  Phase 2).
