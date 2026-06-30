"use server";

import { revalidateTag } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type CategorySection } from "@/lib/category-section";
import { type ActionResult, fail, ok } from "@/lib/dashboard/action-result";
import type { ProductCategory } from "@/lib/types";

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

export async function createProductCategory(
  name: string,
  section: CategorySection = "product",
): Promise<ActionResult<ProductCategory>> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const trimmed = name.trim();
  if (!trimmed) return fail("Vui lòng nhập tên danh mục.");

  const { data: last } = await ctx.supabase
    .from("product_categories")
    .select("position")
    .eq("profile_id", ctx.profile.id)
    .eq("section", section)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (last?.position ?? -1) + 1;

  const { data, error } = await ctx.supabase
    .from("product_categories")
    .insert({
      profile_id: ctx.profile.id,
      name: trimmed,
      section,
      position: nextPosition,
    })
    .select("*")
    .single();

  if (error) return fail("Không thêm được danh mục. Vui lòng thử lại.");
  revalidateProfile(ctx.profile.username);
  return ok(data as ProductCategory);
}

export async function updateProductCategory(
  id: string,
  name: string,
): Promise<ActionResult<ProductCategory>> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const trimmed = name.trim();
  if (!trimmed) return fail("Vui lòng nhập tên danh mục.");

  const { data, error } = await ctx.supabase
    .from("product_categories")
    .update({ name: trimmed })
    .eq("id", id)
    .eq("profile_id", ctx.profile.id)
    .select("*")
    .single();

  if (error) return fail("Không cập nhật được danh mục. Vui lòng thử lại.");
  revalidateProfile(ctx.profile.username);
  return ok(data as ProductCategory);
}

export async function deleteProductCategory(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase
    .from("product_categories")
    .delete()
    .eq("id", id)
    .eq("profile_id", ctx.profile.id);

  if (error) return fail("Không xoá được danh mục.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}

export async function reorderProductCategories(
  ids: string[],
): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx) return fail(NOT_AUTH);

  const { error } = await ctx.supabase.rpc("reorder_product_categories", {
    p_ids: ids,
  });
  if (error) return fail("Không lưu được thứ tự danh mục.");
  revalidateProfile(ctx.profile.username);
  return ok(undefined);
}
