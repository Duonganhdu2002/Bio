-- Bio: top sản phẩm theo lượt click cho trang public (90 ngày gần nhất).

create or replace function public.get_public_top_products(p_username citext, p_limit int default 5)
returns uuid[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    array_agg(sub.id order by sub.clicks desc, sub.title),
    '{}'::uuid[]
  )
  from (
    select pr.id, pr.title, count(e.id) as clicks
    from public.profiles p
    join public.products pr on pr.profile_id = p.id and pr.is_active
    join public.events e on e.target_id = pr.id
      and e.profile_id = p.id
      and e.type = 'click'
      and e.target_type = 'product'
      and e.created_at >= now() - interval '90 days'
    where lower(p.username::text) = lower(p_username::text)
      and p.is_published
    group by pr.id, pr.title
    having count(e.id) > 0
    order by clicks desc, pr.title
    limit least(greatest(p_limit, 1), 20)
  ) sub;
$$;

revoke execute on function public.get_public_top_products(citext, int) from public;
grant execute on function public.get_public_top_products(citext, int) to anon, authenticated;
