-- ═══════════════════════════════════════════════════════════
-- MemoryPin — initial schema
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- COUPLES
-- Two users share a couple_id — gates access to shared pins.
-- ─────────────────────────────────────────
create table public.couples (
  id          uuid default gen_random_uuid() primary key,
  user1_id    uuid references auth.users(id) on delete cascade not null,
  user2_id    uuid references auth.users(id) on delete cascade,
  invite_code text unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at  timestamptz default now(),
  constraint unique_couple unique (user1_id, user2_id)
);

-- ─────────────────────────────────────────
-- PINS  (one NFC sticker = one location)
-- ─────────────────────────────────────────
create table public.pins (
  id          text primary key,               -- nanoid(8) e.g. 'Xk2mP8nQ'
  couple_id   uuid references public.couples(id) on delete cascade,
  created_by  uuid references auth.users(id) on delete set null,
  title       text not null,
  city        text,
  lat         double precision,
  lng         double precision,
  emoji       text default '📍',
  visit_date  date,
  story       text,                            -- AI-generated travel story
  is_public   boolean default true,
  view_count  integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- MEMORIES (photos, videos, notes)
-- ─────────────────────────────────────────
create type memory_type as enum ('photo', 'video', 'note');

create table public.memories (
  id            uuid default gen_random_uuid() primary key,
  pin_id        text references public.pins(id) on delete cascade not null,
  uploaded_by   uuid references auth.users(id) on delete set null,
  type          memory_type not null,
  cloudinary_id text,            -- Cloudinary public_id (photo/video)
  url           text,            -- full-res URL
  thumb_url     text,            -- 400x400 thumbnail
  caption       text,            -- for notes, or photo captions
  taken_at      timestamptz,     -- from EXIF if available
  width         integer,
  height        integer,
  duration_secs integer,         -- video only
  sort_order    integer default 0,
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────
-- PIN VIEWS (lightweight analytics)
-- ─────────────────────────────────────────
create table public.pin_views (
  id        bigint generated always as identity primary key,
  pin_id    text references public.pins(id) on delete cascade,
  viewed_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.couples   enable row level security;
alter table public.pins      enable row level security;
alter table public.memories  enable row level security;
alter table public.pin_views enable row level security;

-- Is the current user a member of the couple that owns a pin?
-- security definer so it can read couples without RLS recursion.
create or replace function public.user_in_couple(pin_couple_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.couples
    where id = pin_couple_id
      and (user1_id = auth.uid() or user2_id = auth.uid())
  );
$$ language sql security definer;

-- Profiles: own record only.
create policy "profiles_own" on public.profiles
  for all using (id = auth.uid());

-- Couples: members can read/update their own couple.
create policy "couples_members" on public.couples
  for all using (user1_id = auth.uid() or user2_id = auth.uid());

-- Couples: a logged-in user may insert a couple they belong to.
create policy "couples_insert" on public.couples
  for insert with check (user1_id = auth.uid() or user2_id = auth.uid());

-- Pins: public pins readable by all; private by couple; writes by couple.
create policy "pins_public_read" on public.pins
  for select using (is_public = true);

create policy "pins_couple_read" on public.pins
  for select using (public.user_in_couple(couple_id));

create policy "pins_couple_write" on public.pins
  for all using (public.user_in_couple(couple_id))
  with check (public.user_in_couple(couple_id));

-- Memories: inherit visibility from the parent pin.
create policy "memories_public_read" on public.memories
  for select using (
    exists (select 1 from public.pins where id = pin_id and is_public = true)
  );

create policy "memories_couple_all" on public.memories
  for all using (
    exists (
      select 1 from public.pins p
      where p.id = pin_id and public.user_in_couple(p.couple_id)
    )
  )
  with check (
    exists (
      select 1 from public.pins p
      where p.id = pin_id and public.user_in_couple(p.couple_id)
    )
  );

-- Pin views: anyone can insert, no reads.
create policy "pin_views_insert" on public.pin_views
  for insert with check (true);

-- Atomic view-count bump for public pins (callable by anonymous visitors).
create or replace function public.increment_pin_view(p_id text)
returns void as $$
  update public.pins set view_count = view_count + 1
  where id = p_id and is_public = true;
$$ language sql security definer;

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index pins_couple_id_idx on public.pins(couple_id);
create index pins_lat_lng_idx   on public.pins(lat, lng);
create index memories_pin_id_idx on public.memories(pin_id);
create index memories_sort_idx   on public.memories(pin_id, sort_order);
