-- Bio: RPC đọc "top links/products" cho dashboard analytics (Agent 5).
-- events bật RLS nhưng KHÔNG có policy SELECT → kể cả owner cũng không query trực tiếp.
-- Vì vậy đọc qua hàm SECURITY DEFINER, chỉ trả dữ liệu của user đang đăng nhập (auth.uid()).
-- stats_daily đã có policy owner-SELECT nên series/overview đọc thẳng từ bảng, không cần RPC.

create or replace function public.get_top_links(p_days int default 30, p_limit int default 5)
returns table (id uuid, title text, clicks bigint)
language sql
security definer
set search_path = public
stable
as $$
  select l.id, l.title, count(*) as clicks
  from public.events e
  join public.links l on l.id = e.target_id
  where e.profile_id = auth.uid()
    and e.type = 'click'
    and e.target_type = 'link'
    and e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  group by l.id, l.title
  order by clicks desc, l.title
  limit least(greatest(p_limit, 1), 50);
$$;

revoke execute on function public.get_top_links(int, int) from public, anon;
grant execute on function public.get_top_links(int, int) to authenticated;

create or replace function public.get_top_products(p_days int default 30, p_limit int default 5)
returns table (id uuid, title text, clicks bigint)
language sql
security definer
set search_path = public
stable
as $$
  select pr.id, pr.title, count(*) as clicks
  from public.events e
  join public.products pr on pr.id = e.target_id
  where e.profile_id = auth.uid()
    and e.type = 'click'
    and e.target_type = 'product'
    and e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  group by pr.id, pr.title
  order by clicks desc, pr.title
  limit least(greatest(p_limit, 1), 50);
$$;

revoke execute on function public.get_top_products(int, int) from public, anon;
grant execute on function public.get_top_products(int, int) to authenticated;
