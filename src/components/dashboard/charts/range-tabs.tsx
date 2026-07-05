"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsIndicator, TabsList, TabsTab } from "@/components/ui/tabs";
import { ANALYTICS_RANGES, type AnalyticsRange } from "@/lib/analytics/range";

const LABEL: Record<AnalyticsRange, string> = {
  1: "Hôm nay",
  7: "7 ngày",
  30: "30 ngày",
  90: "90 ngày",
};

export function RangeTabs({
  current,
  className,
}: {
  current: AnalyticsRange;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("range", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={String(current)} onValueChange={(value) => select(String(value))} className={className}>
      <TabsList className="h-auto w-full min-w-0 flex-wrap gap-0.5 p-1 sm:w-fit sm:flex-nowrap">
        <TabsIndicator />
        {ANALYTICS_RANGES.map((range) => (
          <TabsTab key={range} value={String(range)} className="min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-2.5 sm:text-sm">
            {LABEL[range]}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
}
