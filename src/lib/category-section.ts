export type CategorySection = "product" | "brand";

export const CATEGORY_SECTIONS: {
  value: CategorySection;
  label: string;
  shopTitle: string;
  description: string;
}[] = [
  {
    value: "product",
    label: "Danh mục sản phẩm",
    shopTitle: "Danh mục sản phẩm",
    description: "Nhóm sản phẩm thường trên tab Danh mục.",
  },
  {
    value: "brand",
    label: "Danh mục brand",
    shopTitle: "Danh mục brand",
    description: "Nhóm sản phẩm thương hiệu trên tab Danh mục.",
  },
];

export function categorySectionLabel(section: CategorySection | null | undefined): string {
  return CATEGORY_SECTIONS.find((s) => s.value === (section ?? "product"))?.label ?? section ?? "";
}

export function normalizeCategorySection(section: string | null | undefined): CategorySection {
  return section === "brand" ? "brand" : "product";
}
