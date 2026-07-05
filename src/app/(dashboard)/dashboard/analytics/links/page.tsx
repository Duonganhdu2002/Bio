import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import {
  getAllLinkClicksDaily,
  getLinkClickRows,
  getLinkClicksSummary,
  parseRange,
  rangePeriodLabel,
} from "@/lib/analytics/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { RangeTabs } from "@/components/dashboard/charts/range-tabs";
import { ClickAnalyticsBody } from "@/components/dashboard/click-analytics-body";
import { Link2 } from "@/components/dashboard/charts/click-analytics-table";

export const metadata: Metadata = {
  title: "Phân tích link",
};

export default async function LinkClicksAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  if (!params.range) {
    redirect("/dashboard/analytics/links?range=1");
  }

  const range = parseRange(params.range);
  const periodLabel = rangePeriodLabel(range);

  const [summary, series, rows] = await Promise.all([
    getLinkClicksSummary(profile.id, range),
    getAllLinkClicksDaily(profile.id, range),
    getLinkClickRows(profile.id, range),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Phân tích chuyên sâu"
        title="Lượt bấm link"
        description="Theo dõi liên kết nào trên trang bio được bấm nhiều nhất."
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
        detailBasePath="/dashboard/analytics/links"
        countLabel="Link có click"
        avgLabel="Trung bình / link"
        tableTitle="Tất cả link"
        tableDescription="Bấm vào từng link để xem biểu đồ chi tiết theo ngày."
        FallbackIcon={Link2}
      />
    </>
  );
}
