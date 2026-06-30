-- Bio: index & ràng buộc bổ sung.
-- CHECK pinned_position BETWEEN 1 AND 3 đã khai báo inline trong 0001_init.sql.

-- 3 vị trí ghim của mỗi profile không được trùng nhau.
create unique index products_pinned_unique
  on public.products (profile_id, pinned_position)
  where is_pinned;

-- Sắp xếp links theo position cho từng profile.
create index links_profile_position_idx
  on public.links (profile_id, position);

-- Lọc/sắp xếp products (ghim + position) cho từng profile.
create index products_profile_pinned_position_idx
  on public.products (profile_id, is_pinned, position);

-- Truy vấn analytics theo thời gian.
create index events_profile_created_idx
  on public.events (profile_id, created_at);

-- stats_daily(profile_id, day) đã được PRIMARY KEY phủ index, không cần tạo thêm.
