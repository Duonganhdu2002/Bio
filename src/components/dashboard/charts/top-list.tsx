import Link from "next/link";

import type { TopItem } from "@/lib/analytics/queries";

type Props = {
  items: TopItem[];
  emptyLabel?: string;
  getHref?: (item: TopItem) => string | undefined;
};

/** Bảng top (link/sản phẩm) với thanh tỉ lệ theo lượt bấm cao nhất. */
export function TopList({
  items,
  emptyLabel = "Chưa có dữ liệu trong khoảng này.",
  getHref,
}: Props) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...items.map((i) => i.clicks));

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => {
        const href = getHref?.(item);
        return (
        <li key={item.id} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            {href ? (
              <Link
                href={href}
                className="truncate text-foreground transition-colors hover:text-primary hover:underline"
                title={item.title}
              >
                {item.title}
              </Link>
            ) : (
              <span className="truncate" title={item.title}>
                {item.title}
              </span>
            )}
            <span className="shrink-0 tabular-nums font-medium text-muted-foreground">
              {item.clicks.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.clicks / max) * 100}%` }}
            />
          </div>
        </li>
      );
      })}
    </ul>
  );
}
