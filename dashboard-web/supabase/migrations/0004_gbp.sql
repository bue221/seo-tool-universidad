create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_name text not null,
  category text,
  description text,
  address text,
  phone text,
  website_url text,
  hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.business_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.business_profiles (id) on delete cascade,
  title text not null,
  body text not null,
  cta_label text,
  cta_url text,
  published_at timestamptz not null default now()
);

create table if not exists public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.business_profiles (id) on delete cascade,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  response text,
  reviewed_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table public.business_profiles enable row level security;
alter table public.business_posts enable row level security;
alter table public.business_reviews enable row level security;

create policy "profiles own rows" on public.business_profiles
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "posts own profile" on public.business_posts
for all to authenticated
using (profile_id in (select id from public.business_profiles where user_id = auth.uid()))
with check (profile_id in (select id from public.business_profiles where user_id = auth.uid()));

create policy "reviews own profile" on public.business_reviews
for all to authenticated
using (profile_id in (select id from public.business_profiles where user_id = auth.uid()))
with check (profile_id in (select id from public.business_profiles where user_id = auth.uid()));
