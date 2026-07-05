import type { ReactNode } from "react";

import { ShopProductTile } from "./shop-product-tile";
import { ShopSectionHeader } from "./shop-section-header";
import type { ProductCardData } from "./product-utils";
import { cn } from "@/lib/utils";

/** Một hàng sản phẩm cuộn ngang — dùng cho nổi bật, brand, top bán chạy. */
export function ShopProductScrollSection({
  title,
  action,
  profileId,
  products,
  ariaLabel,
  className,
  headerClassName,
  pinned = false,
}: {
  title: string;
  action?: ReactNode;
  profileId: string;
  products: ProductCardData[];
  ariaLabel?: string;
  className?: string;
  headerClassName?: string;
  pinned?: boolean;
}) {
  if (!products.length) return null;

  return (
    <section aria-label={ariaLabel ?? title} className={cn("pb-1", className)}>
      <ShopSectionHeader title={title} action={action} className={headerClassName} />
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <ShopProductTile
            key={product.id}
            profileId={profileId}
            product={product}
            variant="scroll"
            pinned={pinned}
          />
        ))}
      </div>
    </section>
  );
}
