import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BioLiveTemplate } from "@/components/bio/bio-live-template";
import { BioTracker } from "@/components/bio/bio-tracker";
import { getBioStyle, getBioTheme } from "@/components/bio/theme";
import type { PublicProfilePayload } from "@/components/bio/types";
import { createPublicClient } from "@/lib/supabase/public";
import { cn } from "@/lib/utils";

// ISR: trang public phục vụ qua CDN, revalidate nền mỗi 60s.
export const revalidate = 60;

type PageProps = { params: Promise<{ username: string }> };

/** Segment đến từ URL `/@john` → param "@john". Bắt buộc có tiền tố "@". */
function parseUsername(raw: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  if (!decoded.startsWith("@")) return null;
  const username = decoded.slice(1).trim().toLowerCase();
  return username.length ? username : null;
}

/**
 * 1 round-trip qua RPC. Bọc `unstable_cache` với tag `profile:<username>` để Agent 6
 * gọi `revalidateTag` on-demand khi user sửa nội dung. `cache()` dedupe trong 1 request
 * (generateMetadata + page dùng chung).
 */
const loadProfile = cache((username: string) =>
  unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase.rpc("get_public_profile", {
        p_username: username,
      });
      if (error || !data) return null;
      const payload = data as PublicProfilePayload;
      return payload.profile ? payload : null;
    },
    ["public-profile", username],
    { revalidate: 60, tags: [`profile:${username}`] },
  )(),
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: raw } = await params;
  const username = parseUsername(raw);
  if (!username) return { title: "Không tìm thấy trang", robots: { index: false, follow: false } };

  const payload = await loadProfile(username);
  if (!payload) return { title: "Không tìm thấy trang", robots: { index: false, follow: false } };

  const { profile } = payload;
  const title = profile.display_name?.trim() || `@${profile.username}`;
  const description =
    profile.bio?.trim() || `Trang link cá nhân của @${profile.username} trên Bio.`;
  const url = `/@${profile.username}`;
  const images = profile.avatar_url ? [{ url: profile.avatar_url }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      title,
      description,
      url,
      images,
    },
    twitter: {
      card: images ? "summary" : "summary_large_image",
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function PublicBioPage({ params }: PageProps) {
  const { username: raw } = await params;
  const username = parseUsername(raw);
  if (!username) notFound();

  const payload = await loadProfile(username);
  if (!payload) notFound();

  const { profile, links, banners = [], categories = [], pinned, products } = payload;

  return (
    <main
      className={cn(
        "min-h-svh w-full",
        getBioTheme(profile.theme),
        getBioStyle(profile.layout),
      )}
    >
      <BioTracker profileId={profile.id} />
      <BioLiveTemplate
        username={username}
        profile={profile}
        links={links}
        banners={banners}
        categories={categories}
        pinned={pinned}
        products={products}
      />
    </main>
  );
}
