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

export function RangeTabs({ current }: { current: AnalyticsRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("range", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={String(current)} onValueChange={(value) => select(String(value))}>
      <TabsList>
        <TabsIndicator />
        {ANALYTICS_RANGES.map((range) => (
          <TabsTab key={range} value={String(range)}>
            {LABEL[range]}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
}
