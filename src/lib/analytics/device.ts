export type Device = "mobile" | "tablet" | "desktop";

/**
 * Suy ra loại thiết bị từ User-Agent — đủ tốt cho thống kê, không kéo thư viện nặng.
 * Kiểm tra tablet trước vì nhiều UA tablet cũng chứa "android"/"mobile".
 */
export function parseDevice(ua: string | null | undefined): Device {
  if (!ua) return "desktop";
  const s = ua.toLowerCase();

  if (/ipad|tablet|playbook|silk|kindle|(android(?!.*mobile))/.test(s)) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini|windows phone/.test(s)) {
    return "mobile";
  }
  return "desktop";
}
