"use client";

import type { CSSProperties } from "react";
import { AppSidebar, type SidebarProfile } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const sidebarVars = {
  "--sidebar-width": "13.5rem",
  "--sidebar-width-icon": "2.75rem",
} as CSSProperties;

export function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: SidebarProfile;
}) {
  return (
    <SidebarProvider
      className="theme-med h-svh min-h-0 max-h-svh overflow-hidden"
      style={sidebarVars}
    >
      <AppSidebar profile={profile} />
      <SidebarInset className="flex h-svh min-h-0 max-h-svh flex-col overflow-hidden md:h-[calc(100svh-1rem)] md:max-h-[calc(100svh-1rem)]">
        <header className="z-10 flex h-11 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:h-12 md:px-4">
          <SidebarTrigger className="-ml-0.5" />
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <span className="truncate text-sm font-medium text-muted-foreground sm:hidden">Bio</span>
        </header>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Quầng nắng ấm phía trên — gợi ánh sáng Địa Trung Hải, rất nhẹ. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_120%_at_50%_-10%,rgba(214,135,94,0.12),transparent_70%)]"
          />
          <div className="relative mx-auto flex h-full min-h-0 w-full min-w-0 max-w-5xl flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
