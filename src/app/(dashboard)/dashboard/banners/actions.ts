"use server";

import { revalidateTag } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/validation/url";
import { type ActionResult, fail, ok } from "@/lib/dashboard/action-result";
import type { ProfileBanner } from "@/lib/types";
import type { BannerSection } from "@/lib/banner-section";

export type BannerInput = {
  name: string;
  imageUrl: string;
  url: string | null;
  section: BannerSection;
  isActive: boolean;
};

const NOT_AUTH = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

async function getContext() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  return { profile, supabase };
}

function revalidateProfile(username: string) {
  revalidateTag(`profile:${username}`, "max");
}

export async function createBanner(input: BannerInput): Promise<ActionResult<ProfileBanner>> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const name = input.name.trim();
  const isBrand = input.section === "brand";
  if (!name) return fail(isBrand ? "Vui lòng nhập tên brand." : "Vui lòng nhập tên chiến dịch.");

  const imageUrl = input.imageUrl.trim();
  if (!imageUrl) return fail(isBrand ? "Vui lòng tải ảnh brand lên." : "Vui lòng tải ảnh banner lên.");

  let url: string | null = null;
  if (input.url?.trim()) {
    const normalized = normalizeUrl(input.url);
    if (!normalized.ok) return fail(normalized.message);
    url = normalized.url;
  }

  const { data: last } = await ctx.supabase
    .from("profile_banners")
    .select("position")
    .eq("profile_id", ctx.profile.id)
    .eq("section", input.section)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (last?.position ?? -1) + 1;

  const { data, error } = await ctx.supabase
    .from("profile_banners")
    .insert({
      profile_id: ctx.profile.id,
      name,
      image_url: imageUrl,
      url,
      section: input.section,
      position: nextPosition,
      is_active: input.isActive,
    })
    .select("*")
    .single();

  if (error) return fail("Không thêm được banner. Vui lòng thử lại.");
  revalidateProfile(ctx.profile.username);
  return ok(data as ProfileBanner);
}

export async function updateBanner(
  id: string,
  input: BannerInput,
): Promise<ActionResult<ProfileBanner>> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const name = input.name.trim();
  const isBrand = input.section === "brand";
  if (!name) return fail(isBrand ? "Vui lòng nhập tên brand." : "Vui lòng nhập tên chiến dịch.");

  const imageUrl = input.imageUrl.trim();
  if (!imageUrl) return fail(isBrand ? "Vui lòng tải ảnh brand lên." : "Vui lòng tải ảnh banner lên.");

  let url: string | null = null;
  if (input.url?.trim()) {
    const normalized = normalizeUrl(input.url);
    if (!normalized.ok) return fail(normalized.message);
    url = normalized.url;
  }

  const { data, error } = await ctx.supabase
    .from("profile_banners")
    .update({
      name,
      image_url: imageUrl,
      url,
      section: input.section,
      is_active: input.isActive,
    })
    .eq("id", id)
    .eq("profile_id", ctx.profile.id)
    .select("*")
    .single();

  if (error) return fail("Không cập nhật được banner. Vui lòng thử lại.");
  revalidateProfile(ctx.profile.username);
  return ok(data as ProfileBanner);
}

export async function toggleBannerActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase
    .from("profile_banners")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("profile_id", ctx.profile.id);

  if (error) return fail("Không cập nhật được trạng thái.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase
    .from("profile_banners")
    .delete()
    .eq("id", id)
    .eq("profile_id", ctx.profile.id);

  if (error) return fail("Không xoá được banner.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}

export async function reorderBanners(ids: string[]): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase.rpc("reorder_profile_banners", { p_ids: ids });
  if (error) return fail("Không lưu được thứ tự.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}
