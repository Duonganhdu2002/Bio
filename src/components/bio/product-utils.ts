import type { CategorySection } from "@/lib/category-section";
import { normalizeCategorySection } from "@/lib/category-section";
import type { PublicBanner, PublicProduct, PublicProductCategory } from "./types";

/** Shape tối thiểu cho thẻ sản phẩm public. */
export type ProductCardData = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
};

export function isImportedScreenshot(url: string | null): boolean {
  return Boolean(url?.includes(".import."));
}

export function cleanProductDescription(
  title: string,
  description: string | null,
): string | null {
  if (!description?.trim()) return null;
  if (description.trim().toLowerCase() === title.trim().toLowerCase()) return null;
  return description;
}

export type ProductGroup = {
  key: string;
  label: string | null;
  products: PublicProduct[];
};

export function groupProductsByCategory(
  products: PublicProduct[],
  categories: PublicProductCategory[],
  section?: CategorySection,
): ProductGroup[] {
  const scopedCategories = section
    ? categories.filter((c) => normalizeCategorySection(c.section) === section)
    : categories;
  const sortedCategories = [...scopedCategories].sort(
    (a, b) => a.position - b.position || a.name.localeCompare(b.name),
  );
  const categoryKey = section === "brand" ? "brand_id" : "category_id";
  const groups: ProductGroup[] = sortedCategories.map((c) => ({
    key: c.id,
    label: c.name,
    products: products.filter((p) => p[categoryKey] === c.id),
  }));

  if (section && section !== "product") {
    return groups.filter((g) => g.products.length > 0);
  }

  const productCategoryIds = new Set(
    categories
      .filter((c) => normalizeCategorySection(c.section) === "product")
      .map((c) => c.id),
  );
  const uncategorized = products.filter(
    (p) => !p.category_id || !productCategoryIds.has(p.category_id),
  );
  if (uncategorized.length > 0) {
    groups.push({ key: "none", label: "Khác", products: uncategorized });
  }

  return groups.filter((g) => g.products.length > 0);
}

export function buildBrandNav(
  products: PublicProduct[],
  banners: PublicBanner[],
): { key: string; label: string; count: number }[] {
  const brandBanners = banners
    .filter((b) => (b.section ?? "for_you") === "brand")
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));

  return brandBanners
    .map((b) => ({
      key: b.id,
      label: b.name,
      count: products.filter((p) => p.brand_id === b.id).length,
    }))
    .filter((item) => item.count > 0);
}

export function buildCategoryNav(
  products: PublicProduct[],
  categories: PublicProductCategory[],
  section?: CategorySection,
): { key: string; label: string; count: number }[] {
  const scopedCategories = section
    ? categories.filter((c) => normalizeCategorySection(c.section) === section)
    : categories;

  if (!scopedCategories.length && section !== "product") return [];

  const sorted = [...scopedCategories].sort(
    (a, b) => a.position - b.position || a.name.localeCompare(b.name),
  );

  const navItems = sorted.map((c) => ({
    key: c.id,
    label: c.name,
    count: products.filter((p) => p.category_id === c.id).length,
  }));

  if (!section || section === "product") {
    const productCategoryIds = new Set(
      categories
        .filter((c) => normalizeCategorySection(c.section) === "product")
        .map((c) => c.id),
    );
    const uncategorizedCount = products.filter(
      (p) => !p.category_id || !productCategoryIds.has(p.category_id),
    ).length;

    if (uncategorizedCount > 0) {
      navItems.push({ key: "none", label: "Khác", count: uncategorizedCount });
    }
  }

  return navItems;
}
