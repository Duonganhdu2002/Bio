import type { NextConfig } from "next";
import path from "node:path";

// Host của Supabase Storage suy từ env để chỉ cho phép tối ưu ảnh từ đúng project.
const supabaseHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  // Ghim workspace root về đúng thư mục project. Nếu không, Next suy luận nhầm
  // root là D:\Bio (do lockfile lạ) và Turbopack sẽ watch/scan cả cây D:\Bio,
  // bao gồm project anh em D:\Bio\CODE (node_modules + .next) -> ngốn RAM khi compile.
  turbopack: {
    root: path.join(__dirname),
  },
  // React Compiler chạy qua Babel trên từng file -> rất tốn RAM/CPU khi dev.
  // Chỉ bật ở production build, dev nhẹ hơn nhiều.
  reactCompiler: process.env.NODE_ENV === "production",
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // Ưu tiên AVIF rồi WebP để giảm byte ảnh (avatar/sản phẩm) trên trang public.
    formats: ["image/avif", "image/webp"],
    // Chỉ tối ưu ảnh public từ Supabase Storage (avatar + ảnh sản phẩm tự upload).
    // KHÔNG mở `hostname: "**"`: tránh biến `/_next/image` thành open proxy (SSRF/đốt băng thông).
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname ?? "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Trang public /@username phục vụ qua ISR + CDN: cho phép cache lâu, revalidate nền
        source: "/@:username",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Endpoint tracking không bao giờ được cache
        source: "/api/track",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
