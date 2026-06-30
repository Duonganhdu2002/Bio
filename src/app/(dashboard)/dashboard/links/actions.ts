"use server";

import { revalidateTag } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/validation/url";
import { getPlatformLabel } from "@/lib/links/platforms";
import { type ActionResult, fail, ok } from "@/lib/dashboard/action-result";
import type { Link } from "@/lib/types";

export type LinkInput = {
  title: string;
  url: string;
  platform: string | null;
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
  // Next 16: revalidateTag yêu cầu profile cache-life thứ 2 ("max" = purge ngay).
  revalidateTag(`profile:${username}`, "max");
}

export async function createLink(input: LinkInput): Promise<ActionResult<Link>> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const title = input.title.trim() || getPlatformLabel(input.platform);
  if (!title) return fail("Vui lòng chọn nền tảng.");

  const url = normalizeUrl(input.url);
  if (!url.ok) return fail(url.message);

  const { data: last } = await ctx.supabase
    .from("links")
    .select("position")
    .eq("profile_id", ctx.profile.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (last?.position ?? -1) + 1;

  const { data, error } = await ctx.supabase
    .from("links")
    .insert({
      profile_id: ctx.profile.id,
      title,
      url: url.url,
      platform: input.platform,
      position: nextPosition,
      is_active: input.isActive,
    })
    .select("*")
    .single();

  if (error) return fail("Không thêm được link. Vui lòng thử lại.");
  revalidateProfile(ctx.profile.username);
  return ok(data as Link);
}

export async function updateLink(
  id: string,
  input: LinkInput,
): Promise<ActionResult<Link>> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const title = input.title.trim() || getPlatformLabel(input.platform);
  if (!title) return fail("Vui lòng chọn nền tảng.");

  const url = normalizeUrl(input.url);
  if (!url.ok) return fail(url.message);

  const { data, error } = await ctx.supabase
    .from("links")
    .update({
      title,
      url: url.url,
      platform: input.platform,
      is_active: input.isActive,
    })
    .eq("id", id)
    .eq("profile_id", ctx.profile.id)
    .select("*")
    .single();

  if (error) return fail("Không cập nhật được link. Vui lòng thử lại.");
  revalidateProfile(ctx.profile.username);
  return ok(data as Link);
}

export async function toggleLinkActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase
    .from("links")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("profile_id", ctx.profile.id);

  if (error) return fail("Không cập nhật được trạng thái.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}

export async function deleteLink(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase
    .from("links")
    .delete()
    .eq("id", id)
    .eq("profile_id", ctx.profile.id);

  if (error) return fail("Không xoá được link.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}

export async function reorderLinks(ids: string[]): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase.rpc("reorder_links", { p_ids: ids });
  if (error) return fail("Không lưu được thứ tự.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}
