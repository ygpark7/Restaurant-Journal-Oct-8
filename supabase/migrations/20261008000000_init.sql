-- Table for Little Ones: initial schema.
--
-- Run this in the Supabase dashboard (SQL editor), then run supabase/seed.sql for sample data.
-- Prerequisite: Authentication -> Sign In / Providers -> Email is enabled (see the README for "Confirm email").
--
-- Mapping from the app's domain types (src/domain/types.ts):
--   Restaurant            -> restaurants
--   RestaurantAttributes  -> restaurant_attributes (+ the restaurant_attributes_effective view)
--   Visit                 -> visits + visit_attribute_confirmations
--   SavedPlace            -> saved_places
--   User                  -> profiles

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per person. Deliberately NOT a foreign key to auth.users, so the fake "parents" who
-- wrote the seed notes can exist without auth accounts. Real users get a row via a trigger.
create table public.profiles (
  id uuid primary key,
  display_name text not null,
  avatar_emoji text,
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.restaurants (
  -- text so seed restaurants keep readable ids (e.g. 'r-olive-ember'); new ones get a uuid.
  id text primary key default gen_random_uuid()::text,
  name text not null,
  cuisine text not null,
  neighborhood text not null,
  address text not null,
  price_tier smallint not null check (price_tier between 1 and 4),
  photo_url text,
  description text,
  -- [{ "day": 0-6 (0 = Sunday), "open": "HH:mm", "close": "HH:mm" }], New York local time
  hours jsonb not null default '[]'::jsonb,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

-- Attributes are rows keyed by `key`, so adding a kid-friendly attribute needs no migration.
-- value is JSON: true/false for yes/no attributes, a string for enum ones (e.g. "quiet").
create table public.restaurant_attributes (
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  key text not null,
  value jsonb not null,
  last_confirmed_at timestamptz,
  primary key (restaurant_id, key)
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id),
  visited_at timestamptz not null default now(),
  food_rating smallint not null check (food_rating between 1 and 5),
  -- 1 = totally relaxed ... 5 = chaos
  stress_level smallint not null check (stress_level between 1 and 5),
  note text check (char_length(note) <= 500),
  -- A small data URL for now; move to Supabase Storage and store the URL here later.
  photo_url text,
  created_at timestamptz not null default now()
);
create index visits_restaurant_idx on public.visits (restaurant_id, visited_at desc);
create index visits_user_idx on public.visits (user_id, visited_at desc);

-- What a parent confirmed during a visit. The newest confirmation wins (see the view below).
create table public.visit_attribute_confirmations (
  visit_id uuid not null references public.visits (id) on delete cascade,
  key text not null,
  value jsonb not null,
  primary key (visit_id, key)
);

create table public.saved_places (
  user_id uuid not null default auth.uid() references public.profiles (id),
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  status text not null check (status in ('want_to_try', 'been_there')),
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

-- ---------------------------------------------------------------------------
-- Effective attributes: stored value overlaid with the latest visit confirmation.
-- (The mock does the same in src/data/mock/effectiveRestaurant.ts. On a tie, the visit wins.)
-- ---------------------------------------------------------------------------

create view public.restaurant_attributes_effective
with (security_invoker = true) as
select distinct on (restaurant_id, key)
  restaurant_id,
  key,
  value,
  last_confirmed_at
from (
  select restaurant_id, key, value, last_confirmed_at, 0 as priority
  from public.restaurant_attributes
  union all
  select v.restaurant_id, c.key, c.value, v.visited_at, 1 as priority
  from public.visit_attribute_confirmations c
  join public.visits v on v.id = c.visit_id
) merged
order by restaurant_id, key, last_confirmed_at desc nulls last, priority desc;

-- ---------------------------------------------------------------------------
-- Logging a visit is one atomic call: the visit plus its attribute confirmations.
-- Runs as the caller (security invoker), so row-level security still applies.
-- ---------------------------------------------------------------------------

create function public.log_visit(
  p_restaurant_id text,
  p_visited_at timestamptz,
  p_food_rating smallint,
  p_stress_level smallint,
  p_note text default null,
  p_photo_url text default null,
  p_confirmed jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.visits (restaurant_id, visited_at, food_rating, stress_level, note, photo_url)
  values (p_restaurant_id, p_visited_at, p_food_rating, p_stress_level, p_note, p_photo_url)
  returning id into v_id;

  insert into public.visit_attribute_confirmations (visit_id, key, value)
  select v_id, e.key, e.value
  from jsonb_each(coalesce(p_confirmed, '{}'::jsonb)) as e;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Every new auth user (including anonymous ones) gets a profile.
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, 'A parent')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Cover anyone who signed in before this migration ran.
insert into public.profiles (id, display_name)
select id, 'A parent' from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row-level security
--   * Restaurants, attributes, profiles, and visits (the parents' notes) are readable by everyone.
--   * You can only write visits and saved places as yourself.
--   * Saved places are private to their owner.
--   * Nothing here can be updated or deleted by clients, except your own saved places.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_attributes enable row level security;
alter table public.visits enable row level security;
alter table public.visit_attribute_confirmations enable row level security;
alter table public.saved_places enable row level security;

create policy "profiles are public" on public.profiles
  for select to anon, authenticated using (true);

create policy "restaurants are public" on public.restaurants
  for select to anon, authenticated using (true);

create policy "restaurant attributes are public" on public.restaurant_attributes
  for select to anon, authenticated using (true);

create policy "visits are public" on public.visits
  for select to anon, authenticated using (true);

create policy "log visits as yourself" on public.visits
  for insert to authenticated with check (user_id = auth.uid());

create policy "confirmations are public" on public.visit_attribute_confirmations
  for select to anon, authenticated using (true);

create policy "confirm attributes on your own visits" on public.visit_attribute_confirmations
  for insert to authenticated
  with check (
    exists (
      select 1 from public.visits v
      where v.id = visit_id and v.user_id = auth.uid()
    )
  );

create policy "manage your own saved places" on public.saved_places
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Explicit grants (so this works even if the project doesn't auto-expose new tables)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.profiles, public.restaurants, public.restaurant_attributes,
  public.visits, public.visit_attribute_confirmations,
  public.restaurant_attributes_effective
  to anon, authenticated;

grant insert on public.visits, public.visit_attribute_confirmations to authenticated;
grant select, insert, update, delete on public.saved_places to authenticated;

-- Functions are executable by everyone by default; lock them down.
revoke execute on function public.log_visit(text, timestamptz, smallint, smallint, text, text, jsonb)
  from public, anon;
grant execute on function public.log_visit(text, timestamptz, smallint, smallint, text, text, jsonb)
  to authenticated;

-- Only the auth trigger should run this (it is security definer), never an API caller.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
