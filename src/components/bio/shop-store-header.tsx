import Image from "next/image";

import { PlatformIcon } from "./platform";
import type { PublicLink, PublicProfile } from "./types";

const MAX_VISIBLE_LINKS = 3;

function initials(profile: PublicProfile) {
  const base = (profile.display_name ?? profile.username).trim();
  if (!base) return "?";
  const parts = base.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-base font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Header kiểu Instagram: avatar trái, thống kê phải, tên + bio + link trong mô tả.
 */
export function ShopStoreHeader({
  profile,
  productCount,
  linkCount,
  categoryCount,
  links = [],
}: {
  profile: PublicProfile;
  productCount: number;
  linkCount: number;
  categoryCount: number;
  links?: PublicLink[];
}) {
  const name = profile.display_name?.trim() || `@${profile.username}`;

  return (
    <header data-slot="shop-header" className="px-4 pb-3 pt-4">
      <div className="flex items-center gap-5">
        <div className="relative size-[77px] shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-black/10">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={`Avatar ${name}`}
              width={77}
              height={77}
              priority
              sizes="77px"
              className="size-[77px] object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xl font-semibold text-muted-foreground">
              {initials(profile)}
            </div>
          )}
        </div>

        <div className="grid flex-1 grid-cols-3 gap-2">
          <ProfileStat value={productCount} label="sản phẩm" />
          <ProfileStat value={linkCount} label="liên kết" />
          <ProfileStat value={categoryCount} label="danh mục" />
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <h1 className="text-sm font-semibold text-foreground">{name}</h1>
        <p className="text-xs text-muted-foreground">@{profile.username}</p>
        {profile.bio ? (
          <p className="whitespace-pre-line pt-0.5 text-sm leading-snug text-foreground">
            {profile.bio}
          </p>
        ) : null}
        {links.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            {links.slice(0, MAX_VISIBLE_LINKS).map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border border-dashed border-foreground px-2.5 py-1 text-xs font-medium text-foreground outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <PlatformIcon platform={link.platform} className="size-3.5 shrink-0" />
                <span className="truncate">{link.title}</span>
              </a>
            ))}
            {links.length > MAX_VISIBLE_LINKS ? (
              <span
                className="inline-flex shrink-0 items-center rounded-full border border-dashed border-foreground px-2.5 py-1 text-xs font-medium text-foreground"
                aria-label={`${links.length - MAX_VISIBLE_LINKS} liên kết khác`}
              >
                +{links.length - MAX_VISIBLE_LINKS}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
