/**
 * Helper tracking phía client. Dùng `navigator.sendBeacon` để gửi nền,
 * KHÔNG chặn điều hướng khi người dùng bấm link (request vẫn đi khi trang unload).
 * Fallback `fetch(keepalive)` cho môi trường không hỗ trợ sendBeacon.
 *
 * Server (`/api/track`) tự suy `country` (header CDN) và `device` (User-Agent),
 * nên payload từ client giữ tối thiểu.
 */

const ENDPOINT = "/api/track";

type TrackPayload = {
  profileId: string;
  type: "page_view" | "click";
  targetType?: "link" | "product";
  targetId?: string;
  referrer?: string;
};

function send(payload: TrackPayload) {
  if (typeof navigator === "undefined") return;

  const body = JSON.stringify(payload);

  if (typeof navigator.sendBeacon === "function") {
    // text/plain để tránh preflight CORS và khớp cách edge route parse body.
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon(ENDPOINT, blob)) return;
  }

  void fetch(ENDPOINT, {
    method: "POST",
    body,
    keepalive: true,
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
  }).catch(() => {
    /* fire-and-forget: nuốt lỗi, không ảnh hưởng trải nghiệm */
  });
}

/** Ghi 1 lượt xem trang public. Gọi 1 lần khi trang public mount. */
export function trackPageView(profileId: string) {
  send({
    profileId,
    type: "page_view",
    referrer:
      typeof document !== "undefined" ? document.referrer || undefined : undefined,
  });
}

/** Ghi 1 lượt bấm vào link/sản phẩm trước khi điều hướng. */
export function trackClick(
  profileId: string,
  targetType: "link" | "product",
  targetId: string,
) {
  send({ profileId, type: "click", targetType, targetId });
}
