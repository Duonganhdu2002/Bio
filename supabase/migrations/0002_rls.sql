-- Bio: Row Level Security. RLS bật trên mọi bảng.
-- Public bio đọc qua RPC get_public_profile (SECURITY DEFINER), KHÔNG select trực tiếp links/products.
-- events: không có policy nào => mọi truy cập trực tiếp bị chặn; chỉ ghi qua track_event (definer).

alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.products enable row level security;
alter table public.events enable row level security;
alter table public.stats_daily enable row level security;

-- profiles: chủ sở hữu full CRUD; anon/auth chỉ SELECT khi is_published.
create policy "profiles_select_published_or_owner"
on public.profiles for select
using (is_published or id = auth.uid());

create policy "profiles_insert_self"
on public.profiles for insert
with check (id = auth.uid());

create policy "profiles_update_owner"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_delete_owner"
on public.profiles for delete
using (id = auth.uid());

-- links: chỉ chủ sở hữu (anon đọc gián tiếp qua RPC definer).
create policy "links_all_owner"
on public.links for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- products: chỉ chủ sở hữu.
create policy "products_all_owner"
on public.products for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- stats_daily: chủ sở hữu chỉ được SELECT (ghi qua track_event definer).
create policy "stats_daily_select_owner"
on public.stats_daily for select
using (profile_id = auth.uid());
