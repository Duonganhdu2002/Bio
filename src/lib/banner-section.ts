export type BannerSection = "for_you" | "brand";

export const BANNER_SECTIONS: {
  value: BannerSection;
  label: string;
  shopTitle: string;
  description: string;
}[] = [
  {
    value: "for_you",
    label: "Gợi ý",
    shopTitle: "Gợi ý",
    description: "Banner chiến dịch, gợi ý trên tab Shop.",
  },
  {
    value: "brand",
    label: "Brand",
    shopTitle: "Brand",
    description: "Banner thương hiệu, đối tác.",
  },
];

export function bannerSectionLabel(section: BannerSection): string {
  return BANNER_SECTIONS.find((s) => s.value === section)?.label ?? section;
}
