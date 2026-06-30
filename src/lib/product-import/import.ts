import { createAdminClient } from "@/lib/supabase/admin";

export type ProductMetadata = {
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  /** URL trang sản phẩm thật sau khi resolve link rút gọn. */
  sourceUrl: string;
};

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const SHOPEE_HOSTS = new Set([
  "shopee.vn",
  "shopee.com",
  "shopee.com.my",
  "shopee.co.id",
  "shopee.co.th",
  "shopee.ph",
  "shopee.sg",
  "shopee.tw",
  "s.shopee.vn",
  "shp.ee",
  "shope.ee",
  "vn.shp.ee",
]);

const TIKTOK_HOSTS = new Set([
  "tiktok.com",
  "www.tiktok.com",
  "shop.tiktok.com",
  "vt.tiktok.com",
  "vm.tiktok.com",
  "m.tiktok.com",
]);

const IMAGE_HOST_SUFFIXES = [
  ".susercontent.com",
  ".shopeemobile.com",
  ".tiktokcdn.com",
  ".tiktokcdn-us.com",
  ".byteimg.com",
  ".ttcdn-us.com",
];

const IMAGE_HOSTS = new Set(["cf.shopee.vn"]);

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

/** Bot preview (Zalo/Messenger) — Shopee redirect link rút gọn sang trang sản phẩm thật. */
const CRAWLER_UA = "Mozilla/5.0 (compatible; ZaloBot/1.0)";

/** Bot social preview (Facebook/Zalo card) — Shopee trả SSR + Open Graph cho trang sản phẩm. */
const PREVIEW_BOT_UA = "Mozilla/5.0 (compatible; facebookexternalhit/1.1)";

const SHOPEE_SHORT_HOSTS = new Set([
  "s.shopee.vn",
  "shp.ee",
  "shope.ee",
  "vn.shp.ee",
]);

/** Phát hiện link Shopee/TikTok đủ điều kiện auto-import. */
export function isImportableProductUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 12) return false;
  try {
    const host = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`,
    ).hostname.toLowerCase();
    return (
      [...SHOPEE_HOSTS].some((h) => host === h || host.endsWith(`.${h}`)) ||
      [...TIKTOK_HOSTS].some((h) => host === h || host.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}

export async function fetchProductMetadata(url: string): Promise<ProductMetadata> {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();

  if (isShopeeHost(host)) {
    const productUrl = await resolveShopeeProductUrl(url);
    return fetchShopeeMetadata(productUrl);
  }
  if (isTiktokHost(host)) {
    const resolved = await resolveProductUrl(url);
    return fetchTiktokMetadata(resolved);
  }

  throw new Error("Chỉ hỗ trợ link Shopee hoặc TikTok Shop.");
}

/** Tải ảnh từ CDN nền tảng → upload Supabase Storage. Trả null khi không mirror được. */
export async function mirrorProductImage(
  imageUrl: string,
  userId: string,
): Promise<string | null> {
  const normalized = normalizeImageUrl(imageUrl);
  if (!normalized || !isAllowedImageUrl(normalized)) {
    return null;
  }

  const res = await fetchImage(normalized);
  if (!res.ok) return null;

  const buffer = Buffer.from(await readLimited(res, MAX_IMAGE_BYTES));
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/jpeg";
  if (!contentType.startsWith("image/")) return null;

  const ext =
    contentType.includes("webp") ? "webp" : contentType.includes("png") ? "png" : "jpeg";

  const admin = createAdminClient();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.import.${ext}`;
  const { error } = await admin.storage.from("products").upload(path, buffer, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return null;

  const { data } = admin.storage.from("products").getPublicUrl(path);
  return data.publicUrl;
}

async function fetchShopeeMetadata(url: string): Promise<ProductMetadata> {
  if (/\/error_page/i.test(url)) {
    throw new Error("Link Shopee không còn hoạt động. Hãy dán link sản phẩm đầy đủ từ shopee.vn.");
  }

  let html = "";
  let meta: Record<string, string> = {};

  // Shopee chỉ SSR Open Graph cho social preview bots (Facebook/Zalo card), không phải mobile UA.
  for (const ua of [PREVIEW_BOT_UA, CRAWLER_UA]) {
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": ua,
        Accept: "text/html",
        "Accept-Language": "vi-VN,vi;q=0.9",
      },
    });
    if (!res.ok) continue;

    html = await readLimitedText(res, MAX_HTML_BYTES);
    meta = parseMetaTags(html);
    const candidate = cleanShopeeTitle(meta["og:title"] ?? meta["twitter:title"] ?? "");
    if (candidate && !isGenericShopeeMetadata(candidate, meta)) break;
  }

  const title = cleanShopeeTitle(meta["og:title"] ?? meta["twitter:title"] ?? "");
  if (!title || isGenericShopeeMetadata(title, meta)) {
    throw new Error(
      "Không đọc được thông tin sản phẩm. Hãy thử lại hoặc dán link đầy đủ từ trang sản phẩm Shopee.",
    );
  }

  const rawImage = meta["og:image"] ?? meta["twitter:image"];
  const imageUrl = isShopeeBrandImage(rawImage)
    ? extractShopeeImageFromHtml(html)
    : normalizeImageUrl(rawImage) ?? extractShopeeImageFromHtml(html);
  const description = cleanShopeeDescription(meta["og:description"] ?? null);
  const price = extractShopeePrice(html, meta);
  const currency = meta["product:price:currency"]?.toUpperCase() || "VND";

  return { title, description, price, currency, imageUrl, sourceUrl: url };
}

async function fetchTiktokMetadata(url: string): Promise<ProductMetadata> {
  // Video TikTok: oEmbed (tên + thumbnail, không có giá).
  if (/\/@[^/]+\/video\//.test(url)) {
    return fetchTiktokOembed(url);
  }

  const res = await safeFetch(url, {
    headers: {
      "User-Agent": MOBILE_UA,
      "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error("Không mở được trang TikTok.");

  const html = await readLimitedText(res, MAX_HTML_BYTES);
  if (/Security Check|captcha_container/i.test(html)) {
    throw new Error(
      "TikTok chặn truy cập tự động. Hãy dán link Shopee, hoặc nhập tên/giá/ảnh thủ công.",
    );
  }

  const meta = parseMetaTags(html);
  const fromJson = extractTiktokJson(html);

  const title =
    fromJson.title ??
    cleanGenericTitle(meta["og:title"]) ??
    meta["twitter:title"] ??
    "";
  if (!title || title.toLowerCase() === "tiktok shop") {
    throw new Error(
      "Không lấy được thông tin từ TikTok. Thử link Shopee hoặc nhập thủ công.",
    );
  }

  const imageUrl = normalizeImageUrl(
    fromJson.imageUrl ?? meta["og:image"] ?? meta["twitter:image"],
  );
  const price = fromJson.price ?? parsePrice(meta["product:price:amount"]);
  const currency =
    fromJson.currency ?? meta["product:price:currency"]?.toUpperCase() ?? "VND";

  return {
    title,
    description: fromJson.description ?? meta["og:description"] ?? null,
    price,
    currency,
    imageUrl,
    sourceUrl: url,
  };
}

async function fetchTiktokOembed(url: string): Promise<ProductMetadata> {
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const res = await safeFetch(oembedUrl, {
    headers: { "User-Agent": MOBILE_UA },
  });
  if (!res.ok) {
    throw new Error("Không lấy được thông tin video TikTok.");
  }

  const data = (await res.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };

  const title = data.title?.trim() || data.author_name?.trim();
  if (!title) throw new Error("Không đọc được tên từ video TikTok.");

  return {
    title,
    description: null,
    price: null,
    currency: "VND",
    imageUrl: normalizeImageUrl(data.thumbnail_url ?? null),
    sourceUrl: url,
  };
}

async function resolveShopeeProductUrl(raw: string): Promise<string> {
  if (/\/error_page/i.test(raw)) {
    throw new Error("Link Shopee không còn hoạt động. Hãy dán link sản phẩm đầy đủ từ shopee.vn.");
  }

  let current = raw;
  const host = new URL(raw).hostname.toLowerCase();

  // Link rút gọn: dùng bot UA để nhận redirect 301 (giống Zalo/Messenger preview).
  if (isShopeeShortHost(host)) {
    current = await followRedirects(raw, CRAWLER_UA);
  }

  // Trang ULS (s.shopee.vn) nhúng URL thật trong CONFIG.httpUrl.
  if (isShopeeShortHost(new URL(current).hostname.toLowerCase())) {
    const html = await fetchHtml(current, MOBILE_UA);
    const httpUrl = extractShopeeConfigUrl(html);
    if (httpUrl) current = httpUrl;
  }

  const ids = extractShopeeIds(current);
  if (ids) {
    const shopeeHost = new URL(current).hostname;
    return buildShopeeProductUrl(ids.shopId, ids.itemId, shopeeHost);
  }

  return current;
}

async function resolveProductUrl(raw: string): Promise<string> {
  let current = raw;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    assertAllowedProductUrl(current);
    const res = await safeFetch(current, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": MOBILE_UA },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) break;
      current = new URL(location, current).toString();
      if (/\/error_page/i.test(current)) {
        throw new Error("Link Shopee không còn hoạt động. Hãy dán link sản phẩm đầy đủ từ shopee.vn.");
      }
      continue;
    }

    if (res.status >= 200 && res.status < 300) return current;
    throw new Error("Link sản phẩm không hợp lệ hoặc đã bị xoá.");
  }
  return current;
}

function assertAllowedProductUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Đường dẫn không hợp lệ.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Chỉ chấp nhận link https.");
  }
  const host = parsed.hostname.toLowerCase();
  if (!isShopeeHost(host) && !isTiktokHost(host)) {
    throw new Error("Chỉ hỗ trợ link Shopee hoặc TikTok.");
  }
  if (isBlockedHost(host)) {
    throw new Error("Đường dẫn không hợp lệ.");
  }
}

function isBlockedHost(host: string): boolean {
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === "[::1]"
  );
}

function isShopeeHost(host: string): boolean {
  return [...SHOPEE_HOSTS].some((h) => host === h || host.endsWith(`.${h}`));
}

function isTiktokHost(host: string): boolean {
  return [...TIKTOK_HOSTS].some((h) => host === h || host.endsWith(`.${h}`));
}

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (isBlockedHost(host)) return false;
    if (IMAGE_HOSTS.has(host)) return true;
    return IMAGE_HOST_SUFFIXES.some(
      (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

async function fetchImage(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": MOBILE_UA,
        Referer: "https://shopee.vn/",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function followRedirects(raw: string, userAgent: string): Promise<string> {
  let current = raw;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    assertAllowedProductUrl(current);
    const res = await fetchWithTimeout(current, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": userAgent },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) break;
      current = new URL(location, current).toString();
      if (/\/error_page/i.test(current)) {
        throw new Error("Link Shopee không còn hoạt động. Hãy dán link sản phẩm đầy đủ từ shopee.vn.");
      }
      continue;
    }

    if (res.status >= 200 && res.status < 300) return current;
    throw new Error("Link sản phẩm không hợp lệ hoặc đã bị xoá.");
  }
  return current;
}

async function fetchHtml(url: string, userAgent: string): Promise<string> {
  assertAllowedProductUrl(url);
  const res = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": userAgent,
      "Accept-Language": "vi-VN,vi;q=0.9",
    },
  });
  if (!res.ok) throw new Error("Không mở được trang Shopee.");
  return readLimitedText(res, MAX_HTML_BYTES);
}

function extractShopeeConfigUrl(html: string): string | null {
  const match = html.match(/httpUrl\s*:\s*"((?:\\.|[^"\\])+)"/);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1].replace(/\\\//g, "/");
  }
}

function extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const patterns = [
    /\/opaanlp\/(\d+)\/(\d+)/i,
    /\/product\/(\d+)\/(\d+)/i,
    /-i\.(\d+)\.(\d+)/i,
    /\.(\d+)\.(\d+)\/?(?:[?#]|$)/,
  ];

  const target = `${parsed.pathname}${parsed.search}`;
  for (const pattern of patterns) {
    const match = target.match(pattern);
    if (match?.[1] && match[2]) {
      return { shopId: match[1], itemId: match[2] };
    }
  }
  return null;
}

function buildShopeeProductUrl(
  shopId: string,
  itemId: string,
  host: string,
): string {
  return `https://${host}/product-i.${shopId}.${itemId}`;
}

function isShopeeShortHost(host: string): boolean {
  return [...SHOPEE_SHORT_HOSTS].some((h) => host === h || host.endsWith(`.${h}`));
}

function isGenericShopeeMetadata(
  title: string,
  meta: Record<string, string>,
): boolean {
  const t = title.toLowerCase();
  if (t.includes("mua và bán trên ứng dụng")) return true;
  if (t === "shopee việt nam") return true;
  const image = meta["og:image"] ?? "";
  if (image.includes("/homepagefe/")) return true;
  return false;
}

function isShopeeBrandImage(raw: string | undefined): boolean {
  if (!raw) return false;
  return raw.includes("/homepagefe/") || raw.includes("tts-logo");
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  assertAllowedProductUrl(url);
  return fetchWithTimeout(url, init);
}

async function readLimited(res: Response, maxBytes: number): Promise<ArrayBuffer> {
  const reader = res.body?.getReader();
  if (!reader) return res.arrayBuffer();

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) throw new Error("Phản hồi quá lớn.");
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

async function readLimitedText(res: Response, maxBytes: number): Promise<string> {
  const buffer = await readLimited(res, maxBytes);
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

function parseMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const re =
    /<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']([^"']+)["'][^>]*>/gi;

  for (const match of html.matchAll(re)) {
    const key = (match[1] ?? match[4] ?? "").trim().toLowerCase();
    const value = decodeHtmlEntities((match[2] ?? match[3] ?? "").trim());
    if (key && value) meta[key] = value;
  }
  return meta;
}

function extractShopeePrice(
  html: string,
  meta: Record<string, string>,
): number | null {
  const og = parsePrice(meta["product:price:amount"]);
  if (og != null) return og;

  const inflated =
    html.match(/"price_min"\s*:\s*(\d+)/)?.[1] ??
    html.match(/"price"\s*:\s*(\d{7,})/)?.[1];
  if (inflated) {
    const value = Number(inflated) / 100_000;
    if (Number.isFinite(value) && value > 0) return Math.round(value);
  }

  const visible = html.match(/₫\s*([\d.,]+)/);
  if (visible) {
    const value = Number(visible[1].replace(/\./g, "").replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) return value;
  }

  return null;
}

function extractTiktokJson(html: string): {
  title?: string;
  description?: string | null;
  price?: number | null;
  currency?: string;
  imageUrl?: string | null;
} {
  const scriptMatch = html.match(
    /<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!scriptMatch?.[1]) return {};

  try {
    const root = JSON.parse(scriptMatch[1]) as Record<string, unknown>;
    const blob = JSON.stringify(root);

    const title =
      blob.match(/"title"\s*:\s*"((?:\\.|[^"\\])+)"/)?.[1] ??
      blob.match(/"product_name"\s*:\s*"((?:\\.|[^"\\])+)"/)?.[1];
    const image =
      blob.match(/"cover"\s*:\s*"((?:\\.|[^"\\])+)"/)?.[1] ??
      blob.match(/"image"\s*:\s*"((?:\\.|[^"\\])+)"/)?.[1];
    const priceRaw =
      blob.match(/"sale_price"\s*:\s*(\d+)/)?.[1] ??
      blob.match(/"real_price"\s*:\s*"([\d.]+)"/)?.[1] ??
      blob.match(/"price"\s*:\s*(\d+)/)?.[1];

    return {
      title: title ? JSON.parse(`"${title}"`) : undefined,
      description: null,
      price: priceRaw ? parsePrice(priceRaw) : null,
      currency: "VND",
      imageUrl: image ? JSON.parse(`"${image}"`) : null,
    };
  } catch {
    return {};
  }
}

function cleanShopeeTitle(raw: string): string {
  return raw.replace(/\s*\|\s*Shopee\s+.*$/i, "").trim();
}

function cleanShopeeDescription(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const m = trimmed.match(/^Mua\s+(.+?)\s+giá tốt/i);
  if (m?.[1]) return m[1].trim();
  return trimmed.length > 240 ? `${trimmed.slice(0, 237)}…` : trimmed;
}

function cleanGenericTitle(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t || t.toLowerCase() === "tiktok shop") return null;
  return t;
}

function normalizeImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url = decodeHtmlEntities(raw.trim());
  if (url.startsWith("//")) url = `https:${url}`;
  if (url.startsWith("http://")) url = `https://${url.slice("http://".length)}`;
  if (!url.startsWith("https://")) return null;
  return url;
}

function extractShopeeImageFromHtml(html: string): string | null {
  const patterns = [
    /https:\\\/\\\/down-[a-z0-9-]+\.img\.susercontent\.com\\\/file\\\/[a-zA-Z0-9]+/,
    /https:\/\/down-[a-z0-9-]+\.img\.susercontent\.com\/file\/[a-zA-Z0-9@._-]+/,
    /https:\/\/cf\.shopee\.vn\/file\/[a-zA-Z0-9]+/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[0]) {
      return normalizeImageUrl(match[0].replace(/\\\//g, "/"));
    }
  }
  return null;
}

function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const value = Number(String(raw).replace(/[^\d.]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
