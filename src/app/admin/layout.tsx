
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
import { AdminDashboardNav } from "@/components/admin-dashboard-nav";
import { DashboardHeader } from "@/components/dashboard-header";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

// Helper to get page title from pathname
const getPageTitle = (pathname: string): string => {
    if (pathname === '/admin/dashboard') return "Admin Dashboard";
    if (pathname.startsWith('/admin/create-job-types')) return "Create Job Types";
    if (pathname.startsWith('/admin/assessment-master')) return "Assessment Master";
    if (pathname.startsWith('/admin/approve-recruiters')) return "Approve Recruiters";
    if (pathname.startsWith('/admin/approve-seekers')) return "Approve Job Seekers";
    if (pathname.startsWith('/admin/job-openings')) return "Job Openings";
    if (pathname.startsWith('/admin/register-seekers')) return "Register Job Seekers";
    if (pathname.startsWith('/admin/admin-registered-users')) return "Admin Registered Users";
    if (pathname.startsWith('/admin/apply-for-seeker')) return "Apply for Job Seeker";
    if (pathname.startsWith('/admin/gbs-applications')) return "GBS Jobs Applied";
    if (pathname.startsWith('/admin/new-interview')) return "New Interview";
    if (pathname.startsWith('/admin/interview-conducted')) return "Conducted Interviews";
    return "Admin Dashboard";
};


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'admin') {
            setUser(userData);
        } else {
            router.push('/login');
        }
    } else {
        router.push('/login');
    }
  }, [router]);

  const pageTitle = getPageTitle(pathname);
  
  if (!user) {
      return <div>Loading...</div>; // Or a proper loading skeleton
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Briefcase className="size-6 text-primary" />
            <span className="text-lg font-semibold">HouseOfHire Admin</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <AdminDashboardNav />
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
