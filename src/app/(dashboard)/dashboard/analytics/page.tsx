import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import {
  getDailySeries,
  getOverviewStats,
  getTopLinks,
  getTopProducts,
  parseRange,
  rangePeriodLabel,
} from "@/lib/analytics/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { RangeTabs } from "@/components/dashboard/charts/range-tabs";
import { TopList } from "@/components/dashboard/charts/top-list";

// Chart chỉ tải ở route này (client) → không lọt vào bundle trang public.
const SeriesChart = dynamic(() =>
  import("@/components/dashboard/charts/series-chart").then((m) => m.SeriesChart),
);

export const metadata: Metadata = {
  title: "Thống kê",
};

type StatCardProps = { label: string; value: string; hint?: string; accent?: string };

function StatCard({ label, value, hint, accent = "#c0623c" }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <span
          className="h-1 w-9 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="font-heading text-[1.9rem] font-semibold leading-none tabular-nums">
          {value}
        </span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const range = parseRange((await searchParams).range);
  const periodLabel = rangePeriodLabel(range);

  const [overview, series, topLinks, topProducts] = await Promise.all([
    getOverviewStats(profile.id, range),
    getDailySeries(profile.id, range),
    getTopLinks(profile.id, range),
    getTopProducts(profile.id, range),
  ]);

  const ctrPct = `${(overview.ctr * 100).toFixed(1)}%`;

  return (
    <>
      <PageHeader
        eyebrow="Phân tích"
        title="Thống kê"
        description="Lượt xem và lượt bấm trên trang bio của bạn."
        action={<RangeTabs current={range} />}
      />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Lượt xem"
            value={overview.views.toLocaleString("vi-VN")}
            accent="#c0623c"
          />
          <StatCard
            label="Lượt bấm"
            value={overview.clicks.toLocaleString("vi-VN")}
            accent="#1e6e89"
          />
          <StatCard
            label="Tỉ lệ bấm (CTR)"
            value={ctrPct}
            hint="Lượt bấm / lượt xem"
            accent="#7e8a4f"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Theo ngày</CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <SeriesChart data={series} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top link</CardTitle>
              <CardDescription>Link được bấm nhiều nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <TopList items={topLinks} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top sản phẩm</CardTitle>
              <CardDescription>Sản phẩm được bấm nhiều nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <TopList
                items={topProducts}
                getHref={(item) =>
                  `/dashboard/analytics/products/${item.id}?range=${range}`
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
