
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  FileText,
  Gauge,
  PlusSquare,
  Search,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface DashboardNavProps {
  role: UserRole;
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();

  const seekerNav = [
    { name: "Dashboard", href: "/dashboard", icon: Gauge },
    { name: "Find Jobs", href: "/find-jobs", icon: Search },
    { name: "My Applications", href: "/my-applications", icon: FileText },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const recruiterNav = [
    { name: "Dashboard", href: "/dashboard", icon: Gauge },
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Applications", href: "/applications", icon: FileText },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const navItems = role === "seeker" ? seekerNav : recruiterNav;

  const isNavItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
           <SidebarMenuButton
            asChild
            isActive={isNavItemActive(item.href)}
            tooltip={item.name}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
       {role === 'recruiter' && (
         <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={pathname.startsWith("/jobs/new")}
            tooltip={"Post a Job"}
          >
            <Link href="/jobs/new">
              <PlusSquare />
              <span>Post a Job</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
       )}
    </SidebarMenu>
  );
}
