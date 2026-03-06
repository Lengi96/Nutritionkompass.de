"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ShoppingCart,
  CreditCard,
  Settings,
  FileJson,
  Bot,
  LogOut,
  Menu,
} from "lucide-react";
import { LogoIcon } from "@/components/ui/LogoIcon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import {
  clearMealPlansUnreadCount,
  getMealPlansUnreadCount,
  subscribeMealPlansUnread,
} from "@/lib/mealPlanNotifications";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "STAFF";
  };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Bewohner:innen", icon: Users },
  { href: "/meal-plans", label: "Ernaehrungsplaene", icon: ClipboardList },
  { href: "/shopping-lists", label: "Einkaufslisten", icon: ShoppingCart },
  { href: "/agent", label: "Agent", icon: Bot },
  { href: "/billing", label: "Abonnement", icon: CreditCard },
];

const adminItems = [
  { href: "/settings", label: "Einstellungen", icon: Settings },
  { href: "/fhir-export", label: "FHIR Export", icon: FileJson },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
        isActive
          ? "bg-primary text-white shadow-[0_14px_28px_rgba(80,145,123,0.22)]"
          : "text-slate-600 hover:bg-[#eef6f2] hover:text-text-main"
      )}
    >
      <Icon className={cn("h-5 w-5", !isActive && "text-primary/80 group-hover:text-primary")} />
      <span className="flex-1">{label}</span>
      {badge}
    </Link>
  );
}

function SidebarContent({
  user,
  onNavClick,
}: SidebarProps & { onNavClick?: () => void }) {
  const pathname = usePathname();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mealPlansUnreadCount, setMealPlansUnreadCount] = useState(0);
  const { data: subscription } = trpc.billing.getSubscription.useQuery();

  useEffect(() => {
    const stored = localStorage.getItem("trialBannerDismissed");
    if (stored === "true") {
      setBannerDismissed(true);
    }
  }, []);

  useEffect(() => {
    setMealPlansUnreadCount(getMealPlansUnreadCount());
    return subscribeMealPlansUnread(setMealPlansUnreadCount);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/meal-plans")) {
      clearMealPlansUnreadCount();
    }
  }, [pathname]);

  const showTrialBadge =
    bannerDismissed &&
    subscription?.subscriptionPlan === "TRIAL" &&
    !subscription.isTrialExpired &&
    subscription.trialDaysLeft > 0;

  return (
    <div className="flex h-full flex-col bg-white/94 px-3 pb-3 pt-4 backdrop-blur">
      <Link
        href="/start"
        onClick={onNavClick}
        className="rounded-[28px] border border-primary/10 bg-[linear-gradient(180deg,rgba(238,246,242,0.95),rgba(255,255,255,0.92))] px-4 py-4 shadow-[0_16px_36px_rgba(53,95,81,0.08)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-primary/10">
            <LogoIcon className="h-8 w-8 shrink-0" />
          </div>
          <div>
            <span className="block text-sm font-bold text-text-main">NutriKompass</span>
            <span className="block text-xs text-slate-500">Planung fuer Einrichtungsteams</span>
          </div>
        </div>
      </Link>

      <div className="px-1 py-4">
        <Separator className="bg-primary/10" />
      </div>

      <nav className="flex-1 space-y-1 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            isActive={
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            }
            onClick={() => {
              if (item.href === "/meal-plans") {
                clearMealPlansUnreadCount();
              }
              onNavClick?.();
            }}
            badge={
              item.href === "/meal-plans" && mealPlansUnreadCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {mealPlansUnreadCount > 9 ? "9+" : mealPlansUnreadCount}
                </span>
              ) : item.href === "/billing" && showTrialBadge ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  {subscription.trialDaysLeft}d
                </span>
              ) : undefined
            }
          />
        ))}

        {user.role === "ADMIN" && (
          <>
            <div className="px-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Verwaltung
            </div>
            <div className="space-y-1 pt-2">
              {adminItems.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  isActive={pathname.startsWith(item.href)}
                  onClick={onNavClick}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="mt-4 rounded-[28px] border border-primary/10 bg-[#f8fbf9] p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-text-main">{user.name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-full justify-start gap-2 rounded-2xl border-primary/15 bg-white text-text-main hover:bg-[#eef6f2]"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-primary/10 lg:bg-white/80 lg:backdrop-blur">
        <SidebarContent user={user} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-4 z-40 h-11 w-11 rounded-2xl border-primary/15 bg-white/92 shadow-[0_12px_24px_rgba(53,95,81,0.12)] backdrop-blur lg:hidden"
            aria-label="Menue oeffnen"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[288px] border-r border-primary/10 bg-transparent p-0 shadow-none">
          <SidebarContent
            user={user}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
