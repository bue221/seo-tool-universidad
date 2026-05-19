create table if not exists public.seo_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null check (char_length(url) <= 2000),
  result jsonb not null,
  global_score numeric(5,2) not null check (global_score between 0 and 100),
  partial_failure jsonb,
  fetched_at timestamptz not null default now()
);

alter table public.seo_snapshots enable row level security;

drop policy if exists "users read own snapshots" on public.seo_snapshots;
create policy "users read own snapshots"
on public.seo_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users insert own snapshots" on public.seo_snapshots;
create policy "users insert own snapshots"
on public.seo_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

create index if not exists seo_snapshots_user_fetched_idx
  on public.seo_snapshots (user_id, fetched_at desc);

create index if not exists seo_snapshots_user_url_fetched_idx
  on public.seo_snapshots (user_id, url, fetched_at desc);

grant select, insert on public.seo_snapshots to authenticated;
