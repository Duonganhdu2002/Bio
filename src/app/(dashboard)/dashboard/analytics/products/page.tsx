import Link from "next/link";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import {
  getAllProductClicksDaily,
  getProductClickRows,
  getProductClicksSummary,
  parseRange,
  rangePeriodLabel,
} from "@/lib/analytics/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { RangeTabs } from "@/components/dashboard/charts/range-tabs";
import { ClickAnalyticsBody } from "@/components/dashboard/click-analytics-body";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Phân tích sản phẩm",
};

export default async function ProductClicksAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  if (!params.range) {
    redirect("/dashboard/analytics/products?range=1");
  }

  const range = parseRange(params.range);
  const periodLabel = rangePeriodLabel(range);

  const [summary, series, rows] = await Promise.all([
    getProductClicksSummary(profile.id, range),
    getAllProductClicksDaily(profile.id, range),
    getProductClickRows(profile.id, range),
  ]);

  const clickRows = rows.map((r) => ({
    id: r.id,
    title: r.title,
    image_url: r.image_url,
    is_active: r.is_active,
    clicks: r.clicks,
    share: r.share,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Phân tích chuyên sâu"
        title="Lượt bấm sản phẩm"
        description="Theo dõi sản phẩm nào thu hút click nhiều nhất từ trang bio."
        action={
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              render={<Link href={`/dashboard/analytics?range=${range}`} />}
            >
              <ArrowLeft />
              Thống kê
            </Button>
            <RangeTabs current={range} className="w-full sm:w-auto" />
          </div>
        }
      />

      <ClickAnalyticsBody
        range={range}
        periodLabel={periodLabel}
        summary={summary}
        series={series}
        rows={clickRows}
        detailBasePath="/dashboard/analytics/products"
        countLabel="Sản phẩm có click"
        avgLabel="Trung bình / SP"
        tableTitle="Tất cả sản phẩm"
        tableDescription="Bấm vào từng sản phẩm để xem biểu đồ chi tiết theo ngày."
        FallbackIcon={ShoppingBag}
      />
    </>
  );
}
