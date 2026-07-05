import dynamic from "next/dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsRange } from "@/lib/analytics/range";
import type { ClickAnalyticsRow, ClickAnalyticsSummary, DailyPoint } from "@/lib/analytics/queries";
import {
  ClickAnalyticsTable,
  Link2,
} from "@/components/dashboard/charts/click-analytics-table";
import type { LucideIcon } from "lucide-react";

const SeriesChart = dynamic(() =>
  import("@/components/dashboard/charts/series-chart").then((m) => m.SeriesChart),
);

type StatCardProps = { label: string; value: string; hint?: string; accent?: string };

function StatCard({ label, value, hint, accent = "#1e6e89" }: StatCardProps) {
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

type Props = {
  range: AnalyticsRange;
  periodLabel: string;
  summary: ClickAnalyticsSummary;
  series: DailyPoint[];
  rows: ClickAnalyticsRow[];
  detailBasePath: string;
  countLabel: string;
  avgLabel: string;
  tableTitle: string;
  tableDescription: string;
  FallbackIcon?: LucideIcon;
};

export function ClickAnalyticsBody({
  range,
  periodLabel,
  summary,
  series,
  rows,
  detailBasePath,
  countLabel,
  avgLabel,
  tableTitle,
  tableDescription,
  FallbackIcon = Link2,
}: Props) {
  const hasChart = series.some((p) => p.clicks > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Tổng lượt bấm"
          value={summary.totalClicks.toLocaleString("vi-VN")}
          hint={periodLabel}
          accent="#1e6e89"
        />
        <StatCard
          label={countLabel}
          value={`${summary.itemsWithClicks}/${summary.totalItems}`}
          hint="Trong khoảng đang chọn"
          accent="#c0623c"
        />
        <StatCard
          label={avgLabel}
          value={summary.avgClicksPerItem.toLocaleString("vi-VN")}
          hint="Chỉ tính mục có click"
          accent="#7e8a4f"
        />
        <StatCard
          label="Top 1 chiếm"
          value={`${summary.topItemShare.toFixed(1)}%`}
          hint="Tỉ trọng mục dẫn đầu"
          accent="#d98a5e"
        />
      </div>

      {hasChart ? (
        <Card>
          <CardHeader>
            <CardTitle>{range === 1 ? "Lượt bấm hôm nay" : "Lượt bấm theo ngày"}</CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <SeriesChart data={series} clicksOnly compactSingleDay />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{tableTitle}</CardTitle>
          <CardDescription>{tableDescription}</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <ClickAnalyticsTable
            rows={rows}
            range={range}
            detailHref={(id) => `${detailBasePath}/${id}`}
            FallbackIcon={FallbackIcon}
          />
        </CardContent>
      </Card>
    </div>
  );
}
