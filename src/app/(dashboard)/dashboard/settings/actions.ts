"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateUsername } from "@/lib/validation/username";
import { type ActionResult, fail, ok } from "@/lib/dashboard/action-result";

export async function updateUsername(
  raw: string,
): Promise<ActionResult<{ username: string }>> {
  const profile = await getCurrentProfile();
  if (!profile) return fail("Phiên đăng nhập đã hết hạn.");

  const validation = validateUsername(raw);
  if (!validation.ok) return fail(validation.message);
  const username = validation.username;

  if (username === profile.username) {
    return ok({ username });
  }

  const admin = createAdminClient();
  const { data: taken, error: checkErr } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (checkErr) return fail("Không kiểm tra được tên người dùng.");
  if (taken) return fail("Tên người dùng đã có người sử dụng, hãy chọn tên khác.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", profile.id);

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return fail("Tên người dùng đã có người sử dụng, hãy chọn tên khác.");
    }
    return fail("Không đổi được tên người dùng. Vui lòng thử lại.");
  }

  // Đổi username → link công khai đổi: revalidate cả tag cũ lẫn tag mới.
  revalidateTag(`profile:${profile.username}`, "max");
  revalidateTag(`profile:${username}`, "max");
  return ok({ username });
}

export async function togglePublished(
  isPublished: boolean,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return fail("Phiên đăng nhập đã hết hạn.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_published: isPublished })
    .eq("id", profile.id);

  if (error) return fail("Không cập nhật được trạng thái xuất bản.");
  revalidateTag(`profile:${profile.username}`, "max");
  return ok(undefined);
}

export async function deleteAccount(): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return fail("Phiên đăng nhập đã hết hạn.");

  // Xoá auth user → cascade xoá profile/links/products/events (FK on delete cascade).
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(profile.id);
  if (error) return fail("Không xoá được tài khoản. Vui lòng thử lại.");

  revalidateTag(`profile:${profile.username}`, "max");

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
