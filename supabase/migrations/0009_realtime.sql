-- Bio: Supabase Realtime cho trang public /@username.
-- Realtime postgres_changes tuân RLS — cần SELECT cho anon trên nội dung đã publish.
-- Trang vẫn đọc chính qua RPC get_public_profile; policy chỉ phục vụ subscription.

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.links;
alter publication supabase_realtime add table public.profiles;

create policy "links_select_published"
on public.links for select
using (
  is_active
  and exists (
    select 1 from public.profiles p
    where p.id = links.profile_id and p.is_published
  )
);

create policy "products_select_published"
on public.products for select
using (
  is_active
  and exists (
    select 1 from public.profiles p
    where p.id = products.profile_id and p.is_published
  )
);
