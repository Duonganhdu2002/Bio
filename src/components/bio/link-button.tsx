"use client";

import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { trackClick } from "@/lib/analytics/track-client";
import { PlatformIcon } from "./platform";
import type { PublicLink } from "./types";

/**
 * Nút link full-width cho trang public. Tap target lớn (≥56px), icon theo
 * platform. Click bắn tracking (sendBeacon) trước khi mở tab mới.
 */
export function LinkButton({
  profileId,
  link,
}: {
  profileId: string;
  link: PublicLink;
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={() => trackClick(profileId, "link", link.id)}
      onAuxClick={() => trackClick(profileId, "link", link.id)}
      data-slot="bio-link"
      className={cn(
        "group flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-card-foreground shadow-sm transition-transform duration-150 outline-none hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground [&_svg]:size-4.5">
        <PlatformIcon platform={link.platform} />
      </span>
      <span className="min-w-0 flex-1 truncate text-center text-sm font-medium">
        {link.title}
      </span>
      <ArrowUpRight
        className="size-4 shrink-0 text-muted-foreground transition-opacity group-hover:opacity-100 sm:opacity-0"
        aria-hidden
      />
    </a>
  );
}
