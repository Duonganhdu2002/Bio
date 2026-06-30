-- Ảnh nền / bìa cửa hàng trên trang public.

alter table public.profiles
  add column if not exists cover_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 6291456, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "bio_storage_public_read" on storage.objects;
create policy "bio_storage_public_read"
on storage.objects for select
to public
using (bucket_id in ('avatars', 'products', 'covers'));

drop policy if exists "bio_storage_owner_insert" on storage.objects;
create policy "bio_storage_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars', 'products', 'covers')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "bio_storage_owner_update" on storage.objects;
create policy "bio_storage_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars', 'products', 'covers')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('avatars', 'products', 'covers')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "bio_storage_owner_delete" on storage.objects;
create policy "bio_storage_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars', 'products', 'covers')
  and (storage.foldername(name))[1] = auth.uid()::text
);

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
