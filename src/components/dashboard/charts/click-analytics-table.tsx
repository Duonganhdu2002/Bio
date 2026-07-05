"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ImageIcon, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClickAnalyticsRow } from "@/lib/analytics/queries";

type Props = {
  rows: ClickAnalyticsRow[];
  range: number;
  detailHref: (id: string) => string;
  emptyLabel?: string;
  inactiveLabel?: string;
  FallbackIcon?: LucideIcon;
};

function ItemThumb({
  imageUrl,
  FallbackIcon = ImageIcon,
}: {
  imageUrl: string | null;
  FallbackIcon?: LucideIcon;
}) {
  const Icon = FallbackIcon;
  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill sizes="40px" className="object-contain" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </div>
      )}
    </div>
  );
}

function ClickCard({
  row,
  index,
  range,
  maxClicks,
  detailHref,
  inactiveLabel,
  FallbackIcon,
}: {
  row: ClickAnalyticsRow;
  index: number;
  range: number;
  maxClicks: number;
  detailHref: (id: string) => string;
  inactiveLabel: string;
  FallbackIcon?: LucideIcon;
}) {
  return (
    <Link
      href={`${detailHref(row.id)}?range=${range}`}
      className="flex min-w-0 gap-3 rounded-xl border border-border/80 bg-card p-3 transition-colors hover:bg-muted/40"
    >
      <span className="w-5 shrink-0 pt-0.5 text-sm tabular-nums text-muted-foreground">
        {index + 1}
      </span>
      <ItemThumb imageUrl={row.image_url} FallbackIcon={FallbackIcon} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug break-words">{row.title}</p>
        {row.subtitle ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{row.subtitle}</p>
        ) : null}
        {!row.is_active ? (
          <Badge variant="secondary" className="mt-1">
            {inactiveLabel}
          </Badge>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{row.share.toFixed(1)}% tổng click</span>
          <span className="shrink-0 font-semibold tabular-nums text-foreground">
            {row.clicks.toLocaleString("vi-VN")} bấm
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${(row.clicks / maxClicks) * 100}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export function ClickAnalyticsTable({
  rows,
  range,
  detailHref,
  emptyLabel = "Chưa có mục nào.",
  inactiveLabel = "Đang tắt",
  FallbackIcon,
}: Props) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const maxClicks = Math.max(1, ...rows.map((r) => r.clicks));
  const withClicks = rows.filter((r) => r.clicks > 0);
  const withoutClicks = rows.filter((r) => r.clicks === 0);
  const href = (id: string) => `${detailHref(id)}?range=${range}`;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {withClicks.length > 0 ? (
        <>
          <div className="flex min-w-0 flex-col gap-2.5 sm:hidden">
            {withClicks.map((row, index) => (
              <ClickCard
                key={row.id}
                row={row}
                index={index}
                range={range}
                maxClicks={maxClicks}
                detailHref={detailHref}
                inactiveLabel={inactiveLabel}
                FallbackIcon={FallbackIcon}
              />
            ))}
          </div>

          <div className="hidden min-w-0 sm:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Mục</TableHead>
                  <TableHead className="w-20 text-right">Lượt bấm</TableHead>
                  <TableHead className="hidden w-24 md:table-cell">Tỉ trọng</TableHead>
                  <TableHead className="hidden w-32 lg:table-cell">Xu hướng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withClicks.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="!whitespace-normal">
                      <Link
                        href={href(row.id)}
                        className="flex min-w-0 items-center gap-3 transition-colors hover:text-primary"
                      >
                        <ItemThumb imageUrl={row.image_url} FallbackIcon={FallbackIcon} />
                        <span className="min-w-0">
                          <span className="line-clamp-2 font-medium leading-snug break-words">
                            {row.title}
                          </span>
                          {row.subtitle ? (
                            <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                              {row.subtitle}
                            </span>
                          ) : null}
                          {!row.is_active ? (
                            <Badge variant="secondary" className="mt-1">
                              {inactiveLabel}
                            </Badge>
                          ) : null}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {row.clicks.toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="tabular-nums text-muted-foreground">
                        {row.share.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(row.clicks / maxClicks) * 100}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Chưa có lượt bấm trong khoảng này.
        </p>
      )}

      {withoutClicks.length > 0 ? (
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Chưa có lượt bấm ({withoutClicks.length})
          </p>
          <ul className="flex flex-col gap-1.5">
            {withoutClicks.map((row) => (
              <li key={row.id} className="min-w-0">
                <Link
                  href={href(row.id)}
                  className="flex min-w-0 items-start gap-2 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="min-w-0 break-words">{row.title}</span>
                  {!row.is_active ? (
                    <Badge variant="secondary" className="shrink-0">
                      Tắt
                    </Badge>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export { Link2 };
