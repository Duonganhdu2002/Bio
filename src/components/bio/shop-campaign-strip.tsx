"use client";

import Image from "next/image";

import { BANNER_SECTIONS } from "@/lib/banner-section";
import { cn } from "@/lib/utils";
import { ShopSectionHeader } from "./shop-section-header";
import type { PublicBanner } from "./types";

function CampaignCard({ banner }: { banner: PublicBanner }) {
  const content = (
    <>
      <div className="relative aspect-[5/3] w-full overflow-hidden rounded-2xl bg-muted">
        <Image
          src={banner.image_url}
          alt={banner.name}
          fill
          className="object-cover"
          sizes="176px"
        />
      </div>
      <p className="mt-2 line-clamp-2 px-0.5 text-[13px] leading-snug text-foreground">
        {banner.name}
      </p>
    </>
  );

  const className = cn(
    "block w-44 shrink-0",
    banner.url && "transition-opacity hover:opacity-80",
  );

  if (banner.url) {
    return (
      <a
        href={banner.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={cn(className, "outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2")}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

function BrandCard({
  banner,
  onSelect,
}: {
  banner: PublicBanner;
  onSelect?: (brandId: string) => void;
}) {
  const content = (
    <>
      <div className="relative mx-auto size-20 overflow-hidden rounded-full border border-border/60 bg-muted">
        <Image
          src={banner.image_url}
          alt={banner.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      <p className="mt-2 line-clamp-2 text-center text-[13px] leading-snug text-foreground">
        {banner.name}
      </p>
    </>
  );

  return (
    <button
      type="button"
      onClick={() => onSelect?.(banner.id)}
      className={cn(
        "block w-24 shrink-0 text-left transition-opacity hover:opacity-80",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
      )}
    >
      {content}
    </button>
  );
}

function BannerScrollSection({
  title,
  banners,
  ariaLabel,
  first,
  variant = "campaign",
  onBrandSelect,
}: {
  title: string;
  banners: PublicBanner[];
  ariaLabel: string;
  first?: boolean;
  variant?: "campaign" | "brand";
  onBrandSelect?: (brandId: string) => void;
}) {
  if (!banners.length) return null;

  return (
    <section aria-label={ariaLabel} className="pb-2">
      <ShopSectionHeader title={title} className={first ? "pt-2" : undefined} />
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {banners.map((banner) =>
          variant === "brand" ? (
            <BrandCard key={banner.id} banner={banner} onSelect={onBrandSelect} />
          ) : (
            <CampaignCard key={banner.id} banner={banner} />
          ),
        )}
      </div>
    </section>
  );
}

function sortBanners(items: PublicBanner[]) {
  return [...items].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

/** Banner cuộn ngang tối giản — Gợi ý + Brand. */
export function ShopCampaignStrip({
  banners,
  onBrandSelect,
}: {
  banners: PublicBanner[];
  onBrandSelect?: (brandId: string) => void;
}) {
  const forYou = sortBanners(banners.filter((b) => !b.section || b.section === "for_you"));
  const brand = sortBanners(banners.filter((b) => b.section === "brand"));

  if (!forYou.length && !brand.length) return null;

  const forYouMeta = BANNER_SECTIONS.find((s) => s.value === "for_you")!;
  const brandMeta = BANNER_SECTIONS.find((s) => s.value === "brand")!;

  return (
    <>
      <BannerScrollSection
        title={forYouMeta.shopTitle}
        banners={forYou}
        ariaLabel={forYouMeta.shopTitle}
        first
      />
      <BannerScrollSection
        title={brandMeta.shopTitle}
        banners={brand}
        ariaLabel={brandMeta.shopTitle}
        first={!forYou.length}
        variant="brand"
        onBrandSelect={onBrandSelect}
      />
    </>
  );
}
