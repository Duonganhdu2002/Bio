"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FooterCta } from "./footer-cta";
import { ShopCampaignStrip } from "./shop-campaign-strip";
import { ShopCategoryList } from "./shop-category-list";
import { ShopProductTile } from "./shop-product-tile";
import { ShopSectionHeader } from "./shop-section-header";
import { ShopStoreHeader } from "./shop-store-header";
import { ShopTabBar, type ShopTab } from "./shop-tab-bar";
import { buildBrandNav, buildCategoryNav } from "./product-utils";
import { normalizeCategorySection } from "@/lib/category-section";
import type {
  PublicBanner,
  PublicLink,
  PublicPinnedProduct,
  PublicProduct,
  PublicProductCategory,
  PublicProfile,
} from "./types";

function ShopProductGrid({
  profileId,
  products,
  emptyMessage = "Không có sản phẩm.",
  layout = "grid",
}: {
  profileId: string;
  products: PublicProduct[];
  emptyMessage?: string;
  layout?: "grid" | "scroll";
}) {
  if (!products.length) {
    return (
      <p className="px-3 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 gap-2 px-3 pb-4">
        {products.map((product) => (
          <ShopProductTile key={product.id} profileId={profileId} product={product} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {products.map((product) => (
        <ShopProductTile
          key={product.id}
          profileId={profileId}
          product={product}
          variant="scroll"
        />
      ))}
    </div>
  );
}

function ShopPinnedScroll({
  profileId,
  pinned,
}: {
  profileId: string;
  pinned: PublicPinnedProduct[];
}) {
  const items = pinned.slice(0, 6);
  if (!items.length) return null;

  return (
    <section aria-label="Nổi bật" className="pb-1">
      <ShopSectionHeader title="Nổi bật" action="Xem thêm" className="pt-2" />
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((product) => (
          <ShopProductTile
            key={product.id}
            profileId={profileId}
            product={product}
            variant="scroll"
            pinned
          />
        ))}
      </div>
    </section>
  );
}

/** Layout cửa hàng — header/tab kiểu IG, nội dung sản phẩm/banner như cũ. */
export function ShopLayout({
  profile,
  links,
  banners = [],
  pinned,
  products,
  categories = [],
}: {
  profile: PublicProfile;
  links: PublicLink[];
  banners?: PublicBanner[];
  pinned: PublicPinnedProduct[];
  products: PublicProduct[];
  categories?: PublicProductCategory[];
}) {
  const [tab, setTab] = useState<ShopTab>("shop");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const shouldScrollToPanelsRef = useRef(false);

  useLayoutEffect(() => {
    if (!shouldScrollToPanelsRef.current) return;
    shouldScrollToPanelsRef.current = false;
    panelsRef.current?.scrollIntoView({ block: "start" });
  }, [tab]);

  const productNavItems = useMemo(
    () => buildCategoryNav(products, categories, "product"),
    [products, categories],
  );
  const brandNavItems = useMemo(
    () => buildBrandNav(products, banners),
    [products, banners],
  );
  const navItems = useMemo(
    () => [...productNavItems, ...brandNavItems],
    [productNavItems, brandNavItems],
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? products.filter((p) => p.title.toLowerCase().includes(q)) : products;
  }, [products, search]);

  const categoryProducts = useMemo(() => {
    if (!activeCategory) return [];

    if (activeCategory === "none") {
      const productCategoryIds = new Set(
        categories
          .filter((c) => normalizeCategorySection(c.section) === "product")
          .map((c) => c.id),
      );
      return filteredProducts.filter(
        (p) => !p.category_id || !productCategoryIds.has(p.category_id),
      );
    }

    const isBrand = banners.some(
      (b) => b.id === activeCategory && (b.section ?? "for_you") === "brand",
    );
    if (isBrand) {
      return filteredProducts.filter((p) => p.brand_id === activeCategory);
    }

    return filteredProducts.filter((p) => p.category_id === activeCategory);
  }, [activeCategory, filteredProducts, categories, banners]);

  const activeCategoryLabel = useMemo(() => {
    const nav = navItems.find((item) => item.key === activeCategory);
    if (nav) return nav.label;
    const brand = banners.find(
      (b) => b.id === activeCategory && (b.section ?? "for_you") === "brand",
    );
    if (brand) return brand.name;
    return "Danh mục";
  }, [activeCategory, navItems, banners]);

  const handleBrandSelect = (brandId: string) => {
    setTab("categories");
    setActiveCategory(brandId);
    shouldScrollToPanelsRef.current = true;
  };

  return (
    <div className="mx-auto w-full max-w-lg overflow-x-hidden bg-background [scrollbar-gutter:stable]">
      <div className="sticky top-0 z-20 flex h-11 shrink-0 items-center justify-center border-b border-border bg-background/95 backdrop-blur-sm">
        <span className="text-sm font-semibold text-foreground">@{profile.username}</span>
      </div>

      <ShopStoreHeader
        profile={profile}
        productCount={products.length}
        linkCount={links.length}
        categoryCount={categories.length}
        links={links}
      />

      <ShopTabBar
        active={tab}
        onChange={(next) => {
          if (next === tab) return;
          setTab(next);
          setActiveCategory(null);
          shouldScrollToPanelsRef.current = true;
        }}
      />

      <div ref={panelsRef} className="scroll-mt-[5.5rem]">
      {tab === "shop" ? (
        <div className="flex flex-col divide-y divide-border/40">
          <ShopPinnedScroll profileId={profile.id} pinned={pinned} />
          <ShopCampaignStrip banners={banners} onBrandSelect={handleBrandSelect} />
        </div>
      ) : null}

      {tab === "products" ? (
        <section aria-label="Tất cả sản phẩm">
          <div className="border-b border-border px-3 py-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                role="searchbox"
                aria-label="Tìm trong cửa hàng"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm trong cửa hàng..."
                className="h-9 rounded-full border-border bg-muted pl-9 shadow-none"
              />
            </div>
          </div>
          <ShopSectionHeader
            title="Tất cả sản phẩm"
            action={`${filteredProducts.length} mặt hàng`}
          />
          <ShopProductGrid
            profileId={profile.id}
            products={filteredProducts}
            layout="grid"
            emptyMessage={
              search.trim() ? "Không tìm thấy sản phẩm phù hợp." : "Chưa có sản phẩm."
            }
          />
        </section>
      ) : null}

      {tab === "categories" ? (
        <section aria-label="Danh mục hàng">
          {activeCategory ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setActiveCategory(null)}
                  aria-label="Quay lại danh sách danh mục"
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <h2 className="text-sm font-semibold text-foreground">{activeCategoryLabel}</h2>
              </div>
              <ShopProductGrid
                profileId={profile.id}
                products={categoryProducts}
                layout="grid"
                emptyMessage="Chưa có sản phẩm trong danh mục này."
              />
            </>
          ) : (
            <ShopCategoryList
              categories={categories}
              productNavItems={productNavItems}
              brandNavItems={brandNavItems}
              onSelect={setActiveCategory}
            />
          )}
        </section>
      ) : null}
      </div>

      <div className="px-4 py-8">
        <FooterCta />
      </div>
    </div>
  );
}
