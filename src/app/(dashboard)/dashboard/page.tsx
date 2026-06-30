import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { StatsDaily } from "@/lib/types";

export const metadata = { title: "Tổng quan" };

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function DashboardOverviewPage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const since = isoDaysAgo(6);
  const today = new Date().toISOString().slice(0, 10);

  const [statsRes, linksRes, productsRes] = await Promise.all([
    supabase
      .from("stats_daily")
      .select("day, views, clicks")
      .eq("profile_id", profile.id)
      .gte("day", since)
      .order("day"),
    supabase
      .from("links")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id),
  ]);

  const stats = (statsRes.data ?? []) as Pick<
    StatsDaily,
    "day" | "views" | "clicks"
  >[];
  const totals = stats.reduce(
    (acc, s) => ({ views: acc.views + s.views, clicks: acc.clicks + s.clicks }),
    { views: 0, clicks: 0 },
  );
  const todayStat = stats.find((s) => s.day === today) ?? { views: 0, clicks: 0 };
  const linkCount = linksRes.count ?? 0;
  const productCount = productsRes.count ?? 0;

  const cards = [
    { label: "Lượt xem hôm nay", value: todayStat.views, accent: "#c0623c" },
    { label: "Lượt click hôm nay", value: todayStat.clicks, accent: "#1e6e89" },
    { label: "Lượt xem 7 ngày", value: totals.views, accent: "#7e8a4f" },
    { label: "Lượt click 7 ngày", value: totals.clicks, accent: "#d98a5e" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Bảng điều khiển"
        title={`Chào ${profile.display_name || profile.username}`}
        description="Tổng quan hoạt động trang bio của bạn trong những ngày gần đây."
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} size="sm">
            <CardContent className="flex flex-col gap-3">
              <span
                className="h-1 w-9 rounded-full"
                style={{ backgroundColor: c.accent }}
                aria-hidden
              />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {c.label}
              </span>
              <span className="font-heading text-[1.9rem] font-semibold leading-none tabular-nums">
                {c.value.toLocaleString("vi-VN")}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nội dung</CardTitle>
            <CardDescription>
              {linkCount} liên kết · {productCount} sản phẩm · banner & brand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" render={<Link href="/dashboard/content" />}>
              Quản lý nội dung
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Trang bio công khai</CardTitle>
          <CardDescription>
            Đường dẫn của bạn:{" "}
            <span className="font-medium text-foreground">/@{profile.username}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </>
  );
}
