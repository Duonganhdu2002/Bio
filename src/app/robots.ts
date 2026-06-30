import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getAppBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Khu vực riêng tư / không có giá trị index.
      disallow: ["/dashboard", "/api", "/auth", "/login", "/signup"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
