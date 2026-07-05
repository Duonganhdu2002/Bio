import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import {
  getAllBannerClicksDaily,
  getBannerClickRows,
  getBannerClicksSummary,
  parseRange,
  rangePeriodLabel,
} from "@/lib/analytics/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { RangeTabs } from "@/components/dashboard/charts/range-tabs";
import { ClickAnalyticsBody } from "@/components/dashboard/click-analytics-body";

export const metadata: Metadata = {
  title: "Phân tích banner",
};

export default async function BannerClicksAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  if (!params.range) {
    redirect("/dashboard/analytics/banners?range=1");
  }

  const range = parseRange(params.range);
  const periodLabel = rangePeriodLabel(range);

  const [summary, series, rows] = await Promise.all([
    getBannerClicksSummary(profile.id, range),
    getAllBannerClicksDaily(profile.id, range),
    getBannerClickRows(profile.id, range),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Phân tích chuyên sâu"
        title="Lượt bấm banner"
        description="Theo dõi banner PR và brand nào thu hút click từ trang cửa hàng."
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
        rows={rows}
        detailBasePath="/dashboard/analytics/banners"
        countLabel="Banner có click"
        avgLabel="Trung bình / banner"
        tableTitle="Tất cả banner"
        tableDescription="Bấm vào từng banner để xem biểu đồ chi tiết theo ngày."
        FallbackIcon={ImageIcon}
      />
    </>
  );
}
