import { ProductStore } from "./product-store";
import type { PublicProduct, PublicProductCategory } from "./types";

export function ProductGrid({
  profileId,
  products,
  categories = [],
}: {
  profileId: string;
  products: PublicProduct[];
  categories?: PublicProductCategory[];
}) {
  return (
    <ProductStore profileId={profileId} products={products} categories={categories} />
  );
}
