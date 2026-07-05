import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/bio/platform";
import { getCurrentProfile } from "@/lib/auth";
import {
  getLinkClickSeries,
  getLinkClickTotal,
  getLinkForAnalytics,
  parseRange,
  rangePeriodLabel,
} from "@/lib/analytics/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { RangeTabs } from "@/components/dashboard/charts/range-tabs";

const SeriesChart = dynamic(() =>
  import("@/components/dashboard/charts/series-chart").then((m) => m.SeriesChart),
);

type PageProps = {
  params: Promise<{ linkId: string }>;
  searchParams: Promise<{ range?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getCurrentProfile();
  if (!profile) return { title: "Link" };

  const { linkId } = await params;
  const link = await getLinkForAnalytics(profile.id, linkId);
  return { title: link ? link.title : "Link" };
}

export default async function LinkAnalyticsPage({ params, searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { linkId } = await params;
  const range = parseRange((await searchParams).range);
  const periodLabel = rangePeriodLabel(range);

  const link = await getLinkForAnalytics(profile.id, linkId);
  if (!link) notFound();

  const [series, totalClicks] = await Promise.all([
    getLinkClickSeries(profile.id, linkId, range),
    getLinkClickTotal(profile.id, linkId, range),
  ]);
  const hasDailyChart = series.some((p) => p.clicks > 0);

  return (
    <>
      <PageHeader
        eyebrow="Phân tích link"
        title={link.title}
        description="Lượt bấm từ trang bio tới liên kết này."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/dashboard/analytics/links?range=${range}`} />}
            >
              <ArrowLeft />
              Link
            </Button>
            <RangeTabs current={range} />
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <PlatformIcon platform={link.platform} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-muted-foreground">{link.url}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a href={link.url} target="_blank" rel="noopener noreferrer nofollow" />
                  }
                >
                  <ExternalLink />
                  Mở liên kết
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/dashboard/content#links" />}
                >
                  Chỉnh sửa link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            <span className="h-1 w-9 rounded-full bg-[#1e6e89]" aria-hidden />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Lượt bấm
            </span>
            <span className="font-heading text-[1.9rem] font-semibold leading-none tabular-nums">
              {totalClicks.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          </CardContent>
        </Card>

        {hasDailyChart ? (
          <Card>
            <CardHeader>
              <CardTitle>{range === 1 ? "Lượt bấm hôm nay" : "Theo ngày"}</CardTitle>
              <CardDescription>{periodLabel}</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
              <SeriesChart data={series} clicksOnly compactSingleDay={range === 1} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
