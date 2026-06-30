import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAppBaseUrl } from "@/lib/site-url";

// Origin Supabase (ảnh storage + REST) để preconnect, giảm RTT lần fetch ảnh đầu tiên.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return null;
  }
})();

const roboto = Roboto({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const robotoMono = Roboto_Mono({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500"],
  variable: "--font-roboto-mono",
  display: "swap",
  preload: true,
});

const siteName = "Bio";
const defaultTitle = "Bio — trang link cá nhân của bạn";
const description =
  "Bio là nền tảng link-in-bio giúp bạn gom mọi liên kết, mạng xã hội và sản phẩm vào một trang duy nhất tại /@username. Ghim sản phẩm nổi bật, theo dõi lượt xem và lượt click theo thời gian.";

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: defaultTitle,
    template: `%s · ${siteName}`,
  },
  description,
  keywords: [
    "Bio",
    "link in bio",
    "link-in-bio",
    "trang link cá nhân",
    "linktree tiếng Việt",
    "gom link mạng xã hội",
    "bán hàng qua link",
    "ghim sản phẩm",
    "thống kê lượt click",
    "creator",
    "KOL KOC",
  ],
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName,
    title: defaultTitle,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={cn("antialiased", roboto.variable, robotoMono.variable, "font-sans")}
    >
      <body className="min-h-svh font-sans">
        {supabaseOrigin ? (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        ) : null}
        <TooltipProvider delay={0}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
