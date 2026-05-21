create table if not exists public.seo_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  input jsonb not null,
  result jsonb not null,
  fetched_at timestamptz not null default now(),
  constraint seo_comparisons_user_id_not_blank check (char_length(user_id) > 0)
);

comment on table public.seo_comparisons is
  'Saved competitor comparison runs owned by Clerk user IDs from auth.jwt()->>sub.';

alter table public.seo_comparisons enable row level security;

create index if not exists seo_comparisons_user_fetched_idx
  on public.seo_comparisons (user_id, fetched_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_comparisons'
      and policyname = 'users read own comparisons'
  ) then
    create policy "users read own comparisons"
      on public.seo_comparisons
      as permissive
      for select
      to authenticated
      using (((select auth.jwt()) ->> 'sub') = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_comparisons'
      and policyname = 'users insert own comparisons'
  ) then
    create policy "users insert own comparisons"
      on public.seo_comparisons
      as permissive
      for insert
      to authenticated
      with check (((select auth.jwt()) ->> 'sub') = user_id);
  end if;
end;
$$;

grant select, insert on table public.seo_comparisons to authenticated;
