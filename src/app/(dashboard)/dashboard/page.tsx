import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";

import { PageHeader } from "@/components/dashboard/page-header";
import { TopList } from "@/components/dashboard/charts/top-list";
import { Button } from "@/components/ui/button";
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
  rangePeriodLabel,
} from "@/lib/analytics/queries";
import { createClient } from "@/lib/supabase/server";

const SeriesChart = dynamic(() =>
  import("@/components/dashboard/charts/series-chart").then((m) => m.SeriesChart),
);

export const metadata = { title: "Tổng quan" };

const RANGE_DAYS = 7 as const;

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

function formatDelta(current: number, previous: number): string {
  const delta = current - previous;
  if (delta === 0) return "Giống hôm qua";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toLocaleString("vi-VN")} so với hôm qua`;
}

export default async function DashboardOverviewPage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const [
    overview,
    series,
    topLinks,
    topProducts,
    linksRes,
    productsRes,
    bannersRes,
    categoriesRes,
  ] = await Promise.all([
    getOverviewStats(profile.id, RANGE_DAYS),
    getDailySeries(profile.id, RANGE_DAYS),
    getTopLinks(profile.id, RANGE_DAYS, 3),
    getTopProducts(profile.id, RANGE_DAYS, 3),
    supabase.from("links").select("is_active").eq("profile_id", profile.id),
    supabase.from("products").select("is_active").eq("profile_id", profile.id),
    supabase
      .from("profile_banners")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id),
    supabase.from("product_categories").select("section").eq("profile_id", profile.id),
  ]);

  const today = series.at(-1) ?? { views: 0, clicks: 0, day: "" };
  const yesterday = series.at(-2) ?? { views: 0, clicks: 0, day: "" };
  const avgViews = Math.round(overview.views / RANGE_DAYS);
  const avgClicks = Math.round(overview.clicks / RANGE_DAYS);
  const ctrPct = `${(overview.ctr * 100).toFixed(1)}%`;
  const todayCtr =
    today.views > 0 ? `${((today.clicks / today.views) * 100).toFixed(1)}%` : "—";

  const links = linksRes.data ?? [];
  const products = productsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const linkCount = links.length;
  const activeLinkCount = links.filter((l) => l.is_active).length;
  const productCount = products.length;
  const activeProductCount = products.filter((p) => p.is_active).length;
  const bannerCount = bannersRes.count ?? 0;
  const productCategoryCount = categories.filter((c) => c.section === "product").length;
  const brandCategoryCount = categories.filter((c) => c.section === "brand").length;

  const statCards: StatCardProps[] = [
    {
      label: "Lượt xem hôm nay",
      value: today.views.toLocaleString("vi-VN"),
      hint: formatDelta(today.views, yesterday.views),
      accent: "#c0623c",
    },
    {
      label: "Lượt click hôm nay",
      value: today.clicks.toLocaleString("vi-VN"),
      hint: formatDelta(today.clicks, yesterday.clicks),
      accent: "#1e6e89",
    },
    {
      label: "CTR hôm nay",
      value: todayCtr,
      hint: "Lượt click / lượt xem",
      accent: "#7e8a4f",
    },
    {
      label: "Lượt xem 7 ngày",
      value: overview.views.toLocaleString("vi-VN"),
      hint: `Trung bình ${avgViews.toLocaleString("vi-VN")}/ngày`,
      accent: "#c0623c",
    },
    {
      label: "Lượt click 7 ngày",
      value: overview.clicks.toLocaleString("vi-VN"),
      hint: `Trung bình ${avgClicks.toLocaleString("vi-VN")}/ngày`,
      accent: "#1e6e89",
    },
    {
      label: "CTR 7 ngày",
      value: ctrPct,
      hint: "Lượt click / lượt xem",
      accent: "#d98a5e",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Bảng điều khiển"
        title={`Chào ${profile.display_name || profile.username}`}
        description="Tổng quan hoạt động trang bio của bạn trong 7 ngày gần đây."
        action={
          <Button
            variant="outline"
            size="sm"
            render={
              <Link
                href={`/@${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLink />
            <span className="hidden sm:inline">Xem bio</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Hoạt động 7 ngày</CardTitle>
              <CardDescription>{rangePeriodLabel(RANGE_DAYS)}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              render={<Link href="/dashboard/analytics?range=7" />}
            >
              Xem chi tiết
              <ArrowRight />
            </Button>
          </CardHeader>
          <CardContent>
            <SeriesChart data={series} />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top link</CardTitle>
              <CardDescription>Link được bấm nhiều nhất trong 7 ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <TopList items={topLinks} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top sản phẩm</CardTitle>
              <CardDescription>Sản phẩm được bấm nhiều nhất trong 7 ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <TopList
                items={topProducts}
                getHref={(item) => `/dashboard/analytics/products/${item.id}?range=${RANGE_DAYS}`}
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                render={<Link href={`/dashboard/analytics/products?range=${RANGE_DAYS}`} />}
              >
                Phân tích chuyên sâu
                <ArrowRight />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nội dung</CardTitle>
              <CardDescription>
                Tóm tắt các mục trên trang bio của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Liên kết</dt>
                  <dd className="font-medium tabular-nums">
                    {activeLinkCount} đang bật / {linkCount} tổng
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sản phẩm</dt>
                  <dd className="font-medium tabular-nums">
                    {activeProductCount} đang bật / {productCount} tổng
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Banner PR</dt>
                  <dd className="font-medium tabular-nums">{bannerCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Danh mục</dt>
                  <dd className="font-medium tabular-nums">
                    {productCategoryCount} sản phẩm · {brandCategoryCount} brand
                  </dd>
                </div>
              </dl>
              <Button size="sm" render={<Link href="/dashboard/content" />}>
                Quản lý nội dung
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trang bio công khai</CardTitle>
              <CardDescription>
                Đường dẫn của bạn:{" "}
                <span className="font-medium text-foreground">/@{profile.username}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`size-2 rounded-full ${profile.is_published ? "bg-emerald-500" : "bg-amber-500"}`}
                  aria-hidden
                />
                <span>
                  {profile.is_published
                    ? "Trang đang công khai"
                    : "Trang chưa công khai — chỉ bạn mới xem được"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={`/@${profile.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ExternalLink />
                  Mở trang bio
                </Button>
                <Button variant="ghost" size="sm" render={<Link href="/dashboard/appearance" />}>
                  Giao diện
                </Button>
                <Button variant="ghost" size="sm" render={<Link href="/dashboard/settings" />}>
                  Cài đặt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
