import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Tiêu đề section tối giản — kiểu Threads. */
export function ShopSectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-4 pb-3 pt-5", className)}>
      <h2 className="text-[15px] font-semibold tracking-tight text-secondary-foreground">{title}</h2>
      {action ? (
        <div className="text-xs font-normal text-muted-foreground">{action}</div>
      ) : null}
    </div>
  );
}
