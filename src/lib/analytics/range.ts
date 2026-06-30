export type AnalyticsRange = 1 | 7 | 30 | 90;
export const ANALYTICS_RANGES: AnalyticsRange[] = [1, 7, 30, 90];

/** Ép searchParams (?range=) về một khoảng hợp lệ, mặc định 7 ngày. */
export function parseRange(value: string | string[] | undefined): AnalyticsRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (ANALYTICS_RANGES as number[]).includes(n) ? (n as AnalyticsRange) : 7;
}

/** Nhãn mô tả khoảng thời gian (biểu đồ, card). */
export function rangePeriodLabel(range: AnalyticsRange): string {
  return range === 1 ? "Hôm nay" : `${range} ngày gần nhất`;
}
