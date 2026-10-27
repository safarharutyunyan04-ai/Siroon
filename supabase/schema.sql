-- Siroon — schéma normalisé (SQL Editor → Run)
-- Remplace les anciens snapshots JSON.

-- ── Menu ───────────────────────────────────────────────────────────────────
create table if not exists public.menu_categories (
  id text primary key,
  name text not null,
  i18n jsonb not null default '{}'::jsonb,
  parent_id text references public.menu_categories (id) on delete cascade,
  sort_order integer not null default 0
);

create table if not exists public.menu_items (
  id text primary key,
  category_id text not null references public.menu_categories (id) on delete cascade,
  name text not null,
  description text not null default '',
  i18n jsonb not null default '{}'::jsonb,
  price numeric not null default 0,
  price_unit text not null default 'portion',
  room_prices jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Migration bases déjà créées :
alter table public.menu_items
  add column if not exists room_prices jsonb not null default '{}'::jsonb;

-- ── Événements (1 ligne = 1 événement) ─────────────────────────────────────
create table if not exists public.venue_events (
  id text primary key,
  title text not null,
  contact text not null default '',
  date date not null,
  start_time text not null default '',
  guests integer not null default 0,
  room_id text not null,
  status text not null default 'confirmed',
  notes text not null default '',
  lines jsonb not null default '[]'::jsonb,
  discount jsonb not null default '{"kind":"none","value":0}'::jsonb,
  price_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Réglages (1 ligne) ─────────────────────────────────────────────────────
create table if not exists public.app_settings (
  id text primary key default 'default',
  currency text not null default 'AMD',
  locale text not null default 'hy',
  public_base_url text not null default ''
);

insert into public.app_settings (id)
values ('default')
on conflict (id) do nothing;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.venue_events enable row level security;
alter table public.app_settings enable row level security;

-- Menu : lecture publique (carte), écriture équipe
drop policy if exists "menu_categories_select" on public.menu_categories;
drop policy if exists "menu_categories_write" on public.menu_categories;
drop policy if exists "menu_categories_update" on public.menu_categories;
drop policy if exists "menu_categories_delete" on public.menu_categories;
create policy "menu_categories_select" on public.menu_categories for select to anon, authenticated using (true);
create policy "menu_categories_write" on public.menu_categories for insert to authenticated with check (true);
create policy "menu_categories_update" on public.menu_categories for update to authenticated using (true) with check (true);
create policy "menu_categories_delete" on public.menu_categories for delete to authenticated using (true);

drop policy if exists "menu_items_select" on public.menu_items;
drop policy if exists "menu_items_write" on public.menu_items;
drop policy if exists "menu_items_update" on public.menu_items;
drop policy if exists "menu_items_delete" on public.menu_items;
create policy "menu_items_select" on public.menu_items for select to anon, authenticated using (true);
create policy "menu_items_write" on public.menu_items for insert to authenticated with check (true);
create policy "menu_items_update" on public.menu_items for update to authenticated using (true) with check (true);
create policy "menu_items_delete" on public.menu_items for delete to authenticated using (true);

-- Events / settings : équipe seulement
drop policy if exists "venue_events_select" on public.venue_events;
drop policy if exists "venue_events_write" on public.venue_events;
drop policy if exists "venue_events_update" on public.venue_events;
drop policy if exists "venue_events_delete" on public.venue_events;
create policy "venue_events_select" on public.venue_events for select to authenticated using (true);
create policy "venue_events_write" on public.venue_events for insert to authenticated with check (true);
create policy "venue_events_update" on public.venue_events for update to authenticated using (true) with check (true);
create policy "venue_events_delete" on public.venue_events for delete to authenticated using (true);

drop policy if exists "app_settings_select" on public.app_settings;
drop policy if exists "app_settings_write" on public.app_settings;
drop policy if exists "app_settings_update" on public.app_settings;
create policy "app_settings_select" on public.app_settings for select to authenticated using (true);
create policy "app_settings_write" on public.app_settings for insert to authenticated with check (true);
create policy "app_settings_update" on public.app_settings for update to authenticated using (true) with check (true);

-- ── Realtime ───────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_categories'
  ) then
    alter publication supabase_realtime add table public.menu_categories;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_items'
  ) then
    alter publication supabase_realtime add table public.menu_items;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'venue_events'
  ) then
    alter publication supabase_realtime add table public.venue_events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table public.app_settings;
  end if;
end $$;

-- ── Migration depuis les anciens snapshots (si présents) ───────────────────
do $$
declare
  snap record;
  cat jsonb;
  itm jsonb;
  ev jsonb;
  sett jsonb;
begin
  if to_regclass('public.menu_snapshot') is not null then
    select * into snap from public.menu_snapshot where id = 'default';
    if found and (select count(*) from public.menu_categories) = 0 then
      -- racines d’abord, puis enfants (FK parent_id)
      for cat in
        select t.value
        from jsonb_array_elements(coalesce(snap.categories, '[]'::jsonb)) as t(value)
        where nullif(t.value->>'parentId', '') is null
      loop
        insert into public.menu_categories (id, name, i18n, parent_id, sort_order)
        values (
          cat->>'id',
          coalesce(cat->>'name', 'Section'),
          coalesce(cat->'i18n', '{}'::jsonb),
          null,
          coalesce((cat->>'sortOrder')::int, 0)
        )
        on conflict (id) do nothing;
      end loop;
      for cat in
        select t.value
        from jsonb_array_elements(coalesce(snap.categories, '[]'::jsonb)) as t(value)
        where nullif(t.value->>'parentId', '') is not null
      loop
        insert into public.menu_categories (id, name, i18n, parent_id, sort_order)
        values (
          cat->>'id',
          coalesce(cat->>'name', 'Section'),
          coalesce(cat->'i18n', '{}'::jsonb),
          cat->>'parentId',
          coalesce((cat->>'sortOrder')::int, 0)
        )
        on conflict (id) do nothing;
      end loop;
      for itm in
        select t.value
        from jsonb_array_elements(coalesce(snap.items, '[]'::jsonb)) as t(value)
      loop
        insert into public.menu_items (
          id, category_id, name, description, i18n, price, price_unit, active, created_at
        )
        values (
          itm->>'id',
          itm->>'categoryId',
          coalesce(itm->>'name', 'Aliment'),
          coalesce(itm->>'description', ''),
          coalesce(itm->'i18n', '{}'::jsonb),
          coalesce((itm->>'price')::numeric, 0),
          coalesce(itm->>'priceUnit', 'portion'),
          coalesce((itm->>'active')::boolean, true),
          coalesce((itm->>'createdAt')::timestamptz, now())
        )
        on conflict (id) do nothing;
      end loop;
    end if;
  end if;

  if to_regclass('public.data_snapshot') is not null then
    if (select count(*) from public.venue_events) = 0 then
      select payload into ev from public.data_snapshot where id = 'events';
      if ev is not null and jsonb_typeof(ev) = 'array' then
        for cat in select t.value from jsonb_array_elements(ev) as t(value)
        loop
          insert into public.venue_events (
            id, title, contact, date, start_time, guests, room_id, status, notes,
            lines, discount, price_rules, created_at, updated_at
          )
          values (
            cat->>'id',
            coalesce(cat->>'title', 'Événement'),
            coalesce(cat->>'contact', ''),
            coalesce((cat->>'date')::date, current_date),
            coalesce(cat->>'startTime', ''),
            coalesce((cat->>'guests')::int, 0),
            coalesce(cat->>'roomId', 'hall-1'),
            coalesce(cat->>'status', 'confirmed'),
            coalesce(cat->>'notes', ''),
            coalesce(cat->'lines', '[]'::jsonb),
            coalesce(cat->'discount', '{"kind":"none","value":0}'::jsonb),
            coalesce(cat->'priceRules', '[]'::jsonb),
            coalesce((cat->>'createdAt')::timestamptz, now()),
            coalesce((cat->>'updatedAt')::timestamptz, now())
          )
          on conflict (id) do nothing;
        end loop;
      end if;
    end if;

    select payload into sett from public.data_snapshot where id = 'settings';
    if sett is not null and jsonb_typeof(sett) = 'object' then
      update public.app_settings
      set
        currency = coalesce(sett->>'currency', currency),
        locale = coalesce(sett->>'locale', locale),
        public_base_url = coalesce(sett->>'publicBaseUrl', public_base_url)
      where id = 'default';
    end if;
  end if;
end $$;
