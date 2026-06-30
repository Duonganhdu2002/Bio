import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentProfile } from "@/lib/auth";
import { AppearanceForm } from "./_components/appearance-form";

export const metadata = { title: "Giao diện" };

export default async function AppearancePage() {
  const profile = (await getCurrentProfile())!;

  return (
    <>
      <PageHeader
        eyebrow="Tuỳ biến"
        title="Giao diện"
        description="Tuỳ chỉnh ảnh đại diện, giới thiệu và template giao diện trang bio."
      />
      <AppearanceForm profile={profile} />
    </>
  );
}
