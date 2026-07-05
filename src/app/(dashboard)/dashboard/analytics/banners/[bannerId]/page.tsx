import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, ImageIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bannerSectionLabel } from "@/lib/banner-section";
import { getCurrentProfile } from "@/lib/auth";
import {
  getBannerClickSeries,
  getBannerClickTotal,
  getBannerForAnalytics,
  parseRange,
  rangePeriodLabel,
} from "@/lib/analytics/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { RangeTabs } from "@/components/dashboard/charts/range-tabs";

const SeriesChart = dynamic(() =>
  import("@/components/dashboard/charts/series-chart").then((m) => m.SeriesChart),
);

type PageProps = {
  params: Promise<{ bannerId: string }>;
  searchParams: Promise<{ range?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getCurrentProfile();
  if (!profile) return { title: "Banner" };

  const { bannerId } = await params;
  const banner = await getBannerForAnalytics(profile.id, bannerId);
  return { title: banner ? banner.name : "Banner" };
}

export default async function BannerAnalyticsPage({ params, searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { bannerId } = await params;
  const range = parseRange((await searchParams).range);
  const periodLabel = rangePeriodLabel(range);

  const banner = await getBannerForAnalytics(profile.id, bannerId);
  if (!banner) notFound();

  const [series, totalClicks] = await Promise.all([
    getBannerClickSeries(profile.id, bannerId, range),
    getBannerClickTotal(profile.id, bannerId, range),
  ]);
  const hasDailyChart = series.some((p) => p.clicks > 0);

  return (
    <>
      <PageHeader
        eyebrow="Phân tích banner"
        title={banner.name}
        description="Lượt bấm từ trang cửa hàng tới banner này."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/dashboard/analytics/banners?range=${range}`} />}
            >
              <ArrowLeft />
              Banner
            </Button>
            <RangeTabs current={range} />
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative aspect-[5/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-44">
              {banner.image_url ? (
                <Image
                  src={banner.image_url}
                  alt={banner.name}
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="size-8" aria-hidden />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {bannerSectionLabel(banner.section)}
              </p>
              {banner.url ? (
                <p className="truncate text-sm text-muted-foreground">{banner.url}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {banner.url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <a href={banner.url} target="_blank" rel="noopener noreferrer nofollow" />
                    }
                  >
                    <ExternalLink />
                    Mở liên kết
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/dashboard/content#banners" />}
                >
                  Chỉnh sửa banner
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
