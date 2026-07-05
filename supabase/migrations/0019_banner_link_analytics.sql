-- Bio: thêm target_type 'banner' + RPC analytics link/banner.

alter table public.events drop constraint if exists events_target_type_check;
alter table public.events add constraint events_target_type_check
  check (target_type is null or target_type in ('link', 'product', 'banner'));

create or replace function public.get_top_banners(p_days int default 30, p_limit int default 5)
returns table (id uuid, title text, clicks bigint)
language sql
security definer
set search_path = public
stable
as $$
  select b.id, b.name as title, count(*) as clicks
  from public.events e
  join public.profile_banners b on b.id = e.target_id
  where e.profile_id = auth.uid()
    and e.type = 'click'
    and e.target_type = 'banner'
    and e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  group by b.id, b.name
  order by clicks desc, b.name
  limit least(greatest(p_limit, 1), 50);
$$;

revoke execute on function public.get_top_banners(int, int) from public, anon;
grant execute on function public.get_top_banners(int, int) to authenticated;

create or replace function public.get_all_link_clicks_daily(p_days int default 7)
returns table (day date, clicks bigint)
language sql
security definer
set search_path = public
stable
as $$
  select (e.created_at at time zone 'UTC')::date as day, count(*) as clicks
  from public.events e
  where e.profile_id = auth.uid()
    and e.type = 'click'
    and e.target_type = 'link'
    and e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  group by 1
  order by 1;
$$;

revoke execute on function public.get_all_link_clicks_daily(int) from public, anon;
grant execute on function public.get_all_link_clicks_daily(int) to authenticated;

create or replace function public.get_all_banner_clicks_daily(p_days int default 7)
returns table (day date, clicks bigint)
language sql
security definer
set search_path = public
stable
as $$
  select (e.created_at at time zone 'UTC')::date as day, count(*) as clicks
  from public.events e
  where e.profile_id = auth.uid()
    and e.type = 'click'
    and e.target_type = 'banner'
    and e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  group by 1
  order by 1;
$$;

revoke execute on function public.get_all_banner_clicks_daily(int) from public, anon;
grant execute on function public.get_all_banner_clicks_daily(int) to authenticated;

create or replace function public.get_link_clicks_daily(
  p_link_id uuid,
  p_days int default 7
)
returns table (day date, clicks bigint)
language sql
security definer
set search_path = public
stable
as $$
  select (e.created_at at time zone 'UTC')::date as day, count(*) as clicks
  from public.events e
  join public.links l on l.id = e.target_id and l.profile_id = auth.uid()
  where e.target_id = p_link_id
    and e.type = 'click'
    and e.target_type = 'link'
    and e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  group by 1
  order by 1;
$$;

revoke execute on function public.get_link_clicks_daily(uuid, int) from public, anon;
grant execute on function public.get_link_clicks_daily(uuid, int) to authenticated;

create or replace function public.get_banner_clicks_daily(
  p_banner_id uuid,
  p_days int default 7
)
returns table (day date, clicks bigint)
language sql
security definer
set search_path = public
stable
as $$
  select (e.created_at at time zone 'UTC')::date as day, count(*) as clicks
  from public.events e
  join public.profile_banners b on b.id = e.target_id and b.profile_id = auth.uid()
  where e.target_id = p_banner_id
    and e.type = 'click'
    and e.target_type = 'banner'
    and e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  group by 1
  order by 1;
$$;

revoke execute on function public.get_banner_clicks_daily(uuid, int) from public, anon;
grant execute on function public.get_banner_clicks_daily(uuid, int) to authenticated;
