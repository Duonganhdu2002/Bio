"use client";

import { useId } from "react";
import type { DailyPoint } from "@/lib/analytics/queries";

type Props = {
  data: DailyPoint[];
  height?: number;
  /** Chỉ hiển thị lượt bấm (trang chi tiết sản phẩm). */
  clicksOnly?: boolean;
  /** Thu gọn biểu đồ 1 ngày — cột hẹp hơn, vừa mobile. */
  compactSingleDay?: boolean;
};

const VBW = 640;
const PAD = { top: 16, right: 16, bottom: 32, left: 40 };
const PAD_COMPACT = { top: 16, right: 16, bottom: 44, left: 40 };

function formatDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function buildLine(values: number[], x: (i: number) => number, y: (v: number) => number) {
  return values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
}

/** Làm tròn trục Y về bước đẹp (0, 25, 50, 100…) thay vì max/2 thô. */
function niceYScale(rawMax: number, tickCount = 5): { max: number; ticks: number[] } {
  if (rawMax <= 0) return { max: 4, ticks: [0, 1, 2, 3, 4] };

  const roughStep = rawMax / (tickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceStep: number;
  if (residual <= 1) niceStep = magnitude;
  else if (residual <= 2) niceStep = 2 * magnitude;
  else if (residual <= 5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMax = Math.ceil(rawMax / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax; v += niceStep) ticks.push(v);
  return { max: niceMax, ticks };
}

function xTickIndices(n: number): number[] {
  if (n <= 1) return [0];
  if (n <= 7) return Array.from({ length: n }, (_, i) => i);
  if (n <= 14) return Array.from({ length: Math.ceil(n / 2) }, (_, i) => i * 2).filter((i) => i < n);
  return [0, Math.floor((n - 1) / 2), n - 1];
}

type BarSpec = { label: string; value: number; color: string; x: number };

function SingleDayBars({
  point,
  height,
  clicksOnly,
  compact,
  yMax,
  yTicks,
}: {
  point: DailyPoint;
  height: number;
  clicksOnly: boolean;
  compact?: boolean;
  yMax: number;
  yTicks: number[];
}) {
  const pad = compact ? PAD_COMPACT : PAD;
  const innerW = VBW - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const y = (v: number) => pad.top + innerH - (v / yMax) * innerH;
  const barW = compact
    ? Math.min(44, innerW * 0.11)
    : clicksOnly
      ? Math.min(56, innerW * 0.14)
      : 56;
  const gap = compact ? 28 : 40;
  const cx = VBW / 2;
  const baseY = pad.top + innerH;

  const bars: BarSpec[] = clicksOnly
    ? [{ label: "Bấm", value: point.clicks, color: "var(--chart-2)", x: cx - barW / 2 }]
    : [
        {
          label: "Xem",
          value: point.views,
          color: "var(--chart-1)",
          x: cx - gap / 2 - barW,
        },
        { label: "Bấm", value: point.clicks, color: "var(--chart-2)", x: cx + gap / 2 },
      ];

  return (
    <>
      {yTicks.map((t) => {
        const gy = y(t);
        return (
          <g key={t}>
            <line
              x1={pad.left}
              x2={VBW - pad.right}
              y1={gy}
              y2={gy}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={pad.left - 8}
              y={gy + 3}
              textAnchor="end"
              fontSize={10}
              fill="var(--muted-foreground)"
            >
              {t.toLocaleString("vi-VN")}
            </text>
          </g>
        );
      })}

      {bars.map((bar) => {
        const top = y(bar.value);
        const barH = Math.max(baseY - top, bar.value > 0 ? 4 : 0);
        return (
          <g key={bar.label}>
            {bar.value > 0 ? (
              <rect
                x={bar.x - 4}
                y={pad.top}
                width={barW + 8}
                height={innerH}
                rx={8}
                fill="var(--muted)"
                opacity={0.45}
              />
            ) : null}
            <rect
              x={bar.x}
              y={top}
              width={barW}
              height={barH}
              rx={6}
              fill={bar.color}
              opacity={0.9}
            />
            <text
              x={bar.x + barW / 2}
              y={bar.value > 0 ? top - 6 : top + 14}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill="var(--foreground)"
            >
              {bar.value.toLocaleString("vi-VN")}
            </text>
            {!clicksOnly ? (
              <text
                x={bar.x + barW / 2}
                y={baseY + 18}
                textAnchor="middle"
                fontSize={10}
                fill="var(--muted-foreground)"
              >
                {bar.label}
              </text>
            ) : null}
          </g>
        );
      })}

      <text
        x={cx}
        y={height - 12}
        textAnchor="middle"
        fontSize={11}
        fill="var(--muted-foreground)"
      >
        {clicksOnly && compact ? `Hôm nay · ${formatDay(point.day)}` : formatDay(point.day)}
      </text>
    </>
  );
}

export function SeriesChart({
  data,
  height = 240,
  clicksOnly = false,
  compactSingleDay = false,
}: Props) {
  const gradId = useId();
  const n = data.length;
  const innerW = VBW - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const rawMax = Math.max(
    1,
    ...data.map((d) => (clicksOnly ? d.clicks : Math.max(d.views, d.clicks))),
  );
  const { max: yMax, ticks: yTicks } = niceYScale(rawMax);

  const x = (i: number) => (n <= 1 ? PAD.left + innerW / 2 : PAD.left + (i / (n - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  const viewsLine = buildLine(data.map((d) => d.views), x, y);
  const clicksLine = buildLine(data.map((d) => d.clicks), x, y);
  const viewsArea = `${viewsLine} L${x(n - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;
  const xTickIdx = xTickIndices(n);
  const isSingleDay = n === 1;
  const chartHeight = isSingleDay && compactSingleDay ? 200 : height;

  return (
    <div className={`w-full min-w-0 ${isSingleDay && compactSingleDay ? "mx-auto max-w-sm" : ""}`}>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        {!clicksOnly ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: "var(--chart-1)" }} />
            Lượt xem
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: "var(--chart-2)" }} />
          Lượt bấm
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VBW} ${chartHeight}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={
          isSingleDay
            ? clicksOnly
              ? "Biểu đồ cột lượt bấm hôm nay"
              : "Biểu đồ cột lượt xem và lượt bấm hôm nay"
            : clicksOnly
              ? "Biểu đồ lượt bấm theo ngày"
              : "Biểu đồ lượt xem và lượt bấm theo ngày"
        }
      >
        {!isSingleDay ? (
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
        ) : null}

        {isSingleDay ? (
          <SingleDayBars
            point={data[0]}
            height={chartHeight}
            clicksOnly={clicksOnly}
            compact={compactSingleDay}
            yMax={yMax}
            yTicks={yTicks}
          />
        ) : (
          <>
            {yTicks.map((t) => {
              const gy = y(t);
              return (
                <g key={t}>
                  <line
                    x1={PAD.left}
                    x2={VBW - PAD.right}
                    y1={gy}
                    y2={gy}
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 8}
                    y={gy + 3}
                    textAnchor="end"
                    fontSize={10}
                    fill="var(--muted-foreground)"
                  >
                    {t.toLocaleString("vi-VN")}
                  </text>
                </g>
              );
            })}

            {!clicksOnly ? (
              <>
                <path d={viewsArea} fill={`url(#${gradId})`} stroke="none" />
                <path
                  d={viewsLine}
                  fill="none"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            ) : null}
            <path
              d={clicksLine}
              fill="none"
              stroke="var(--chart-2)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {data.map((d, i) => (
              <g key={d.day}>
                {!clicksOnly ? (
                  <circle cx={x(i)} cy={y(d.views)} r={3.5} fill="var(--chart-1)" />
                ) : null}
                <circle cx={x(i)} cy={y(d.clicks)} r={3.5} fill="var(--chart-2)" />
              </g>
            ))}

            {xTickIdx.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={height - 10}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                fontSize={n <= 7 ? 10 : 9}
                fill="var(--muted-foreground)"
              >
                {formatDay(data[i].day)}
              </text>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}
