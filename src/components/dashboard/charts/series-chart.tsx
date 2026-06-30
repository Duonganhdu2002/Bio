"use client";

import { useId } from "react";
import type { DailyPoint } from "@/lib/analytics/queries";

type Props = {
  data: DailyPoint[];
  height?: number;
  /** Chỉ hiển thị lượt bấm (trang chi tiết sản phẩm). */
  clicksOnly?: boolean;
};

// Vẽ tay bằng SVG để không kéo thư viện chart vào bundle.
const VBW = 640;
const PAD = { top: 16, right: 16, bottom: 26, left: 36 };

function formatDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function buildLine(values: number[], x: (i: number) => number, y: (v: number) => number) {
  return values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
}

export function SeriesChart({ data, height = 240, clicksOnly = false }: Props) {
  const gradId = useId();
  const n = data.length;
  const innerW = VBW - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const maxVal = Math.max(
    1,
    ...data.map((d) => (clicksOnly ? d.clicks : Math.max(d.views, d.clicks))),
  );
  const x = (i: number) => (n <= 1 ? PAD.left + innerW / 2 : PAD.left + (i / (n - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const viewsLine = buildLine(data.map((d) => d.views), x, y);
  const clicksLine = buildLine(data.map((d) => d.clicks), x, y);
  const viewsArea = `${viewsLine} L${x(n - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;

  const yTicks = [0, maxVal / 2, maxVal];
  const xTickIdx = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <div className="w-full">
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
        viewBox={`0 0 ${VBW} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          clicksOnly ? "Biểu đồ lượt bấm theo ngày" : "Biểu đồ lượt xem và lượt bấm theo ngày"
        }
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => {
          const gy = y(t);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={VBW - PAD.right}
                y1={gy}
                y2={gy}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={gy + 3}
                textAnchor="end"
                fontSize={10}
                fill="var(--muted-foreground)"
              >
                {Math.round(t)}
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
        />

        {n === 1 && (
          <>
            {!clicksOnly ? (
              <circle cx={x(0)} cy={y(data[0].views)} r={3} fill="var(--chart-1)" />
            ) : null}
            <circle cx={x(0)} cy={y(data[0].clicks)} r={3} fill="var(--chart-2)" />
          </>
        )}

        {xTickIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 8}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            fontSize={10}
            fill="var(--muted-foreground)"
          >
            {formatDay(data[i].day)}
          </text>
        ))}
      </svg>
    </div>
  );
}
