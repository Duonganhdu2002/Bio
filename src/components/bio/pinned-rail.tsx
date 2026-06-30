import { ProductBannerCard } from "./product-banner-card";
import { ProductCard } from "./product-card";
import { isImportedScreenshot } from "./product-utils";
import type { PublicPinnedProduct } from "./types";

/**
 * Dải sản phẩm ghim (≤3) — banner ngang cho ảnh Shopee, lưới cho ảnh thường.
 */
export function PinnedRail({
  profileId,
  pinned,
}: {
  profileId: string;
  pinned: PublicPinnedProduct[];
}) {
  const items = pinned.slice(0, 3);
  if (!items.length) return null;

  const allImported = items.every((p) => isImportedScreenshot(p.image_url));

  return (
    <section aria-label="Nổi bật" className="flex w-full min-w-0 flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">Nổi bật</h2>
      <div
        className={
          allImported || items.length === 1
            ? "flex flex-col gap-3"
            : items.length === 2
              ? "grid w-full min-w-0 grid-cols-2 gap-3"
              : "grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-3"
        }
      >
        {items.map((product) =>
          isImportedScreenshot(product.image_url) ? (
            <ProductBannerCard
              key={product.id}
              profileId={profileId}
              product={product}
              pinned
            />
          ) : (
            <ProductCard
              key={product.id}
              profileId={profileId}
              product={product}
              pinned
              className="min-w-0"
            />
          ),
        )}
      </div>
    </section>
  );
}
