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
  LogOut,
  Menu,
  Compass,
} from "lucide-react";
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
  { href: "/meal-plans", label: "Ernährungspläne", icon: ClipboardList },
  { href: "/shopping-lists", label: "Einkaufslisten", icon: ShoppingCart },
  { href: "/billing", label: "Abonnement", icon: CreditCard },
];

const adminItems = [
  { href: "/settings", label: "Einstellungen", icon: Settings },
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
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-white"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
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

  // Trial-Badge: Subscription-Daten laden
  const { data: subscription } = trpc.billing.getSubscription.useQuery();

  // localStorage prüfen für Banner-Dismissed Status
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

  // Trial-Badge berechnen
  const showTrialBadge =
    bannerDismissed &&
    subscription?.subscriptionPlan === "TRIAL" &&
    !subscription.isTrialExpired &&
    subscription.trialDaysLeft > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6">
        <Compass className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold text-text-main">NutriKompass</span>
      </div>

      <Separator className="mb-4" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
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
                <span className="inline-flex items-center rounded-lg bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                  ⚡ {subscription.trialDaysLeft}d
                </span>
              ) : undefined
            }
          />
        ))}

        {/* Admin-Bereich */}
        {user.role === "ADMIN" && (
          <>
            <Separator className="my-3" />
            {adminItems.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                isActive={pathname.startsWith(item.href)}
                onClick={onNavClick}
              />
            ))}
          </>
        )}
      </nav>

      {/* User-Bereich */}
      <div className="border-t p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-text-main">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-surface overflow-y-auto">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-40"
            aria-label="Menü öffnen"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            user={user}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
