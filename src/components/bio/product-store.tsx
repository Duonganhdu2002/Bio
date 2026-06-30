"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductBannerCard } from "./product-banner-card";
import { ProductCard } from "./product-card";
import {
  buildCategoryNav,
  groupProductsByCategory,
  isImportedScreenshot,
  type ProductGroup,
} from "./product-utils";
import type { PublicProduct, PublicProductCategory } from "./types";

function ProductGroupSection({
  profileId,
  group,
  showHeading,
}: {
  profileId: string;
  group: ProductGroup;
  showHeading: boolean;
}) {
  const banners = group.products.filter((p) => isImportedScreenshot(p.image_url));
  const gridItems = group.products.filter((p) => !isImportedScreenshot(p.image_url));

  return (
    <div className="flex flex-col gap-3">
      {showHeading && group.label ? (
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{group.label}</h2>
      ) : null}

      {banners.length > 0 ? (
        <div className="flex flex-col gap-3">
          {banners.map((product) => (
            <ProductBannerCard key={product.id} profileId={profileId} product={product} />
          ))}
        </div>
      ) : null}

      {gridItems.length > 0 ? (
        <div
          className={cn(
            "grid w-full min-w-0 gap-3",
            gridItems.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {gridItems.map((product) => (
            <ProductCard
              key={product.id}
              profileId={profileId}
              product={product}
              className={cn(
                "min-w-0",
                gridItems.length === 1 && "mx-auto w-full max-w-xs sm:max-w-sm",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Mini storefront: thanh danh mục + sản phẩm dạng banner (Shopee) hoặc lưới (ảnh thường).
 */
export function ProductStore({
  profileId,
  products,
  categories = [],
}: {
  profileId: string;
  products: PublicProduct[];
  categories?: PublicProductCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const groups = useMemo(
    () =>
      categories.length > 0
        ? groupProductsByCategory(products, categories)
        : [{ key: "all", label: null, products }],
    [products, categories],
  );

  const navItems = useMemo(() => buildCategoryNav(products, categories), [products, categories]);
  const showNav = categories.length > 0;

  const visibleGroups = useMemo(() => {
    if (activeCategory === "all") return groups;
    const selected = navItems.find((item) => item.key === activeCategory);
    if (selected && selected.count === 0) return [];
    return groups.filter((g) => g.key === activeCategory);
  }, [activeCategory, groups, navItems]);

  if (!products.length) return null;

  return (
    <section aria-label="Cửa hàng" className="flex w-full min-w-0 flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Sản phẩm</h2>
        <span className="text-xs text-muted-foreground">{products.length} mặt hàng</span>
      </div>

      {showNav ? (
        <nav
          aria-label="Danh mục sản phẩm"
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Button
            type="button"
            size="sm"
            variant={activeCategory === "all" ? "default" : "outline"}
            className="shrink-0 rounded-full"
            onClick={() => setActiveCategory("all")}
          >
            Tất cả
          </Button>
          {navItems.map((item) => (
            <Button
              key={item.key}
              type="button"
              size="sm"
              variant={activeCategory === item.key ? "default" : "outline"}
              className="shrink-0 rounded-full"
              onClick={() => setActiveCategory(item.key)}
            >
              {item.label}
              <span className="text-xs opacity-70">({item.count})</span>
            </Button>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-col gap-6">
        {visibleGroups.map((group) => (
          <ProductGroupSection
            key={group.key}
            profileId={profileId}
            group={group}
            showHeading={showNav && activeCategory === "all"}
          />
        ))}

        {visibleGroups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có sản phẩm trong danh mục này.
          </p>
        ) : null}
      </div>
    </section>
  );
}
