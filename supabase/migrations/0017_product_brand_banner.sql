-- Brand dùng chung data với profile_banners (section = brand), không còn product_categories section brand.

alter table public.products
  drop constraint if exists products_brand_id_fkey;

update public.products
set brand_id = null
where brand_id is not null
  and not exists (
    select 1 from public.profile_banners b where b.id = products.brand_id
  );

alter table public.products
  add constraint products_brand_id_fkey
  foreign key (brand_id) references public.profile_banners (id) on delete set null;
