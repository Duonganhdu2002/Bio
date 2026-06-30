-- Sản phẩm có thể thuộc một brand (danh mục section = brand), tách khỏi danh mục sản phẩm.

alter table public.products
  add column if not exists brand_id uuid references public.product_categories (id) on delete set null;

create index if not exists products_brand_id_idx
  on public.products (brand_id)
  where brand_id is not null;

-- Di chuyển gán nhầm brand vào category_id (nếu có).
update public.products pr
set
  brand_id = pr.category_id,
  category_id = null
from public.product_categories c
where pr.category_id = c.id
  and c.section = 'brand';

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
      'cover_url', p.cover_url,
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
          'section', c.section,
          'position', c.position
        )
        order by c.section, c.position, c.created_at
      )
      from public.product_categories c
      where c.profile_id = p.id
    ), '[]'::jsonb),
    'banners', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'name', b.name,
          'image_url', b.image_url,
          'url', b.url,
          'section', b.section,
          'position', b.position
        )
        order by b.section, b.position, b.created_at
      )
      from public.profile_banners b
      where b.profile_id = p.id and b.is_active
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
          'brand_id', pr.brand_id,
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
          'category_id', pr.category_id,
          'brand_id', pr.brand_id
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
