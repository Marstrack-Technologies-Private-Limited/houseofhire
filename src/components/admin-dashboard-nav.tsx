
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CheckCircle,
  ClipboardList,
  FilePlus,
  FileSearch,
  Gauge,
  History,
  MessageSquarePlus,
  PlusSquare,
  Send,
  Users,
  UserCog,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

const adminNav = {
  dashboard: { name: "Dashboard", href: "/admin/dashboard", icon: Gauge },
  management: [
    { name: "Job Openings", href: "/admin/job-openings", icon: Briefcase },
    { name: "Approve Recruiters", href: "/admin/approve-recruiters", icon: Users },
    { name: "Approve Job Seekers", href: "/admin/approve-seekers", icon: CheckCircle },
    { name: "Create Job Types", href: "/admin/create-job-types", icon: PlusSquare },
    { name: "Assessment Master", href: "/admin/assessment-master", icon: ClipboardList },
  ],
  gbsActions: [
    { name: "Register Job Seekers", href: "/admin/register-seekers", icon: FilePlus },
    { name: "Admin Registered Users", href: "/admin/admin-registered-users", icon: UserCog },
    { name: "Apply for Job Seeker", href: "/admin/apply-for-seeker", icon: Send },
    { name: "GBS Jobs Applied", href: "/admin/gbs-applications", icon: FileSearch },
  ],
  interviews: [
    { name: "New Interview", href: "/admin/new-interview", icon: MessageSquarePlus },
    { name: "Interview Conducted", href: "/admin/interview-conducted", icon: History },
  ],
};


export function AdminDashboardNav() {
  const pathname = usePathname();

  const isNavItemActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <SidebarMenu>
        <SidebarMenuItem>
           <SidebarMenuButton
            asChild
            isActive={isNavItemActive(adminNav.dashboard.href)}
            tooltip={adminNav.dashboard.name}
          >
            <Link href={adminNav.dashboard.href}>
              <adminNav.dashboard.icon />
              <span>{adminNav.dashboard.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarSeparator />

        <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            {adminNav.management.map((item) => (
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
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
            <SidebarGroupLabel>GBS Actions</SidebarGroupLabel>
            {adminNav.gbsActions.map((item) => (
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
        </SidebarGroup>
        
        <SidebarSeparator />

        <SidebarGroup>
            <SidebarGroupLabel>Interviews</SidebarGroupLabel>
            {adminNav.interviews.map((item) => (
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
        </SidebarGroup>
    </SidebarMenu>
  );
}
