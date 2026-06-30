-- Bio: Storage buckets cho ảnh tự upload (avatar + ảnh sản phẩm).
-- Public read (để next/image lấy public URL), chỉ owner ghi vào thư mục của chính mình.
-- Convention path: "<auth.uid()>/<file>" → kiểm soát quyền theo segment đầu.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',  'avatars',  true, 5242880,  array['image/webp','image/png','image/jpeg']),
  ('products', 'products', true, 10485760, array['image/webp','image/png','image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Ai cũng đọc được (bucket public).
create policy "bio_storage_public_read"
on storage.objects for select
to public
using (bucket_id in ('avatars', 'products'));

-- Chỉ user đã đăng nhập, và file phải nằm trong thư mục mang tên uid của họ.
create policy "bio_storage_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars', 'products')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "bio_storage_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars', 'products')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('avatars', 'products')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "bio_storage_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars', 'products')
  and (storage.foldername(name))[1] = auth.uid()::text
);
