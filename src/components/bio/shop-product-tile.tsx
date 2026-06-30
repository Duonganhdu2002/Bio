"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { trackClick } from "@/lib/analytics/track-client";
import { formatPrice } from "./price";
import { isImportedScreenshot, type ProductCardData } from "./product-utils";

type ShopProductTileProps = {
  profileId: string;
  product: ProductCardData;
  variant?: "grid" | "scroll";
  pinned?: boolean;
};

/**
 * Ô sản phẩm compact: banner chữ nhật (vừa ảnh Shopee import) + tên + giá.
 */
export function ShopProductTile({
  profileId,
  product,
  variant = "grid",
  pinned = false,
}: ShopProductTileProps) {
  const price = formatPrice(product.price_cents, product.currency);
  const imported = isImportedScreenshot(product.image_url);

  const isScroll = variant === "scroll";

  const content = (
    <>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          isScroll ? "aspect-[5/3] rounded-2xl" : "rounded-xl",
          !isScroll && (imported ? "aspect-[5/3]" : "aspect-[4/3]"),
        )}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes={isScroll ? "176px" : "(max-width: 640px) 50vw, 240px"}
            className={cn(imported ? "object-contain" : "object-cover")}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="size-6" aria-hidden />
          </div>
        )}
        {pinned ? (
          <span className="absolute top-2 left-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            Nổi bật
          </span>
        ) : null}
      </div>

      <div className={cn(isScroll ? "mt-2.5 space-y-0.5 px-0.5" : "space-y-1 p-2.5")}>
        <h3
          className={cn(
            "line-clamp-2 text-foreground",
            isScroll ? "text-[13px] leading-snug" : "min-h-8 text-xs leading-snug",
          )}
        >
          {product.title}
        </h3>
        {price ? (
          <p
            className={cn(
              isScroll ? "text-[13px] text-muted-foreground" : "text-sm font-semibold text-foreground",
            )}
          >
            {price}
          </p>
        ) : isScroll ? null : (
          <p className="text-xs text-muted-foreground">Xem chi tiết</p>
        )}
      </div>
    </>
  );

  const baseClass = cn(
    "group block min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
    isScroll
      ? "w-44 shrink-0"
      : "overflow-hidden rounded-xl border border-border/60 bg-card",
    product.url && (isScroll ? "transition-opacity hover:opacity-80" : "transition-opacity hover:opacity-90"),
  );

  if (!product.url) {
    return <div className={baseClass}>{content}</div>;
  }

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={() => trackClick(profileId, "product", product.id)}
      onAuxClick={() => trackClick(profileId, "product", product.id)}
      data-slot="shop-product-tile"
      className={cn(baseClass, "outline-none focus-visible:ring-2 focus-visible:ring-ring/50")}
    >
      {content}
    </a>
  );
}
