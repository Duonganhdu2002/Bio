"use client";

import Image from "next/image";

import { BANNER_SECTIONS } from "@/lib/banner-section";
import { trackClick } from "@/lib/analytics/track-client";
import { cn } from "@/lib/utils";
import { ShopSectionHeader } from "./shop-section-header";
import type { PublicBanner } from "./types";

function CampaignCard({
  banner,
  profileId,
}: {
  banner: PublicBanner;
  profileId: string;
}) {
  const content = (
    <>
      <div className="relative aspect-[5/3] w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={banner.image_url}
          alt={banner.name}
          fill
          className="object-cover"
          sizes="128px"
        />
      </div>
      <p className="mt-1.5 line-clamp-2 px-0.5 text-[11px] leading-snug text-secondary-foreground/90">
        {banner.name}
      </p>
    </>
  );

  const className = cn(
    "block w-32 shrink-0",
    banner.url && "transition-opacity hover:opacity-80",
  );

  if (banner.url) {
    return (
      <a
        href={banner.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={() => trackClick(profileId, "banner", banner.id)}
        onAuxClick={() => trackClick(profileId, "banner", banner.id)}
        className={cn(
          className,
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
        )}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

function BrandCard({
  banner,
  profileId,
  onSelect,
}: {
  banner: PublicBanner;
  profileId: string;
  onSelect?: (brandId: string) => void;
}) {
  const content = (
    <>
      <div className="relative mx-auto size-14 overflow-hidden rounded-full border border-border/60 bg-muted">
        <Image
          src={banner.image_url}
          alt={banner.name}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
      <p className="mt-1 line-clamp-2 text-center text-[11px] leading-snug text-secondary-foreground/90">
        {banner.name}
      </p>
    </>
  );

  return (
    <button
      type="button"
      onClick={() => {
        trackClick(profileId, "banner", banner.id);
        onSelect?.(banner.id);
      }}
      className={cn(
        "block w-[4.25rem] shrink-0 text-left transition-opacity hover:opacity-80",
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
  profileId,
  ariaLabel,
  first,
  variant = "campaign",
  onBrandSelect,
}: {
  title: string;
  banners: PublicBanner[];
  profileId: string;
  ariaLabel: string;
  first?: boolean;
  variant?: "campaign" | "brand";
  onBrandSelect?: (brandId: string) => void;
}) {
  if (!banners.length) return null;

  return (
    <section aria-label={ariaLabel} className="pb-1">
      <ShopSectionHeader
        title={title}
        className={cn("pb-2", first ? "pt-2" : "pt-3")}
      />
      <div className="flex gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {banners.map((banner) =>
          variant === "brand" ? (
            <BrandCard
              key={banner.id}
              banner={banner}
              profileId={profileId}
              onSelect={onBrandSelect}
            />
          ) : (
            <CampaignCard key={banner.id} banner={banner} profileId={profileId} />
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
  profileId,
  banners,
  onBrandSelect,
}: {
  profileId: string;
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
        profileId={profileId}
        ariaLabel={forYouMeta.shopTitle}
        first
      />
      <BannerScrollSection
        title={brandMeta.shopTitle}
        banners={brand}
        profileId={profileId}
        ariaLabel={brandMeta.shopTitle}
        first={!forYou.length}
        variant="brand"
        onBrandSelect={onBrandSelect}
      />
    </>
  );
}
