-- Bio: danh mục sản phẩm — nhóm sản phẩm trên trang public và dashboard.

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products
  add column category_id uuid references public.product_categories (id) on delete set null;

create index product_categories_profile_position_idx
  on public.product_categories (profile_id, position);

create index products_category_id_idx
  on public.products (category_id)
  where category_id is not null;

alter table public.product_categories enable row level security;

create policy "product_categories_all_owner"
on public.product_categories for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- Realtime: đồng bộ danh mục trên trang public.
alter publication supabase_realtime add table public.product_categories;

create policy "product_categories_select_published"
on public.product_categories for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = product_categories.profile_id and p.is_published
  )
);

-- Sắp xếp lại thứ tự danh mục (chỉ danh mục của user hiện tại).
create or replace function public.reorder_product_categories(p_ids uuid[])
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

  update public.product_categories c
  set position = ord.rn::int
  from unnest(p_ids) with ordinality as ord(id, rn)
  where c.id = ord.id and c.profile_id = v_uid;
end;
$$;

revoke execute on function public.reorder_product_categories(uuid[]) from public, anon;
grant execute on function public.reorder_product_categories(uuid[]) to authenticated;

-- Cập nhật RPC trang public: thêm `categories[]` và `category_id` trên products.
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
      'theme', p.theme,
      'layout', p.layout,
      'template', p.template
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
    'categories', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'position', c.position
        )
        order by c.position, c.created_at
      )
      from public.product_categories c
      where c.profile_id = p.id
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
          'category_id', pr.category_id,
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
          'pinned_position', pr.pinned_position,
          'category_id', pr.category_id
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
