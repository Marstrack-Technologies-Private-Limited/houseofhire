import Link from "next/link";
import { Briefcase } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-muted/40 p-4">
      <header className="absolute top-0 right-0 p-4">
        <ThemeToggle />
      </header>
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center space-x-2 text-foreground">
          <Briefcase className="h-6 w-6" />
          <span className="font-bold text-lg">CareerLink</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
