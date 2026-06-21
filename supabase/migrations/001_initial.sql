-- ═══════════════════════════════════════════════════════════
-- MemoryPin — initial schema
--
-- Sharing model: every user gets a personal "circle" at signup, so the app
-- works solo with zero setup. The owner can invite a partner or friends —
-- up to 4 members per circle. All members share the circle's pins.
--
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

-- ─────────────────────────────────────────
-- CIRCLES  (a shared space; solo by default, up to 4 members)
-- ─────────────────────────────────────────
create table public.circles (
  id          uuid default gen_random_uuid() primary key,
  owner_id    uuid references auth.users(id) on delete cascade not null,
  name        text,
  invite_code text unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at  timestamptz default now()
);

create table public.circle_members (
  circle_id uuid references public.circles(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now(),
  primary key (circle_id, user_id),
  unique (user_id)            -- each user belongs to exactly one circle
);

-- Auto-create a profile + a personal circle on signup.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_circle uuid;
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'name');

  insert into public.circles (owner_id) values (new.id)
  returning id into new_circle;

  insert into public.circle_members (circle_id, user_id)
  values (new_circle, new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- PINS  (one NFC sticker = one location)
-- ─────────────────────────────────────────
create table public.pins (
  id          text primary key,               -- nanoid(8) e.g. 'Xk2mP8nQ'
  circle_id   uuid references public.circles(id) on delete cascade,
  created_by  uuid references auth.users(id) on delete set null,
  title       text not null,
  city        text,
  lat         double precision,
  lng         double precision,
  emoji       text default '📍',
  visit_date  date,
  story       text,
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
  cloudinary_id text,
  url           text,
  thumb_url     text,
  caption       text,
  taken_at      timestamptz,
  width         integer,
  height        integer,
  duration_secs integer,
  sort_order    integer default 0,
  created_at    timestamptz default now()
);

-- Chosen cover memory for a pin (added after memories exists).
alter table public.pins
  add column if not exists cover_memory_id uuid
  references public.memories(id) on delete set null;

-- ─────────────────────────────────────────
-- PIN VIEWS (lightweight analytics)
-- ─────────────────────────────────────────
create table public.pin_views (
  id        bigint generated always as identity primary key,
  pin_id    text references public.pins(id) on delete cascade,
  viewed_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- HELPER FUNCTIONS (security definer → bypass RLS, avoid recursion)
-- ─────────────────────────────────────────
create or replace function public.user_in_circle(c_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = c_id and user_id = auth.uid()
  );
$$ language sql security definer;

create or replace function public.shares_circle(other_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.circle_members m1
    join public.circle_members m2 on m1.circle_id = m2.circle_id
    where m1.user_id = auth.uid() and m2.user_id = other_id
  );
$$ language sql security definer;

-- Join a circle by invite code. Moves the caller out of their (empty) personal
-- circle into the target. Caps membership at 4. Returns the target circle id.
create or replace function public.join_circle(p_code text)
returns uuid as $$
declare
  target         uuid;
  current_circle uuid;
  member_count   int;
  pin_count      int;
begin
  select id into target from public.circles
    where invite_code = upper(p_code);
  if target is null then
    raise exception 'invalid_code';
  end if;

  -- Already a member of the target → no-op.
  if exists (
    select 1 from public.circle_members
    where circle_id = target and user_id = auth.uid()
  ) then
    return target;
  end if;

  -- Capacity (max 4 members).
  select count(*) into member_count
    from public.circle_members where circle_id = target;
  if member_count >= 4 then
    raise exception 'circle_full';
  end if;

  -- The caller's current circle.
  select circle_id into current_circle
    from public.circle_members where user_id = auth.uid();

  -- Don't strand existing memories: block if the caller already has pins.
  if current_circle is not null then
    select count(*) into pin_count
      from public.pins where circle_id = current_circle;
    if pin_count > 0 then
      raise exception 'has_memories';
    end if;
  end if;

  -- Leave the current circle, then delete it if it's now an empty circle the
  -- caller owned.
  delete from public.circle_members where user_id = auth.uid();
  if current_circle is not null then
    delete from public.circles c
      where c.id = current_circle
        and c.owner_id = auth.uid()
        and not exists (
          select 1 from public.circle_members m where m.circle_id = c.id
        );
  end if;

  insert into public.circle_members (circle_id, user_id)
  values (target, auth.uid());

  return target;
end;
$$ language plpgsql security definer;

-- Atomic view-count bump for public pins (callable by anonymous visitors).
create or replace function public.increment_pin_view(p_id text)
returns void as $$
  update public.pins set view_count = view_count + 1
  where id = p_id and is_public = true;
$$ language sql security definer;

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.circles        enable row level security;
alter table public.circle_members enable row level security;
alter table public.pins           enable row level security;
alter table public.memories       enable row level security;
alter table public.pin_views      enable row level security;

-- Profiles: read own + co-members; write own.
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.shares_circle(id));
create policy "profiles_write" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Circles: members read; owner updates.
create policy "circles_member_read" on public.circles
  for select using (public.user_in_circle(id));
create policy "circles_owner_write" on public.circles
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Circle members: members can see who's in their circle.
-- (Inserts/deletes happen via security-definer functions, so no write policy.)
create policy "circle_members_read" on public.circle_members
  for select using (public.user_in_circle(circle_id));

-- Pins: public pins readable by all; private by circle; writes by circle.
create policy "pins_public_read" on public.pins
  for select using (is_public = true);
create policy "pins_circle_read" on public.pins
  for select using (public.user_in_circle(circle_id));
create policy "pins_circle_write" on public.pins
  for all using (public.user_in_circle(circle_id))
  with check (public.user_in_circle(circle_id));

-- Memories: inherit visibility from the parent pin.
create policy "memories_public_read" on public.memories
  for select using (
    exists (select 1 from public.pins where id = pin_id and is_public = true)
  );
create policy "memories_circle_all" on public.memories
  for all using (
    exists (
      select 1 from public.pins p
      where p.id = pin_id and public.user_in_circle(p.circle_id)
    )
  )
  with check (
    exists (
      select 1 from public.pins p
      where p.id = pin_id and public.user_in_circle(p.circle_id)
    )
  );

-- Pin views: anyone can insert, no reads.
create policy "pin_views_insert" on public.pin_views
  for insert with check (true);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index circle_members_user_idx on public.circle_members(user_id);
create index pins_circle_id_idx on public.pins(circle_id);
create index pins_lat_lng_idx   on public.pins(lat, lng);
create index memories_pin_id_idx on public.memories(pin_id);
create index memories_sort_idx   on public.memories(pin_id, sort_order);
