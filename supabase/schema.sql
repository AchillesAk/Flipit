create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_unique on public.profiles (username);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text,
  condition text not null check (condition in ('novo', 'seminovo', 'usado')),
  price_cents integer not null default 0 check (price_cents >= 0),
  accept_any boolean not null default true,
  accept_min_cents integer check (accept_min_cents is null or accept_min_cents >= 0),
  accept_max_cents integer check (accept_max_cents is null or accept_max_cents >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint products_accept_range_valid check (
    accept_any
    or (
      accept_min_cents is not null
      and accept_max_cents is not null
      and accept_min_cents <= accept_max_cents
    )
  )
);

create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists products_active_idx on public.products (is_active);
create index if not exists products_price_idx on public.products (price_cents);

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_product_id uuid not null references public.products (id) on delete cascade,
  swiped_product_id uuid not null references public.products (id) on delete cascade,
  direction text not null check (direction in ('like', 'pass')),
  created_at timestamptz not null default now()
);

create unique index if not exists swipes_pair_unique
  on public.swipes (swiper_product_id, swiped_product_id);

create index if not exists swipes_swiper_idx on public.swipes (swiper_product_id);
create index if not exists swipes_swiped_idx on public.swipes (swiped_product_id);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  product_a_id uuid not null references public.products (id) on delete cascade,
  product_b_id uuid not null references public.products (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  constraint matches_distinct_products check (product_a_id <> product_b_id)
);

create unique index if not exists matches_canonical_pair_unique
  on public.matches (least(product_a_id, product_b_id), greatest(product_a_id, product_b_id));

create index if not exists matches_product_a_idx on public.matches (product_a_id);
create index if not exists matches_product_b_idx on public.matches (product_b_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_match_created_idx on public.messages (match_id, created_at);
create index if not exists messages_read_at_idx on public.messages (read_at);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, coalesce(nullif(split_part(new.email, '@', 1), ''), 'user'), null);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.prevent_invalid_swipe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a_owner uuid;
  b_owner uuid;
begin
  if new.swiper_product_id = new.swiped_product_id then
    raise exception 'cannot swipe own product id';
  end if;

  select user_id into a_owner from public.products where id = new.swiper_product_id;
  select user_id into b_owner from public.products where id = new.swiped_product_id;

  if a_owner is null or b_owner is null then
    raise exception 'product not found';
  end if;

  if a_owner = b_owner then
    raise exception 'cannot swipe products from same owner';
  end if;

  return new;
end;
$$;

drop trigger if exists swipes_prevent_invalid on public.swipes;
create trigger swipes_prevent_invalid
before insert on public.swipes
for each row execute procedure public.prevent_invalid_swipe();

create or replace function public.messages_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.match_id <> old.match_id then
    raise exception 'messages are immutable';
  end if;
  if new.sender_id <> old.sender_id then
    raise exception 'messages are immutable';
  end if;
  if new.content <> old.content then
    raise exception 'messages are immutable';
  end if;
  if new.created_at <> old.created_at then
    raise exception 'messages are immutable';
  end if;

  if old.read_at is not null and new.read_at is distinct from old.read_at then
    raise exception 'read_at cannot be changed once set';
  end if;

  if old.read_at is null and new.read_at is null then
    raise exception 'only read_at can be updated';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_immutable_trigger on public.messages;
create trigger messages_immutable_trigger
before update on public.messages
for each row execute procedure public.messages_immutable();

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "products_select_active_or_own" on public.products;
create policy "products_select_active_or_own"
on public.products
for select
to authenticated
using (is_active = true or user_id = auth.uid());

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
on public.products
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
on public.products
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
on public.products
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "swipes_select_own_swiper_product" on public.swipes;
drop policy if exists "swipes_select_involved_products" on public.swipes;
create policy "swipes_select_involved_products"
on public.swipes
for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = swipes.swiper_product_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.products p
    where p.id = swipes.swiped_product_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "swipes_insert_own_swiper_product" on public.swipes;
create policy "swipes_insert_own_swiper_product"
on public.swipes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.products p
    where p.id = swipes.swiper_product_id
      and p.user_id = auth.uid()
      and p.is_active = true
  )
);

drop policy if exists "matches_select_involved_products" on public.matches;
create policy "matches_select_involved_products"
on public.matches
for select
to authenticated
using (
  exists (select 1 from public.products p where p.id = matches.product_a_id and p.user_id = auth.uid())
  or
  exists (select 1 from public.products p where p.id = matches.product_b_id and p.user_id = auth.uid())
);

drop policy if exists "matches_insert_if_owner_of_either" on public.matches;
create policy "matches_insert_if_owner_of_either"
on public.matches
for insert
to authenticated
with check (
  exists (select 1 from public.products p where p.id = matches.product_a_id and p.user_id = auth.uid())
  or
  exists (select 1 from public.products p where p.id = matches.product_b_id and p.user_id = auth.uid())
);

drop policy if exists "matches_update_if_owner_of_either" on public.matches;
create policy "matches_update_if_owner_of_either"
on public.matches
for update
to authenticated
using (
  exists (select 1 from public.products p where p.id = matches.product_a_id and p.user_id = auth.uid())
  or
  exists (select 1 from public.products p where p.id = matches.product_b_id and p.user_id = auth.uid())
)
with check (
  exists (select 1 from public.products p where p.id = matches.product_a_id and p.user_id = auth.uid())
  or
  exists (select 1 from public.products p where p.id = matches.product_b_id and p.user_id = auth.uid())
);

drop policy if exists "messages_select_match_participants" on public.messages;
create policy "messages_select_match_participants"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.matches m
    join public.products pa on pa.id = m.product_a_id
    join public.products pb on pb.id = m.product_b_id
    where m.id = messages.match_id
      and (pa.user_id = auth.uid() or pb.user_id = auth.uid())
  )
);

drop policy if exists "messages_insert_sender_is_user_and_in_match" on public.messages;
create policy "messages_insert_sender_is_user_and_in_match"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    join public.products pa on pa.id = m.product_a_id
    join public.products pb on pb.id = m.product_b_id
    where m.id = messages.match_id
      and (pa.user_id = auth.uid() or pb.user_id = auth.uid())
  )
);

drop policy if exists "messages_update_read_at_only_for_recipient" on public.messages;
create policy "messages_update_read_at_only_for_recipient"
on public.messages
for update
to authenticated
using (
  read_at is null
  and sender_id <> auth.uid()
  and exists (
    select 1
    from public.matches m
    join public.products pa on pa.id = m.product_a_id
    join public.products pb on pb.id = m.product_b_id
    where m.id = messages.match_id
      and (pa.user_id = auth.uid() or pb.user_id = auth.uid())
  )
)
with check (
  sender_id <> auth.uid()
  and exists (
    select 1
    from public.matches m
    join public.products pa on pa.id = m.product_a_id
    join public.products pb on pb.id = m.product_b_id
    where m.id = messages.match_id
      and (pa.user_id = auth.uid() or pb.user_id = auth.uid())
  )
);

alter publication supabase_realtime add table public.messages;

drop policy if exists "products_images_select" on storage.objects;
create policy "products_images_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'products');

drop policy if exists "products_images_insert" on storage.objects;
create policy "products_images_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "products_images_delete" on storage.objects;
create policy "products_images_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);
