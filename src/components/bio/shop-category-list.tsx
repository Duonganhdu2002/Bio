"use client";

import { ChevronRight } from "lucide-react";

import { BANNER_SECTIONS } from "@/lib/banner-section";
import { CATEGORY_SECTIONS } from "@/lib/category-section";
import { ShopSectionHeader } from "./shop-section-header";
import type { PublicProductCategory } from "./types";

type NavItem = { key: string; label: string; count: number };

function CategoryRows({
  items,
  onSelect,
}: {
  items: NavItem[];
  onSelect: (key: string) => void;
}) {
  if (!items.length) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">Chưa có danh mục nào.</p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {items.map((item) => (
        <li key={item.key}>
          <button
            type="button"
            onClick={() => onSelect(item.key)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-secondary-foreground">{item.label}</span>
              <span className="block text-xs text-muted-foreground">{item.count} sản phẩm</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
              {item.count}
              <ChevronRight className="size-4" aria-hidden />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ShopCategoryList({
  productNavItems,
  brandNavItems,
  onSelect,
}: {
  categories: PublicProductCategory[];
  productNavItems: NavItem[];
  brandNavItems: NavItem[];
  onSelect: (key: string) => void;
}) {
  const hasAny = productNavItems.length > 0 || brandNavItems.length > 0;

  if (!hasAny) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">Chưa có danh mục nào.</p>
    );
  }

  const productMeta = CATEGORY_SECTIONS.find((s) => s.value === "product")!;
  const brandMeta = BANNER_SECTIONS.find((s) => s.value === "brand")!;

  return (
    <div className="pb-2">
      <section aria-label={productMeta.shopTitle}>
        <ShopSectionHeader title={productMeta.shopTitle} className="pt-2 pb-2" />
        <CategoryRows items={productNavItems} onSelect={onSelect} />
      </section>

      <section aria-label={brandMeta.shopTitle} className="mt-2 border-t border-border/40">
        <ShopSectionHeader title={brandMeta.shopTitle} className="pb-2" />
        <CategoryRows items={brandNavItems} onSelect={onSelect} />
      </section>
    </div>
  );
}
