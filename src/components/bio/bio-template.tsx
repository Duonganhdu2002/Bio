import { FooterCta } from "./footer-cta";
import { LinkButton } from "./link-button";
import { LinkList } from "./link-list";
import { PinnedRail } from "./pinned-rail";
import { ProductGrid } from "./product-grid";
import { ProfileHeader } from "./profile-header";
import { ShopLayout } from "./shop-layout";
import { resolveBioTemplate } from "./theme";
import type {
  PublicBanner,
  PublicLink,
  PublicPinnedProduct,
  PublicProduct,
  PublicProductCategory,
  PublicProfile,
} from "./types";

type TemplateProps = {
  profile: PublicProfile;
  links: PublicLink[];
  banners: PublicBanner[];
  pinned: PublicPinnedProduct[];
  products: PublicProduct[];
  categories: PublicProductCategory[];
};

/**
 * Bộ chọn TEMPLATE bố cục trang public bio. Mỗi template dựng cùng bộ khối
 * (header / pinned / links / products / footer) theo MỘT cấu trúc UI/UX riêng:
 * độ rộng container, vị trí avatar, links dạng cột hay lưới, hai cột hay một…
 * Trục này độc lập với chủ đề màu (`bio-theme-*`) và phong cách (`bio-style-*`).
 *
 * Khi có sản phẩm/ghim → luôn dùng ShopLayout (tab Shop / Sản phẩm / Danh mục),
 * bất kể template người dùng chọn trong dashboard.
 */
export function BioTemplate(props: TemplateProps) {
  const hasStore = props.products.length > 0 || props.pinned.length > 0;

  if (hasStore) {
    return (
      <div className="w-full py-0 sm:py-2">
        <ShopLayout
          profile={props.profile}
          links={props.links}
          banners={props.banners}
          pinned={props.pinned}
          products={props.products}
          categories={props.categories}
        />
      </div>
    );
  }

  const template = resolveBioTemplate(props.profile.template);

  switch (template) {
    case "spotlight":
      return <SpotlightTemplate {...props} />;
    case "grid":
      return <GridTemplate {...props} />;
    case "sidebar":
      return <SidebarTemplate {...props} />;
    case "showcase":
      return <ShowcaseTemplate {...props} />;
    case "magazine":
      return <MagazineTemplate {...props} />;
    case "stack":
    default:
      return <StackTemplate {...props} />;
  }
}

/* 1) STACK — cột cổ điển, căn giữa, hẹp. Chỉ dùng khi không có sản phẩm. */
function StackTemplate({ profile, links }: TemplateProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:py-14">
      <ProfileHeader profile={profile} />
      <LinkList profileId={profile.id} links={links} />
      <FooterCta />
    </div>
  );
}

/* 2) SPOTLIGHT — bìa lớn tràn viền, avatar đè lên ảnh bìa kiểu "sân khấu". */
function SpotlightTemplate({ profile, links, pinned, products, categories }: TemplateProps) {
  return (
    <div className="w-full">
      <div
        aria-hidden
        className="h-40 w-full bg-gradient-to-br from-primary via-primary/80 to-accent sm:h-56"
      />
      <div className="mx-auto -mt-14 flex w-full max-w-xl flex-col gap-6 px-4 pb-12 sm:-mt-16">
        <ProfileHeader profile={profile} />
        <PinnedRail profileId={profile.id} pinned={pinned} />
        <LinkList profileId={profile.id} links={links} />
        <ProductGrid profileId={profile.id} products={products} categories={categories} />
        <FooterCta />
      </div>
    </div>
  );
}

/* 3) GRID — links xếp dạng lưới 2 cột, container rộng hơn. */
function GridTemplate({ profile, links, pinned, products, categories }: TemplateProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:py-14">
      <ProfileHeader profile={profile} />
      <PinnedRail profileId={profile.id} pinned={pinned} />
      {links.length ? (
        <nav
          aria-label="Liên kết"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {links.map((link) => (
            <LinkButton key={link.id} profileId={profile.id} link={link} />
          ))}
        </nav>
      ) : null}
      <ProductGrid profileId={profile.id} products={products} categories={categories} />
      <FooterCta />
    </div>
  );
}

/* 4) SIDEBAR — hai cột trên desktop: hồ sơ dính bên trái, nội dung bên phải. */
function SidebarTemplate({ profile, links, pinned, products, categories }: TemplateProps) {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-10 sm:py-14 lg:grid-cols-[18rem_1fr] lg:gap-12">
      <aside className="flex flex-col gap-6 lg:sticky lg:top-10 lg:self-start">
        <ProfileHeader profile={profile} align="start" />
        <div className="hidden lg:block">
          <FooterCta />
        </div>
      </aside>
      <div className="flex flex-col gap-6">
        <PinnedRail profileId={profile.id} pinned={pinned} />
        <LinkList profileId={profile.id} links={links} />
        <ProductGrid profileId={profile.id} products={products} categories={categories} />
        <div className="lg:hidden">
          <FooterCta />
        </div>
      </div>
    </div>
  );
}

/* 5) SHOWCASE — ưu tiên thương mại (store layout xử lý ở BioTemplate khi có sản phẩm). */
function ShowcaseTemplate(props: TemplateProps) {
  return <StackTemplate {...props} />;
}

/* 6) MAGAZINE — kiểu tạp chí: tiêu đề căn trái, có đường kẻ phân vùng. */
function MagazineTemplate({ profile, links, pinned, products, categories }: TemplateProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-12 sm:py-16">
      <ProfileHeader profile={profile} align="start" />
      <hr className="border-t border-border" />
      <PinnedRail profileId={profile.id} pinned={pinned} />
      <LinkList profileId={profile.id} links={links} />
      <ProductGrid profileId={profile.id} products={products} categories={categories} />
      <FooterCta />
    </div>
  );
}
