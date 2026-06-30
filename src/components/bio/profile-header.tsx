import Image from "next/image";

import { cn } from "@/lib/utils";
import type { PublicProfile } from "./types";

function initials(profile: PublicProfile) {
  const base = (profile.display_name ?? profile.username).trim();
  if (!base) return "?";
  const parts = base.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/**
 * Đầu trang bio: avatar (next/image priority, kích thước cố định chống CLS)
 * + tên hiển thị + mô tả. Render tĩnh hoàn toàn (RSC).
 */
export function ProfileHeader({
  profile,
  align = "center",
}: {
  profile: PublicProfile;
  align?: "center" | "start";
}) {
  const name = profile.display_name?.trim() || `@${profile.username}`;

  return (
    <header
      data-slot="bio-header"
      className={cn(
        "flex flex-col gap-3",
        align === "start" ? "items-start text-left" : "items-center text-center",
      )}
    >
      <div
        data-slot="bio-avatar"
        className="relative size-24 overflow-hidden rounded-full bg-muted ring-2 ring-border"
      >
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={`Ảnh đại diện của ${name}`}
            width={96}
            height={96}
            priority
            sizes="96px"
            className="size-24 object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
            {initials(profile)}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h1
          data-slot="bio-name"
          className="font-heading text-xl font-semibold tracking-tight text-foreground"
        >
          {name}
        </h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
      </div>

      {profile.bio ? (
        <p className="max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground">
          {profile.bio}
        </p>
      ) : null}
    </header>
  );
}
