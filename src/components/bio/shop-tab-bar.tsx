"use client";

import { FolderOpen, LayoutGrid, SquareStack } from "lucide-react";

import { cn } from "@/lib/utils";

export type ShopTab = "shop" | "products" | "categories";

export const SHOP_TABS: {
  id: ShopTab;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { id: "shop", label: "Shop", icon: LayoutGrid },
  { id: "products", label: "Sản phẩm", icon: SquareStack },
  { id: "categories", label: "Danh mục", icon: FolderOpen },
];

/** Tab bar kiểu Instagram — icon + gạch dưới tab active. */
export function ShopTabBar({
  active,
  onChange,
  className,
}: {
  active: ShopTab;
  onChange: (tab: ShopTab) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Điều hướng cửa hàng"
      className={cn("sticky top-0 z-10 border-t border-border bg-background", className)}
    >
      <div role="tablist" className="grid grid-cols-3">
        {SHOP_TABS.map((item) => {
          const selected = active === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={item.label}
              title={item.label}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex h-11 items-center justify-center border-b outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                selected
                  ? "border-secondary-foreground text-secondary-foreground"
                  : "border-transparent text-muted-foreground hover:text-secondary-foreground",
              )}
            >
              <Icon className="size-[22px] stroke-[1.75]" aria-hidden />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
