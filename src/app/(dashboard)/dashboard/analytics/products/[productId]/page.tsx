import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, ShoppingBag } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/components/bio/price";
import { getCurrentProfile } from "@/lib/auth";
import {
  getProductClickSeries,
  getProductClickTotal,
  getProductForAnalytics,
  parseRange,
  rangePeriodLabel,
} from "@/lib/analytics/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { RangeTabs } from "@/components/dashboard/charts/range-tabs";

const SeriesChart = dynamic(() =>
  import("@/components/dashboard/charts/series-chart").then((m) => m.SeriesChart),
);

type PageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ range?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getCurrentProfile();
  if (!profile) return { title: "Sản phẩm" };

  const { productId } = await params;
  const product = await getProductForAnalytics(profile.id, productId);
  return { title: product ? product.title : "Sản phẩm" };
}

export default async function ProductAnalyticsPage({ params, searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { productId } = await params;
  const range = parseRange((await searchParams).range);
  const periodLabel = rangePeriodLabel(range);

  const product = await getProductForAnalytics(profile.id, productId);
  if (!product) notFound();

  const [series, totalClicks] = await Promise.all([
    getProductClickSeries(productId, range),
    getProductClickTotal(profile.id, productId, range),
  ]);
  const hasDailyChart = series.some((p) => p.clicks > 0);
  const price = formatPrice(product.price_cents, product.currency);

  return (
    <>
      <PageHeader
        eyebrow="Phân tích sản phẩm"
        title={product.title}
        description="Lượt bấm từ trang bio tới liên kết sản phẩm này."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/dashboard/analytics?range=${range}`} />}
            >
              <ArrowLeft />
              Thống kê
            </Button>
            <RangeTabs current={range} />
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative aspect-[5/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-44">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  sizes="176px"
                  className="object-contain"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ShoppingBag className="size-8" aria-hidden />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {price ? (
                <p className="text-lg font-semibold tabular-nums">{price}</p>
              ) : null}
              {product.description ? (
                <p className="line-clamp-3 text-sm text-muted-foreground">{product.description}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {product.url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <a href={product.url} target="_blank" rel="noopener noreferrer nofollow" />
                    }
                  >
                    <ExternalLink />
                    Mở liên kết
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/dashboard/content#products" />}
                >
                  Chỉnh sửa sản phẩm
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card size="sm">
            <CardContent className="flex flex-col gap-3">
              <span
                className="h-1 w-9 rounded-full bg-[#1e6e89]"
                aria-hidden
              />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Lượt bấm
              </span>
              <span className="font-heading text-[1.9rem] font-semibold leading-none tabular-nums">
                {totalClicks.toLocaleString("vi-VN")}
              </span>
              <span className="text-xs text-muted-foreground">{periodLabel}</span>
            </CardContent>
          </Card>
        </div>

        {hasDailyChart ? (
          <Card>
            <CardHeader>
              <CardTitle>Theo ngày</CardTitle>
              <CardDescription>{periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <SeriesChart data={series} clicksOnly />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
