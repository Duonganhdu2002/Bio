import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { QueryProvider } from "@/components/query-provider";
import { getCurrentProfile } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  // Middleware đảm bảo đã đăng nhập; nếu thiếu profile (user mồ côi) → về login.
  if (!profile) {
    redirect("/login");
  }

  return (
    <QueryProvider>
      <AppShell
        profile={{
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        }}
      >
        {children}
      </AppShell>
    </QueryProvider>
  );
}
