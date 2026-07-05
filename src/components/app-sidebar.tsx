"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ExternalLink,
  Layers,
  LayoutDashboard,
  LogOut,
  Palette,
  Settings,
} from "lucide-react";

import { signOut } from "@/lib/auth-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

export type SidebarProfile = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const nav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard/content",
    label: "Nội dung",
    icon: Layers,
    match: (p) =>
      p.startsWith("/dashboard/content") ||
      p.startsWith("/dashboard/links") ||
      p.startsWith("/dashboard/products") ||
      p.startsWith("/dashboard/banners"),
  },
  {
    href: "/dashboard/analytics?range=1",
    label: "Thống kê",
    icon: BarChart3,
    match: (p) => p.startsWith("/dashboard/analytics"),
  },
  {
    href: "/dashboard/appearance",
    label: "Giao diện",
    icon: Palette,
    match: (p) => p.startsWith("/dashboard/appearance"),
  },
  {
    href: "/dashboard/settings",
    label: "Cài đặt",
    icon: Settings,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

function initials(profile: SidebarProfile) {
  const base = (profile.displayName ?? profile.username).trim();
  const c = base[0];
  return c ? c.toUpperCase() : "?";
}

export function AppSidebar({ profile }: { profile: SidebarProfile }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const name = profile.displayName?.trim() || `@${profile.username}`;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-1.5 border-sidebar-border p-2 pb-2 md:border-b md:border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="default"
              className="h-9"
              render={<Link href="/dashboard" prefetch />}
              tooltip="Bio — Trang chủ"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-[13px] font-bold lowercase text-sidebar-primary-foreground shadow-sm">
                b
              </div>
              <span className="truncate text-base font-semibold tracking-tight">Bio</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-0">
        <SidebarGroup className="p-1.5">
          <SidebarGroupLabel className="px-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
            Quản lý
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={item.match(pathname)}
                      size="sm"
                      render={<Link href={item.href} prefetch />}
                      tooltip={item.label}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border p-2 md:border-t md:border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              render={
                <a href={`/@${profile.username}`} target="_blank" rel="noopener noreferrer" />
              }
              tooltip="Xem trang công khai"
            >
              <ExternalLink className="size-4" />
              <span>Xem trang của bạn</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-1.5 mb-1 flex items-center gap-2 rounded-md px-1 py-0.5 group-data-[collapsible=icon]:hidden">
          <Avatar size="sm">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={name} />
            ) : null}
            <AvatarFallback className="text-[10px]">{initials(profile)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-[11px] leading-tight text-sidebar-foreground/70">
            {name}
          </span>
        </div>

        <form action={signOut}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                type="submit"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                tooltip="Đăng xuất"
              >
                <LogOut className="size-4" />
                <span>Đăng xuất</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
