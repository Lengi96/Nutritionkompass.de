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
  "/agent": "Agent",
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
  if (pageTitles[pathname]) return pageTitles[pathname];
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
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-primary/10 bg-white/78 pl-16 pr-3 backdrop-blur sm:pr-6 lg:px-8">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
          Einrichtungscockpit
        </p>
        <h1 className="truncate text-lg font-bold text-text-main sm:text-[1.35rem]">{title}</h1>
        {breadcrumbs.length > 1 && (
          <nav
            className="hidden items-center gap-1 pt-1 text-xs text-slate-500 sm:flex"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-text-main" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="transition-colors hover:text-primary">
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
          <button className="flex items-center gap-3 rounded-2xl border border-transparent bg-white/70 p-2 transition-all hover:border-primary/10 hover:bg-[#f7faf8]">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-text-main">{user.name}</p>
              <p className="text-xs text-slate-500">
                {user.role === "ADMIN" ? "Administrator:in" : "Mitarbeiter:in"}
              </p>
            </div>
            <Avatar className="h-10 w-10 ring-1 ring-primary/10">
              <AvatarFallback className="bg-primary text-sm font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-2xl border-primary/10">
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
