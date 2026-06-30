"use server";

import { revalidateTag } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BIO_TEMPLATE_KEYS } from "@/components/bio/theme";
import { isStorageImageUrl } from "@/lib/validation/image-url";
import { type ActionResult, fail, ok } from "@/lib/dashboard/action-result";

export type AppearanceInput = {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  template: string;
};

const VALID_TEMPLATES = new Set<string>(BIO_TEMPLATE_KEYS);

export async function updateAppearance(
  input: AppearanceInput,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return fail("Phiên đăng nhập đã hết hạn.");

  const template = VALID_TEMPLATES.has(input.template)
    ? input.template
    : "stack";

  const avatarUrl = input.avatarUrl?.trim() || null;
  if (avatarUrl && !isStorageImageUrl(avatarUrl)) {
    return fail("Ảnh đại diện không hợp lệ.");
  }

  const coverUrl = input.coverUrl?.trim() || null;
  if (coverUrl && !isStorageImageUrl(coverUrl)) {
    return fail("Ảnh nền không hợp lệ.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName?.trim() || null,
      bio: input.bio?.trim() || null,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      template,
    })
    .eq("id", profile.id);

  if (error) return fail("Không lưu được thay đổi. Vui lòng thử lại.");
  revalidateTag(`profile:${profile.username}`, "max");
  return ok(undefined);
}
