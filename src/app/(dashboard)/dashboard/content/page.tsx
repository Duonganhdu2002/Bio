import { ContentSection } from "@/components/dashboard/content-section";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Link, Product, ProductCategory, ProfileBanner } from "@/lib/types";
import { BannersManager } from "../banners/_components/banners-manager";
import { LinksManager } from "../links/_components/links-manager";
import { CategoriesManager } from "../products/_components/categories-manager";
import { ProductsManager } from "../products/_components/products-manager";

export const metadata = { title: "Nội dung" };

export default async function ContentPage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const [linksRes, productsRes, categoriesRes, bannersRes] = await Promise.all([
    supabase
      .from("links")
      .select("*")
      .eq("profile_id", profile.id)
      .order("position")
      .order("created_at"),
    supabase
      .from("products")
      .select("*")
      .eq("profile_id", profile.id)
      .order("position")
      .order("created_at"),
    supabase
      .from("product_categories")
      .select("*")
      .eq("profile_id", profile.id)
      .order("section")
      .order("position")
      .order("created_at"),
    supabase
      .from("profile_banners")
      .select("*")
      .eq("profile_id", profile.id)
      .order("section")
      .order("position")
      .order("created_at"),
  ]);

  const links = (linksRes.data ?? []) as Link[];
  const products = (productsRes.data ?? []) as Product[];
  const categories = (categoriesRes.data ?? []) as ProductCategory[];
  const banners = (bannersRes.data ?? []) as ProfileBanner[];

  return (
    <>
      <PageHeader
        eyebrow="Quản lý"
        title="Nội dung"
        description="Links, sản phẩm, banner PR và brand — tất cả trên một trang."
      />

      <div className="space-y-2">
        <ContentSection
          id="links"
          title="Links"
          description="Liên kết hiển thị trên trang bio và vùng mô tả. Kéo-thả để sắp xếp."
        >
          <LinksManager initialLinks={links} profileId={profile.id} />
        </ContentSection>

        <ContentSection
          id="products"
          title="Sản phẩm"
          description="Danh mục sản phẩm, ghim nổi bật và danh sách mặt hàng."
        >
          <CategoriesManager
            initialCategories={categories}
            profileId={profile.id}
            sections={["product"]}
            hideHeading
          />
          <ProductsManager
            initialProducts={products}
            initialCategories={categories}
            initialBanners={banners}
            profileId={profile.id}
          />
        </ContentSection>

        <ContentSection
          id="banners"
          title="Banner PR"
          description="Banner chiến dịch hiển thị ở mục Gợi ý trên tab Shop."
        >
          <BannersManager
            initialBanners={banners}
            profileId={profile.id}
            sections={["for_you"]}
          />
        </ContentSection>

        <ContentSection
          id="brand"
          title="Brand"
          description="Thương hiệu đối tác trên trang cửa hàng — dùng chung cho banner và gán sản phẩm."
        >
          <BannersManager
            initialBanners={banners}
            profileId={profile.id}
            sections={["brand"]}
          />
        </ContentSection>
      </div>
    </>
  );
}
