
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
  CheckCircle,
  FilePlus,
  Users,
  ClipboardList,
  Send,
  FileSearch,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const adminNav = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Gauge },
  { name: "Create Job Types", href: "/admin/create-job-types", icon: PlusSquare },
  { name: "Assessment Master", href: "/admin/assessment-master", icon: ClipboardList },
  { name: "Approve Recruiters", href: "/admin/approve-recruiters", icon: CheckCircle },
  { name: "Approve Job Seekers", href: "/admin/approve-seekers", icon: CheckCircle },
  { name: "Job Openings", href: "/admin/job-openings", icon: Briefcase },
  { name: "Register Job Seekers", href: "/admin/register-seekers", icon: FilePlus },
  { name: "Apply for Job Seeker", href: "/admin/apply-for-seeker", icon: Send },
  { name: "GBS Applications", href: "/admin/gbs-applications", icon: FileSearch },
  { name: "Interview Process", href: "/admin/interview-process", icon: Users },
];


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
      {adminNav.map((item) => (
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
    </SidebarMenu>
  );
}
