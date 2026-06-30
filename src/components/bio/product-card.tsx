"use client";

import Image from "next/image";
import { ShoppingBag, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { trackClick } from "@/lib/analytics/track-client";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "./price";
import { cleanProductDescription } from "./product-utils";

/** Shape tối thiểu cho thẻ — phủ cả PublicProduct lẫn PublicPinnedProduct. */
type ProductCardData = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
};

/**
 * Thẻ sản phẩm dạng lưới cho ảnh thường (vuông). Ảnh Shopee import dùng ProductBannerCard.
 */
export function ProductCard({
  profileId,
  product,
  pinned = false,
  className,
}: {
  profileId: string;
  product: ProductCardData;
  pinned?: boolean;
  className?: string;
}) {
  const price = formatPrice(product.price_cents, product.currency);
  const description = cleanProductDescription(product.title, product.description);

  const inner = (
    <>
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, 220px"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="size-8" aria-hidden />
          </div>
        )}
        {pinned ? (
          <Badge className="absolute top-2 left-2 gap-1 shadow-sm">
            <Sparkles className="size-3" aria-hidden />
            Nổi bật
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-card-foreground">{product.title}</h3>
        {description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
        ) : null}
        {price ? (
          <p className="mt-auto pt-1 text-sm font-semibold text-foreground">{price}</p>
        ) : null}
      </div>
    </>
  );

  const baseClass = cn(
    "group flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-transform duration-150",
    product.url && "hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50",
    className,
  );

  if (!product.url) {
    return (
      <div data-slot="card" className={baseClass}>
        {inner}
      </div>
    );
  }

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={() => trackClick(profileId, "product", product.id)}
      onAuxClick={() => trackClick(profileId, "product", product.id)}
      data-slot="card"
      className={cn(baseClass, "outline-none")}
    >
      {inner}
    </a>
  );
}
