export const queryKeys = {
  profile: ["profile"] as const,
  links: ["links"] as const,
  banners: ["banners"] as const,
  products: ["products"] as const,
  productCategories: ["product-categories"] as const,
  analytics: (range: string) => ["analytics", range] as const,
  publicProfile: (username: string) => ["public-profile", username] as const,
};
