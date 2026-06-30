import { Link2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { BioTemplateKey } from "./theme";

/* ── Wireframe primitives (thumbnail picker) ───────────────────────── */

function WfBar({ className }: { className?: string }) {
  return <span className={cn("block rounded-full bg-foreground/20", className)} />;
}

function WfDot({ className }: { className?: string }) {
  return <span className={cn("block rounded-full bg-primary", className)} />;
}

function WfBox({ className }: { className?: string }) {
  return <span className={cn("block rounded-md border border-border/80 bg-foreground/[0.06]", className)} />;
}

/** Minh hoạ bố cục trong ô chọn template. */
export function TemplateThumb({ template }: { template: BioTemplateKey }) {
  switch (template) {
    case "spotlight":
      return (
        <span className="flex h-full w-full flex-col overflow-hidden">
          <span className="h-[38%] w-full bg-primary/25" />
          <span className="flex flex-1 flex-col items-center gap-1 px-2 pt-0">
            <WfDot className="-mt-2.5 size-4 ring-2 ring-card" />
            <WfBar className="h-1.5 w-[85%]" />
            <WfBar className="h-1.5 w-[70%]" />
          </span>
        </span>
      );
    case "grid":
      return (
        <span className="flex h-full w-full flex-col items-center gap-1.5 px-2 py-2">
          <WfDot className="size-3.5" />
          <span className="grid w-full flex-1 grid-cols-2 gap-1">
            <WfBox className="h-full min-h-7" />
            <WfBox className="h-full min-h-7" />
            <WfBox className="h-full min-h-7" />
            <WfBox className="h-full min-h-7" />
          </span>
        </span>
      );
    case "sidebar":
      return (
        <span className="flex h-full w-full gap-1.5 px-2 py-2">
          <span className="flex w-[34%] flex-col items-start gap-1">
            <WfDot className="size-4" />
            <WfBar className="h-1 w-full" />
            <WfBar className="h-1 w-4/5" />
          </span>
          <span className="flex flex-1 flex-col gap-1 pt-0.5">
            <WfBar className="h-2 w-full rounded-md" />
            <WfBar className="h-2 w-full rounded-md" />
            <WfBar className="h-2 w-4/5 rounded-md" />
          </span>
        </span>
      );
    case "showcase":
      return (
        <span className="flex h-full w-full flex-col gap-1 px-2 py-2">
          <span className="grid grid-cols-2 gap-1">
            <WfBox className="aspect-[5/3]" />
            <WfBox className="aspect-[5/3]" />
          </span>
          <span className="grid grid-cols-3 gap-0.5">
            <WfBar className="h-1 rounded-full bg-foreground/35" />
            <WfBar className="h-1" />
            <WfBar className="h-1" />
          </span>
        </span>
      );
    case "magazine":
      return (
        <span className="flex h-full w-full flex-col items-start gap-1 px-2.5 py-2">
          <span className="flex items-center gap-1.5">
            <WfDot className="size-3.5" />
            <WfBar className="h-1.5 w-10" />
          </span>
          <span className="h-px w-full bg-border" />
          <WfBar className="h-1.5 w-full" />
          <WfBar className="h-1.5 w-[88%]" />
        </span>
      );
    case "stack":
    default:
      return (
        <span className="flex h-full w-full flex-col items-center gap-1 px-2 py-2">
          <WfDot className="size-4" />
          <WfBar className="h-2 w-[88%] rounded-lg" />
          <WfBar className="h-2 w-[88%] rounded-lg" />
          <WfBar className="h-2 w-[88%] rounded-lg" />
        </span>
      );
  }
}

/* ── Live preview (dashboard) ──────────────────────────────────────── */

export type TemplatePreviewData = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  initial: string;
};

function PreviewAvatar({
  avatarUrl,
  initial,
  username,
  size = "md",
  className,
}: {
  avatarUrl: string | null;
  initial: string;
  username: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "size-10", md: "size-14", lg: "size-16" };
  return (
    <Avatar className={cn(sizes[size], "ring-2 ring-background", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={username} /> : null}
      <AvatarFallback className="text-xs">{initial}</AvatarFallback>
    </Avatar>
  );
}

function PreviewLinkPill({
  label = "Liên kết của tôi",
  compact,
  className,
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      data-slot="bio-link"
      className={cn(
        "flex items-center gap-2 border border-border bg-card text-xs font-medium text-card-foreground shadow-sm",
        compact ? "min-h-9 rounded-lg px-2.5" : "min-h-11 w-full justify-center rounded-2xl px-3",
        className,
      )}
    >
      <span className="size-3.5 shrink-0 rounded-md bg-primary/90" />
      <span className={compact ? "truncate" : ""}>{label}</span>
    </span>
  );
}

function PreviewCover({ coverUrl }: { coverUrl: string | null }) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverUrl} alt="" className="size-full object-cover" />
    );
  }
  return <div className="size-full bg-gradient-to-br from-primary/80 via-primary/60 to-accent/80" />;
}

function LinktreePreview({ data }: { data: TemplatePreviewData }) {
  const name = data.displayName.trim() || data.username;
  return (
    <div className="flex flex-col items-center gap-3 px-3 py-5 text-center">
      <PreviewAvatar
        avatarUrl={data.avatarUrl}
        initial={data.initial}
        username={data.username}
        size="lg"
      />
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-[11px] text-muted-foreground">@{data.username}</p>
      </div>
      {data.bio.trim() ? (
        <p className="max-w-full text-[11px] leading-snug text-muted-foreground">{data.bio}</p>
      ) : null}
      <div className="mt-1 flex w-full flex-col gap-2">
        <PreviewLinkPill />
        <PreviewLinkPill label="Shop của tôi" />
        <PreviewLinkPill label="Liên hệ" />
      </div>
    </div>
  );
}

function XPreview({ data }: { data: TemplatePreviewData }) {
  const name = data.displayName.trim() || data.username;
  return (
    <div className="flex flex-col">
      <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted">
        <PreviewCover coverUrl={data.coverUrl} />
      </div>
      <div className="-mt-7 flex flex-col items-center gap-2 px-3 pb-4 text-center">
        <PreviewAvatar
          avatarUrl={data.avatarUrl}
          initial={data.initial}
          username={data.username}
          size="md"
          className="ring-4"
        />
        <div>
          <p className="text-sm font-bold">{name}</p>
          <p className="text-[11px] text-muted-foreground">@{data.username}</p>
        </div>
        {data.bio.trim() ? (
          <p className="text-[11px] leading-snug text-muted-foreground">{data.bio}</p>
        ) : null}
        <div className="mt-1 w-full space-y-2">
          <PreviewLinkPill />
          <PreviewLinkPill label="Website" />
        </div>
      </div>
    </div>
  );
}

function PinterestPreview({ data }: { data: TemplatePreviewData }) {
  const name = data.displayName.trim() || data.username;
  const pins = ["Gợi ý món", "Yêu thích", "Mua sắm", "Khám phá"];
  return (
    <div className="flex flex-col gap-3 px-3 py-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <PreviewAvatar
          avatarUrl={data.avatarUrl}
          initial={data.initial}
          username={data.username}
          size="sm"
        />
        <p className="text-xs font-semibold">{name}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {pins.map((pin) => (
          <div key={pin} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="aspect-[3/4] bg-gradient-to-b from-muted to-muted/50" />
            <p className="truncate px-2 py-1.5 text-[10px] font-medium">{pin}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkedInPreview({ data }: { data: TemplatePreviewData }) {
  const name = data.displayName.trim() || data.username;
  return (
    <div className="grid grid-cols-[5.25rem_1fr] gap-3 px-3 py-4">
      <aside className="space-y-2">
        <PreviewAvatar
          avatarUrl={data.avatarUrl}
          initial={data.initial}
          username={data.username}
          size="md"
        />
        <p className="text-[11px] font-semibold leading-tight">{name}</p>
        {data.bio.trim() ? (
          <p className="text-[10px] leading-snug text-muted-foreground">{data.bio}</p>
        ) : null}
      </aside>
      <div className="flex flex-col gap-2 border-l border-border pl-3">
        <PreviewLinkPill compact />
        <PreviewLinkPill compact label="Dự án" />
        <PreviewLinkPill compact label="Bài viết" />
        <div className="mt-1 rounded-lg border border-border bg-muted/40 p-2">
          <div className="h-1.5 w-2/3 rounded-full bg-foreground/15" />
          <div className="mt-1.5 h-1 w-full rounded-full bg-foreground/10" />
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ data }: { data: TemplatePreviewData }) {
  const name = data.displayName.trim() || data.username;
  return (
    <div className="flex flex-col text-[11px]">
      <div className="border-b border-border px-3 py-2 text-center font-semibold">
        @{data.username}
      </div>
      <div className="space-y-3 px-3 py-3">
        <div className="flex items-center gap-4">
          <PreviewAvatar
            avatarUrl={data.avatarUrl}
            initial={data.initial}
            username={data.username}
            size="md"
            className="size-12"
          />
          <div className="grid flex-1 grid-cols-3 gap-1 text-center">
            {[
              { v: "12", l: "sản phẩm" },
              { v: "3", l: "liên kết" },
              { v: "2", l: "danh mục" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-semibold tabular-nums">{s.v}</p>
                <p className="text-[9px] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold">{name}</p>
          {data.bio.trim() ? (
            <p className="mt-0.5 leading-snug text-muted-foreground">{data.bio}</p>
          ) : null}
          <p className="mt-1 flex items-center gap-1 font-semibold text-[#0064D1]">
            <Link2 className="size-3" />
            Liên kết bio
          </p>
        </div>
        <div className="grid grid-cols-3 border-b border-border pb-1">
          <div className="mx-auto h-0.5 w-6 rounded-full bg-foreground" />
          <div className="mx-auto size-3 rounded bg-muted" />
          <div className="mx-auto size-3 rounded bg-muted" />
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-semibold">Nổi bật</p>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2].map((i) => (
              <div key={i} className="w-20 shrink-0">
                <div className="aspect-[5/3] rounded-xl bg-muted" />
                <p className="mt-1 truncate text-[9px] text-muted-foreground">Sản phẩm {i}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadsPreview({ data }: { data: TemplatePreviewData }) {
  const name = data.displayName.trim() || data.username;
  return (
    <div className="space-y-3 px-3 py-4 text-left">
      <div className="flex items-start gap-2.5">
        <PreviewAvatar
          avatarUrl={data.avatarUrl}
          initial={data.initial}
          username={data.username}
          size="sm"
        />
        <div className="min-w-0 pt-0.5">
          <p className="text-xs font-semibold">{name}</p>
          <p className="text-[10px] text-muted-foreground">@{data.username}</p>
        </div>
      </div>
      {data.bio.trim() ? (
        <p className="text-[11px] leading-snug text-foreground">{data.bio}</p>
      ) : null}
      <p className="flex items-center gap-1 text-[11px] font-semibold text-[#0064D1]">
        <Link2 className="size-3.5" />
        link.bio/{data.username}
      </p>
      <hr className="border-border" />
      <div className="space-y-2">
        <PreviewLinkPill compact className="w-full rounded-xl" />
        <PreviewLinkPill compact label="Cửa hàng" className="w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Xem trước chi tiết theo template MXH. */
export function TemplatePreviewDetail({
  template,
  data,
}: {
  template: BioTemplateKey;
  data: TemplatePreviewData;
}) {
  switch (template) {
    case "spotlight":
      return <XPreview data={data} />;
    case "grid":
      return <PinterestPreview data={data} />;
    case "sidebar":
      return <LinkedInPreview data={data} />;
    case "showcase":
      return <InstagramPreview data={data} />;
    case "magazine":
      return <ThreadsPreview data={data} />;
    case "stack":
    default:
      return <LinktreePreview data={data} />;
  }
}
