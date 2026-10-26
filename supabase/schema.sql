-- ============================================================================
-- Africane Bloom — webshop database (Supabase / PostgreSQL)
--
-- Run this whole file ONCE in Supabase: Project → SQL Editor → New query → Run.
-- It is safe to run again (it uses "if not exists" / "create or replace").
--
-- Security model
--   * Every table has Row Level Security (RLS) switched on.
--   * Customers can only read the price tables once their account is approved.
--   * Prices are calculated on the SERVER in place_order(); the browser cannot
--     choose a price.
--   * Nothing in this file contains secrets. Prices are NOT in this file — they
--     are imported through the admin page (the GitHub repo is public).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  company      text not null,
  contact_name text not null,
  phone        text,
  country      text,
  vat_no       text,
  lang         text not null default 'en',
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.price_rows (
  id            bigint generated always as identity primary key,
  price_group   text not null check (price_group in ('red','white','pink','yellow','orange','peach','spray','special_spray')),
  head_size     text not null default 'standard' check (head_size in ('standard','large','xlarge')),
  length_cm     int  not null check (length_cm between 10 and 150),
  tier_qty      int  not null check (tier_qty > 0),
  price_ex_vat  numeric(10,2) not null check (price_ex_vat >= 0),
  price_inc_vat numeric(10,2) not null check (price_inc_vat >= 0),
  unique (price_group, head_size, length_cm, tier_qty)
);

create table if not exists public.variety_groups (
  variety     text primary key,
  price_group text not null check (price_group in ('red','white','pink','yellow','orange','peach','spray','special_spray')),
  updated_at  timestamptz not null default now()
);

create table if not exists public.shop_settings (
  key   text primary key,
  value text not null
);

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_no      bigint generated always as identity,
  user_id       uuid not null references auth.users(id),
  status        text not null default 'new' check (status in ('new','confirmed','cancelled')),
  note          text,
  delivery_note text,
  total_ex_vat  numeric(12,2) not null default 0,
  total_inc_vat numeric(12,2) not null default 0,
  unpriced_lines int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.order_items (
  id            bigint generated always as identity primary key,
  order_id      uuid not null references public.orders(id) on delete cascade,
  variety       text not null,
  category      text,
  price_group   text,
  head_size     text not null default 'standard',
  length_cm     int  not null,
  qty           int  not null check (qty > 0),
  unit_ex_vat   numeric(10,2),
  unit_inc_vat  numeric(10,2),
  line_ex_vat   numeric(12,2),
  line_inc_vat  numeric(12,2)
);

-- Price groups: the eight shared groups, or an own price list for one variety named 'v:<variety>'.
alter table public.price_rows drop constraint if exists price_rows_price_group_check;
alter table public.price_rows add constraint price_rows_price_group_check
  check (price_group in ('red','white','pink','yellow','orange','peach','spray','special_spray') or price_group like 'v:%');
alter table public.variety_groups drop constraint if exists variety_groups_price_group_check;
alter table public.variety_groups add constraint variety_groups_price_group_check
  check (price_group in ('red','white','pink','yellow','orange','peach','spray','special_spray') or price_group like 'v:%');

create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

insert into public.shop_settings(key, value) values
  ('min_total_stems', '1000'),
  ('vat_percent',     '25')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Helper functions
-- ---------------------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'approved' from public.profiles where id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------------
-- 3. A profile row is created automatically when someone registers
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, company, contact_name, phone, country, vat_no, lang)
  values (
    new.id,
    new.email,
    coalesce(nullif(left(trim(new.raw_user_meta_data->>'company'), 200), ''), '-'),
    coalesce(nullif(left(trim(new.raw_user_meta_data->>'contact_name'), 200), ''), '-'),
    nullif(left(trim(new.raw_user_meta_data->>'phone'), 60), ''),
    nullif(left(trim(new.raw_user_meta_data->>'country'), 80), ''),
    nullif(left(trim(new.raw_user_meta_data->>'vat_no'), 60), ''),
    case when new.raw_user_meta_data->>'lang' in ('en','es','ru','sv','hu') then new.raw_user_meta_data->>'lang' else 'en' end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A customer may edit their own contact details, but never their status or
-- admin flag. (Calls from the SQL editor have no auth.uid() and are allowed.)
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id         := old.id;
    new.email      := old.email;
    new.status     := old.status;
    new.is_admin   := old.is_admin;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard_trg on public.profiles;
create trigger profiles_guard_trg
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.price_rows     enable row level security;
alter table public.variety_groups enable row level security;
alter table public.shop_settings  enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- price_rows, variety_groups, shop_settings: read for approved customers, write for admins
drop policy if exists price_rows_read on public.price_rows;
create policy price_rows_read on public.price_rows for select to authenticated
  using (public.is_approved() or public.is_admin());
drop policy if exists price_rows_admin on public.price_rows;
create policy price_rows_admin on public.price_rows for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists variety_groups_read on public.variety_groups;
create policy variety_groups_read on public.variety_groups for select to authenticated
  using (public.is_approved() or public.is_admin());
drop policy if exists variety_groups_admin on public.variety_groups;
create policy variety_groups_admin on public.variety_groups for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists shop_settings_read on public.shop_settings;
create policy shop_settings_read on public.shop_settings for select to authenticated
  using (public.is_approved() or public.is_admin());
drop policy if exists shop_settings_admin on public.shop_settings;
create policy shop_settings_admin on public.shop_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- orders: customers read their own; only admins change status. Orders are
-- created ONLY through place_order() below (no insert policy on purpose).
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_admin())
  ));

-- ---------------------------------------------------------------------------
-- 5. place_order(): validates, prices on the server, and stores the order
--    Volume price: the tier is decided by the TOTAL stems in the whole order
--    (all varieties, lengths and head sizes together). Below the lowest tier a
--    line has no price ("price on request").
-- ---------------------------------------------------------------------------

create or replace function public.place_order(
  p_items    jsonb,
  p_note     text default null,
  p_delivery text default null
) returns table (order_id uuid, order_no bigint, total_ex_vat numeric, total_inc_vat numeric, unpriced_lines int)
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_min   int;
  v_total int;
  v_bad   int;
  v_oid   uuid;
  v_ono   bigint;
  v_ex    numeric;
  v_inc   numeric;
  v_vat   numeric;
  v_un    int;
begin
  if v_uid is null or not public.is_approved() then
    raise exception 'not_approved';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 300 then
    raise exception 'invalid_items';
  end if;

  select count(*) into v_bad
  from jsonb_array_elements(p_items) e
  where coalesce(length(e->>'variety'), 0) = 0
     or coalesce((e->>'qty')::int, 0) < 1
     or coalesce((e->>'qty')::int, 0) > 1000000
     or coalesce((e->>'length_cm')::int, 0) not between 10 and 150
     or coalesce(nullif(e->>'head_size',''), 'standard') not in ('standard','large','xlarge');
  if v_bad > 0 then raise exception 'invalid_items'; end if;

  select coalesce(sum((e->>'qty')::int), 0) into v_total from jsonb_array_elements(p_items) e;
  select coalesce(nullif(value, '')::int, 0) into v_min from public.shop_settings where key = 'min_total_stems';
  if v_total < coalesce(v_min, 0) then
    raise exception 'below_minimum:%', v_min;
  end if;
  select nullif(value, '')::numeric into v_vat from public.shop_settings where key = 'vat_percent';
  v_vat := coalesce(v_vat, 25);

  insert into public.orders (user_id, note, delivery_note)
  values (v_uid, left(p_note, 2000), left(p_delivery, 500))
  returning id, orders.order_no into v_oid, v_ono;

  insert into public.order_items
    (order_id, variety, category, price_group, head_size, length_cm, qty, unit_ex_vat, unit_inc_vat, line_ex_vat, line_inc_vat)
  select v_oid, i.variety, i.category, vg.price_group, i.head_size, i.length_cm, i.qty,
         p.price_ex_vat, case when p.price_ex_vat is null then null else round(p.price_ex_vat * (1 + v_vat / 100), 2) end,
         case when p.price_ex_vat  is null then null else round(p.price_ex_vat  * i.qty, 2) end,
         case when p.price_ex_vat  is null then null else round(round(p.price_ex_vat * i.qty, 2) * (1 + v_vat / 100), 2) end
  from (
    select left(e->>'variety', 120)                       as variety,
           left(coalesce(e->>'category', ''), 30)         as category,
           coalesce(nullif(e->>'head_size', ''), 'standard') as head_size,
           (e->>'length_cm')::int                         as length_cm,
           (e->>'qty')::int                               as qty
    from jsonb_array_elements(p_items) e
  ) i
  left join public.variety_groups vg on vg.variety = i.variety
  left join lateral (
    select pr.price_ex_vat, pr.price_inc_vat
    from public.price_rows pr
    where pr.price_group = vg.price_group
      and pr.head_size   = i.head_size
      and pr.length_cm   = i.length_cm
      and pr.tier_qty   <= v_total
    order by pr.tier_qty desc
    limit 1
  ) p on true;

  select coalesce(sum(line_ex_vat), 0), count(*) filter (where line_ex_vat is null)
    into v_ex, v_un
  from public.order_items where order_items.order_id = v_oid;
  -- VAT is calculated on the net total (as on an invoice), not summed per stem.
  v_inc := round(v_ex * (1 + v_vat / 100), 2);

  update public.orders
     set total_ex_vat = v_ex, total_inc_vat = v_inc, unpriced_lines = v_un
   where orders.id = v_oid;

  return query select v_oid, v_ono, v_ex, v_inc, v_un;
end $$;

revoke all on function public.place_order(jsonb, text, text) from public;
grant execute on function public.place_order(jsonb, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Admin helpers (replace the whole price table / variety mapping in one go)
-- ---------------------------------------------------------------------------

create or replace function public.admin_replace_prices(p_rows jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then raise exception 'invalid_rows'; end if;
  delete from public.price_rows where true;
  insert into public.price_rows (price_group, head_size, length_cm, tier_qty, price_ex_vat, price_inc_vat)
  select x.price_group, coalesce(nullif(x.head_size, ''), 'standard'), x.length_cm, x.tier_qty, x.price_ex_vat, x.price_inc_vat
  from jsonb_to_recordset(p_rows) as x(price_group text, head_size text, length_cm int, tier_qty int, price_ex_vat numeric, price_inc_vat numeric);
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.admin_replace_variety_groups(p_rows jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'invalid_rows'; end if;
  delete from public.variety_groups where true;
  insert into public.variety_groups (variety, price_group)
  select left(x.variety, 120), x.price_group
  from jsonb_to_recordset(p_rows) as x(variety text, price_group text)
  where coalesce(x.variety, '') <> '' and coalesce(x.price_group, '') <> '';
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.admin_replace_prices(jsonb) from public;
revoke all on function public.admin_replace_variety_groups(jsonb) from public;
grant execute on function public.admin_replace_prices(jsonb) to authenticated;
grant execute on function public.admin_replace_variety_groups(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Make yourself the first admin (run AFTER you have registered on the site
--    and confirmed your e-mail). Replace the address if needed:
--
--   update public.profiles
--      set is_admin = true, status = 'approved'
--    where email = 'info@africane.se';
-- ---------------------------------------------------------------------------
