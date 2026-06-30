-- Bio: thêm "template" (bố cục UI/UX) cho trang public — trục độc lập với
-- theme màu và phong cách. Khóa khớp `BIO_TEMPLATE_KEYS` (components/bio/theme.ts):
-- stack | spotlight | grid | sidebar | showcase | magazine.

alter table public.profiles
  add column if not exists template text not null default 'stack';

-- Cập nhật RPC trang public để trả thêm `template` trong object `profile`.
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
