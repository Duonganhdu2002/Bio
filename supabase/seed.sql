-- Bio: dữ liệu demo. Chạy SAU khi migrations đã apply.
-- Tạo 1 user demo (email demo@bio.test / mật khẩu demo123456) + profile + links + 5 product (3 ghim) + vài event.
-- Idempotent: chạy lại không lỗi (on conflict do nothing / xoá dữ liệu con trước khi seed lại).

-- ID cố định để dễ tham chiếu.
-- user/profile: 11111111-1111-1111-1111-111111111111

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'demo@bio.test',
  crypt('demo123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, display_name, bio, avatar_url, theme, is_published)
values (
  '11111111-1111-1111-1111-111111111111',
  'demo',
  'Bio Demo',
  'Trang link cá nhân demo của Bio.',
  null,
  'default',
  true
)
on conflict (id) do update
set username = excluded.username,
    display_name = excluded.display_name,
    bio = excluded.bio,
    theme = excluded.theme,
    is_published = excluded.is_published;

-- Seed lại sạch dữ liệu con của profile demo.
delete from public.links where profile_id = '11111111-1111-1111-1111-111111111111';
delete from public.products where profile_id = '11111111-1111-1111-1111-111111111111';
delete from public.events where profile_id = '11111111-1111-1111-1111-111111111111';
delete from public.stats_daily where profile_id = '11111111-1111-1111-1111-111111111111';

insert into public.links (profile_id, title, url, platform, position) values
  ('11111111-1111-1111-1111-111111111111', 'Instagram', 'https://instagram.com/demo', 'instagram', 0),
  ('11111111-1111-1111-1111-111111111111', 'TikTok', 'https://tiktok.com/@demo', 'tiktok', 1),
  ('11111111-1111-1111-1111-111111111111', 'YouTube', 'https://youtube.com/@demo', 'youtube', 2),
  ('11111111-1111-1111-1111-111111111111', 'Website', 'https://demo.example.com', 'website', 3);

insert into public.products
  (profile_id, title, description, image_url, price_cents, currency, url, position, is_pinned, pinned_position)
values
  ('11111111-1111-1111-1111-111111111111', 'Khoá học content', 'Khoá học làm content từ A-Z.', null, 49900000, 'VND', 'https://demo.example.com/course', 0, true, 1),
  ('11111111-1111-1111-1111-111111111111', 'Ebook 30 ngày', 'Ebook xây dựng thói quen sáng tạo.', null, 19900000, 'VND', 'https://demo.example.com/ebook', 1, true, 2),
  ('11111111-1111-1111-1111-111111111111', 'Preset Lightroom', 'Bộ preset chỉnh ảnh tông trong trẻo.', null, 9900000, 'VND', 'https://demo.example.com/preset', 2, true, 3),
  ('11111111-1111-1111-1111-111111111111', 'Tư vấn 1:1', 'Buổi tư vấn cá nhân 60 phút.', null, 99900000, 'VND', 'https://demo.example.com/consult', 3, false, null),
  ('11111111-1111-1111-1111-111111111111', 'Merch áo thun', 'Áo thun phiên bản giới hạn.', null, 29900000, 'VND', 'https://demo.example.com/merch', 4, false, null);

-- Vài event mẫu + rollup tương ứng.
insert into public.events (profile_id, type, target_type, target_id, referrer, country, device, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'page_view', null, null, 'https://instagram.com', 'VN', 'mobile', now() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'page_view', null, null, 'https://tiktok.com', 'VN', 'mobile', now() - interval '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'page_view', null, null, null, 'VN', 'desktop', now()),
  ('11111111-1111-1111-1111-111111111111', 'click', 'link', null, null, 'VN', 'mobile', now());

insert into public.stats_daily (profile_id, day, views, clicks) values
  ('11111111-1111-1111-1111-111111111111', (now() - interval '2 days')::date, 1, 0),
  ('11111111-1111-1111-1111-111111111111', (now() - interval '1 day')::date, 1, 0),
  ('11111111-1111-1111-1111-111111111111', now()::date, 1, 1)
on conflict (profile_id, day) do update
set views = excluded.views, clicks = excluded.clicks;
