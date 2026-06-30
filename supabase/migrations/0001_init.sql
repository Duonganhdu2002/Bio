-- Bio (link-in-bio): schema khởi tạo.
-- profiles · links · products · events · stats_daily.
-- Quyết định tạo profile cho user mới: tạo trong server action signup (Agent 3),
-- KHÔNG dùng trigger handle_new_user, để giữ ràng buộc username NOT NULL khi user tự chọn.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext unique not null,
  display_name text,
  bio text,
  avatar_url text,
  theme text not null default 'default',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  url text not null,
  platform text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  price_cents integer,
  currency text not null default 'VND',
  url text,
  position integer not null default 0,
  is_pinned boolean not null default false,
  pinned_position smallint check (pinned_position between 1 and 3),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  -- pinned_position bắt buộc có khi is_pinned=true, và phải NULL khi is_pinned=false
  constraint products_pinned_position_consistent
    check ((is_pinned and pinned_position is not null) or (not is_pinned and pinned_position is null))
);

create table public.events (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('page_view', 'click')),
  target_type text check (target_type in ('link', 'product')),
  target_id uuid,
  referrer text,
  country text,
  device text,
  created_at timestamptz not null default now()
);

create table public.stats_daily (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  views integer not null default 0,
  clicks integer not null default 0,
  primary key (profile_id, day)
);

-- Tự cập nhật updated_at trên profiles.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
