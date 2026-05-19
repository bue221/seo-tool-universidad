create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique default (auth.jwt() ->> 'sub'),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_id_not_blank check (char_length(user_id) > 0)
);

comment on table public.profiles is
  'Application profile rows owned by Clerk user IDs from auth.jwt()->>sub.';
comment on column public.profiles.user_id is
  'Clerk user ID (JWT sub). Not a Supabase auth.users FK.';

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'profiles_touch_updated_at'
  ) then
    create trigger profiles_touch_updated_at
    before update on public.profiles
    for each row
    execute function public.touch_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'users read own profile'
  ) then
    create policy "users read own profile"
      on public.profiles
      as permissive
      for select
      to authenticated
      using (((select auth.jwt()) ->> 'sub') = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'users insert own profile'
  ) then
    create policy "users insert own profile"
      on public.profiles
      as permissive
      for insert
      to authenticated
      with check (((select auth.jwt()) ->> 'sub') = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'users update own profile'
  ) then
    create policy "users update own profile"
      on public.profiles
      as permissive
      for update
      to authenticated
      using (((select auth.jwt()) ->> 'sub') = user_id)
      with check (((select auth.jwt()) ->> 'sub') = user_id);
  end if;
end;
$$;

create table if not exists public.seo_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  url text not null check (char_length(url) <= 2000),
  result jsonb not null,
  global_score numeric(5,2) not null check (global_score between 0 and 100),
  partial_failure jsonb,
  fetched_at timestamptz not null default now(),
  constraint seo_snapshots_user_id_not_blank check (char_length(user_id) > 0)
);

comment on table public.seo_snapshots is
  'Immutable SEO audit history rows owned by Clerk user IDs from auth.jwt()->>sub.';
comment on column public.seo_snapshots.user_id is
  'Clerk user ID (JWT sub). Not a Supabase auth.users FK.';

alter table public.seo_snapshots enable row level security;

create index if not exists seo_snapshots_user_fetched_idx
  on public.seo_snapshots (user_id, fetched_at desc);

create index if not exists seo_snapshots_user_url_fetched_idx
  on public.seo_snapshots (user_id, url, fetched_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_snapshots'
      and policyname = 'users read own snapshots'
  ) then
    create policy "users read own snapshots"
      on public.seo_snapshots
      as permissive
      for select
      to authenticated
      using (((select auth.jwt()) ->> 'sub') = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_snapshots'
      and policyname = 'users insert own snapshots'
  ) then
    create policy "users insert own snapshots"
      on public.seo_snapshots
      as permissive
      for insert
      to authenticated
      with check (((select auth.jwt()) ->> 'sub') = user_id);
  end if;
end;
$$;

revoke all privileges on table public.profiles from anon, authenticated;
revoke all privileges on table public.seo_snapshots from anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert on table public.seo_snapshots to authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
