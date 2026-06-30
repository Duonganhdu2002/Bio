-- Bio: RPC functions. Mỗi hàm SECURITY DEFINER + SET search_path = public.
-- Public/track không cần auth; các hàm sửa dữ liệu kiểm ownership qua auth.uid().

-- 1 round-trip cho trang public: trả JSON build sẵn, đã sort.
-- { profile, links[], pinned[<=3], products[] }. Chỉ trả khi is_published.
create or replace function public.get_public_profile(p_username citext)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'display_name', p.display_name,
      'bio', p.bio,
      'avatar_url', p.avatar_url,
      'theme', p.theme
    ),
    'links', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'title', l.title,
          'url', l.url,
          'platform', l.platform,
          'position', l.position
        )
        order by l.position, l.created_at
      )
      from public.links l
      where l.profile_id = p.id and l.is_active
    ), '[]'::jsonb),
    'pinned', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pr.id,
          'title', pr.title,
          'description', pr.description,
          'image_url', pr.image_url,
          'price_cents', pr.price_cents,
          'currency', pr.currency,
          'url', pr.url,
          'pinned_position', pr.pinned_position
        )
        order by pr.pinned_position
      )
      from public.products pr
      where pr.profile_id = p.id and pr.is_active and pr.is_pinned
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pr.id,
          'title', pr.title,
          'description', pr.description,
          'image_url', pr.image_url,
          'price_cents', pr.price_cents,
          'currency', pr.currency,
          'url', pr.url,
          'position', pr.position,
          'is_pinned', pr.is_pinned,
          'pinned_position', pr.pinned_position
        )
        order by pr.position, pr.created_at
      )
      from public.products pr
      where pr.profile_id = p.id and pr.is_active
    ), '[]'::jsonb)
  )
  from public.profiles p
  where p.username = p_username and p.is_published;
$$;

grant execute on function public.get_public_profile(citext) to anon, authenticated;

-- Ghi 1 event + cộng dồn stats_daily. Fire-and-forget từ client/edge.
create or replace function public.track_event(
  p_profile_id uuid,
  p_type text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_referrer text default null,
  p_country text default null,
  p_device text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_type not in ('page_view', 'click') then
    raise exception 'Loại event không hợp lệ: %', p_type;
  end if;

  -- Chỉ ghi cho profile đang publish (tránh ghi rác cho profile ẩn / không tồn tại).
  if not exists (
    select 1 from public.profiles where id = p_profile_id and is_published
  ) then
    return;
  end if;

  insert into public.events (
    profile_id, type, target_type, target_id, referrer, country, device
  )
  values (
    p_profile_id, p_type, p_target_type, p_target_id, p_referrer, p_country, p_device
  );

  insert into public.stats_daily (profile_id, day, views, clicks)
  values (
    p_profile_id,
    current_date,
    case when p_type = 'page_view' then 1 else 0 end,
    case when p_type = 'click' then 1 else 0 end
  )
  on conflict (profile_id, day) do update
  set views = public.stats_daily.views + excluded.views,
      clicks = public.stats_daily.clicks + excluded.clicks;
end;
$$;

grant execute on function public.track_event(uuid, text, text, uuid, text, text, text)
  to anon, authenticated;

-- Gán pinned_position 1..N theo thứ tự mảng cho user hiện tại, bỏ ghim phần còn lại. Tối đa 3.
create or replace function public.set_pinned_products(p_product_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  if coalesce(array_length(p_product_ids, 1), 0) > 3 then
    raise exception 'Chỉ được ghim tối đa 3 sản phẩm';
  end if;

  -- Mọi id phải thuộc về user hiện tại.
  if exists (
    select 1
    from unnest(p_product_ids) as t(id)
    where not exists (
      select 1 from public.products pr
      where pr.id = t.id and pr.profile_id = v_uid
    )
  ) then
    raise exception 'Sản phẩm không hợp lệ hoặc không thuộc về bạn';
  end if;

  -- Bỏ ghim toàn bộ trước để tránh đụng partial unique index khi gán lại vị trí.
  update public.products
  set is_pinned = false, pinned_position = null
  where profile_id = v_uid and is_pinned;

  -- Gán lại 1..N theo thứ tự mảng.
  update public.products pr
  set is_pinned = true, pinned_position = ord.rn::smallint
  from unnest(p_product_ids) with ordinality as ord(id, rn)
  where pr.id = ord.id and pr.profile_id = v_uid;
end;
$$;

-- Chỉ user đã đăng nhập; revoke khỏi public/anon (Postgres mặc định grant cho PUBLIC).
revoke execute on function public.set_pinned_products(uuid[]) from public, anon;
grant execute on function public.set_pinned_products(uuid[]) to authenticated;

-- Cập nhật position links theo thứ tự mảng (chỉ links của user hiện tại).
create or replace function public.reorder_links(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  update public.links l
  set position = ord.rn::int
  from unnest(p_ids) with ordinality as ord(id, rn)
  where l.id = ord.id and l.profile_id = v_uid;
end;
$$;

revoke execute on function public.reorder_links(uuid[]) from public, anon;
grant execute on function public.reorder_links(uuid[]) to authenticated;

-- Cập nhật position products theo thứ tự mảng (chỉ products của user hiện tại).
create or replace function public.reorder_products(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  update public.products pr
  set position = ord.rn::int
  from unnest(p_ids) with ordinality as ord(id, rn)
  where pr.id = ord.id and pr.profile_id = v_uid;
end;
$$;

revoke execute on function public.reorder_products(uuid[]) from public, anon;
grant execute on function public.reorder_products(uuid[]) to authenticated;
