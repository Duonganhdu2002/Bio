-- Bio: RPC lượt bấm theo ngày cho một sản phẩm (trang analytics chi tiết).
-- events không có policy SELECT → đọc qua SECURITY DEFINER, chỉ sản phẩm của user hiện tại.

create or replace function public.get_product_clicks_daily(
  p_product_id uuid,
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
  join public.products pr on pr.id = e.target_id and pr.profile_id = auth.uid()
  where e.target_id = p_product_id
    and e.type = 'click'
    and e.target_type = 'product'
    and e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  group by 1
  order by 1;
$$;

revoke execute on function public.get_product_clicks_daily(uuid, int) from public, anon;
grant execute on function public.get_product_clicks_daily(uuid, int) to authenticated;
