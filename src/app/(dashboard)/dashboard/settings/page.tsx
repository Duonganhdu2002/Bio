import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentProfile } from "@/lib/auth";
import { SettingsForm } from "./_components/settings-form";

export const metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const profile = (await getCurrentProfile())!;

  return (
    <>
      <PageHeader
        eyebrow="Hệ thống"
        title="Cài đặt"
        description="Quản lý tên người dùng, trạng thái xuất bản và tài khoản."
      />
      <SettingsForm profile={profile} />
    </>
  );
}
