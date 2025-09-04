
"use client";

import * as React from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";

import type { UserRole } from "@/lib/types";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardHeader } from "@/components/dashboard-header";
import { usePathname } from "next/navigation";

// Helper to get page title from pathname
const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/jobs/new')) return "Post a New Job";
    if (pathname.startsWith('/jobs')) return "Job Management";
    if (pathname.startsWith('/applications')) return "Application Management";
    if (pathname.startsWith('/find-jobs')) return "Find Jobs";
    if (pathname.startsWith('/my-applications')) return "My Applications";
    if (pathname.startsWith('/profile')) return "Profile";
    return "Dashboard";
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = React.useState<UserRole | null>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        setRole(userData.role);
    }
  }, []);

  const pageTitle = getPageTitle(pathname);
  
  if (role === null) {
      return <div>Loading...</div>; // Or a proper loading skeleton
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Briefcase className="size-6 text-primary" />
            <span className="text-lg font-semibold">HouseOfHire</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav role={role} />
        </SidebarContent>
        <SidebarFooter>
          <div className="text-xs text-muted-foreground p-2">
            &copy; 2024 HouseOfHire
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <DashboardHeader pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 sm:px-6 sm:py-0">
          <div className="container mx-auto max-w-7xl py-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
