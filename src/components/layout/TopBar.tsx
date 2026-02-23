"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, LogOut, User } from "lucide-react";

interface TopBarProps {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "STAFF";
  };
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Bewohner:innen",
  "/meal-plans": "Ernährungspläne",
  "/shopping-lists": "Einkaufslisten",
  "/settings": "Einstellungen",
  "/profile": "Mein Profil",
  "/billing": "Abonnement",
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = pageTitles[currentPath];
    if (label) {
      crumbs.push({ label, href: currentPath });
    }
  }

  return crumbs;
}

function getPageTitle(pathname: string): string {
  // Exakter Match
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Dynamische Routen
  if (pathname.startsWith("/patients/")) return "Bewohner:in-Details";
  if (pathname.startsWith("/meal-plans/")) return "Ernährungsplan";
  if (pathname.startsWith("/shopping-lists/")) return "Einkaufsliste";

  return "Dashboard";
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-surface pl-14 pr-3 sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-text-main sm:text-lg">{title}</h1>
        {breadcrumbs.length > 1 && (
          <nav className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-text-main" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent transition-colors">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-text-main">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {user.role === "ADMIN" ? "Administrator:in" : "Mitarbeiter:in"}
              </p>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <Link href="/profile">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
