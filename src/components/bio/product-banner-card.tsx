"use client";

import Image from "next/image";
import { ShoppingBag, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { trackClick } from "@/lib/analytics/track-client";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "./price";
import {
  cleanProductDescription,
  isImportedScreenshot,
  type ProductCardData,
} from "./product-utils";

/**
 * Thẻ banner ngang cho ảnh Shopee import — tỷ lệ rộng, object-contain, không xén.
 */
export function ProductBannerCard({
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
  const imported = isImportedScreenshot(product.image_url);

  const inner = (
    <>
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden bg-muted",
          imported ? "aspect-[2/1]" : "aspect-[16/10]",
        )}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className={cn(
              "transition-transform duration-200 group-hover:scale-[1.02]",
              imported ? "object-contain" : "object-cover",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="size-10" aria-hidden />
          </div>
        )}
        {pinned ? (
          <Badge className="absolute top-2.5 left-2.5 gap-1 shadow-sm">
            <Sparkles className="size-3" aria-hidden />
            Nổi bật
          </Badge>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3 border-t border-border p-3.5">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-sm font-medium text-card-foreground">{product.title}</h3>
          {description ? (
            <p className="line-clamp-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {price ? (
          <p className="shrink-0 text-sm font-semibold text-primary">{price}</p>
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
