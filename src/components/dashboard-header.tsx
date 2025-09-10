
"use client";

import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  LogOut,
  PanelLeft,
  Settings,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  pageTitle: string;
}

interface UserData {
    name: string;
    email: string;
    role: string;
}

export function DashboardHeader({ pageTitle }: DashboardHeaderProps) {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    // This code runs only on the client-side
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  }


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Button
        size="icon"
        variant="outline"
        className="sm:hidden"
        onClick={toggleSidebar}
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <div className="flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-muted-foreground" />
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold">{pageTitle}</span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
                <p>{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email || 'user@example.com'}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.role !== 'admin' && (
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
            )}
            {user?.role !== 'admin' && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
