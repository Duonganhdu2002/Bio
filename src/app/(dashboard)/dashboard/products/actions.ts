"use server";

import { revalidateTag } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/validation/url";
import { isStorageImageUrl } from "@/lib/validation/image-url";
import { toPriceCents } from "@/lib/format";
import { type ActionResult, fail, ok } from "@/lib/dashboard/action-result";
import {
  fetchProductMetadata,
  mirrorProductImage,
} from "@/lib/product-import/import";
import { isRateLimited } from "@/lib/rate-limit";
import type { Product } from "@/lib/types";

export type ProductInput = {
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  url: string | null;
  categoryId: string | null;
  isActive: boolean;
};

export type ProductImportData = {
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  url: string;
  imageWarning: string | null;
};

const NOT_AUTH = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

async function getContext() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  return { profile, supabase };
}

function revalidateProfile(username: string) {
  // Next 16: revalidateTag yêu cầu profile cache-life thứ 2 ("max" = purge ngay).
  revalidateTag(`profile:${username}`, "max");
}

/** Chuẩn hoá input dùng chung cho create/update. */
async function prepare(
  input: ProductInput,
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
): Promise<ActionResult<{
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
  category_id: string | null;
  is_active: boolean;
}>> {
  const title = input.title.trim();
  if (!title) return fail("Vui lòng nhập tên sản phẩm.");

  let url: string | null = null;
  if (input.url && input.url.trim()) {
    const parsed = normalizeUrl(input.url);
    if (!parsed.ok) return fail(parsed.message);
    url = parsed.url;
  }

  if (input.price != null && (Number.isNaN(input.price) || input.price < 0)) {
    return fail("Giá không hợp lệ.");
  }

  // Ảnh chỉ được phép là object public của Supabase Storage (do form upload).
  const imageUrl = input.imageUrl?.trim() || null;
  if (imageUrl && !isStorageImageUrl(imageUrl)) {
    return fail("Ảnh sản phẩm không hợp lệ.");
  }

  const currency = input.currency || "VND";
  const price_cents =
    input.price != null ? toPriceCents(input.price, currency) : null;

  let category_id: string | null = input.categoryId || null;
  if (category_id) {
    const { data: cat } = await supabase
      .from("product_categories")
      .select("id")
      .eq("id", category_id)
      .eq("profile_id", profileId)
      .maybeSingle();
    if (!cat) return fail("Danh mục không hợp lệ.");
  }

  return ok({
    title,
    description: input.description?.trim() || null,
    image_url: imageUrl,
    price_cents,
    currency,
    url,
    category_id,
    is_active: input.isActive,
  });
}

/** Lấy tên/giá/ảnh từ link Shopee hoặc TikTok, mirror ảnh lên Storage. */
export async function importProductFromUrl(
  rawUrl: string,
): Promise<ActionResult<ProductImportData>> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const parsed = normalizeUrl(rawUrl);
  if (!parsed.ok) return fail(parsed.message);

  if (await isRateLimited(`product-import:${ctx.profile.id}`, 12, 60)) {
    return fail("Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.");
  }

  try {
    const metadata = await fetchProductMetadata(parsed.url);
    let imageUrl: string | null = null;
    let imageWarning: string | null = null;

    if (metadata.imageUrl) {
      imageUrl = await mirrorProductImage(metadata.imageUrl, ctx.profile.id);
      if (!imageUrl) {
        imageWarning =
          "Không tải được ảnh tự động. Bạn có thể bấm \"Chọn ảnh\" để upload thủ công.";
      }
    }

    return ok({
      title: metadata.title,
      description: metadata.description,
      price: metadata.price,
      currency: metadata.currency,
      imageUrl,
      url: metadata.sourceUrl,
      imageWarning,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Không lấy được thông tin sản phẩm. Vui lòng nhập thủ công.";
    return fail(message);
  }
}

export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<Product>> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const prepared = await prepare(input, ctx.supabase, ctx.profile.id);
  if (!prepared.ok) return prepared;

  const { data: last } = await ctx.supabase
    .from("products")
    .select("position")
    .eq("profile_id", ctx.profile.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (last?.position ?? -1) + 1;

  const { data, error } = await ctx.supabase
    .from("products")
    .insert({
      profile_id: ctx.profile.id,
      position: nextPosition,
      ...prepared.data,
    })
    .select("*")
    .single();

  if (error) return fail("Không thêm được sản phẩm. Vui lòng thử lại.");
  revalidateProfile(ctx.profile.username);
  return ok(data as Product);
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult<Product>> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const prepared = await prepare(input, ctx.supabase, ctx.profile.id);
  if (!prepared.ok) return prepared;

  const { data, error } = await ctx.supabase
    .from("products")
    .update(prepared.data)
    .eq("id", id)
    .eq("profile_id", ctx.profile.id)
    .select("*")
    .single();

  if (error) return fail("Không cập nhật được sản phẩm. Vui lòng thử lại.");
  revalidateProfile(ctx.profile.username);
  return ok(data as Product);
}

export async function toggleProductActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("profile_id", ctx.profile.id);

  if (error) return fail("Không cập nhật được trạng thái.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("profile_id", ctx.profile.id);

  if (error) return fail("Không xoá được sản phẩm.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}

/** Ghim ≤3 sản phẩm theo thứ tự mảng (vị trí 1..3). Mảng rỗng = bỏ ghim hết. */
export async function setPinnedProducts(
  ids: string[],
): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  if (ids.length > 3) return fail("Chỉ được ghim tối đa 3 sản phẩm.");

  const { error } = await ctx.supabase.rpc("set_pinned_products", {
    p_product_ids: ids,
  });
  if (error) return fail("Không lưu được sản phẩm ghim.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}

export async function reorderProducts(ids: string[]): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase.rpc("reorder_products", { p_ids: ids });
  if (error) return fail("Không lưu được thứ tự.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}
