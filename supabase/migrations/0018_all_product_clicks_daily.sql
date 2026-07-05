-- Bio: RPC tổng lượt bấm sản phẩm theo ngày (trang phân tích sản phẩm chuyên sâu).

create or replace function public.get_all_product_clicks_daily(p_days int default 7)
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
    and e.target_type = 'product'
    and e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  group by 1
  order by 1;
$$;

revoke execute on function public.get_all_product_clicks_daily(int) from public, anon;
grant execute on function public.get_all_product_clicks_daily(int) to authenticated;
