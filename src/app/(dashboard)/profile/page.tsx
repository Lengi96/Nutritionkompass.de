"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Mail,
  Shield,
  Building2,
  CalendarDays,
  CreditCard,
  KeyRound,
  LogOut,
  Loader2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

const planInfo: Record<string, { label: string; color: string }> = {
  TRIAL: { label: "Testphase", color: "bg-yellow-100 text-yellow-800" },
  BASIC: { label: "Basis", color: "bg-blue-100 text-blue-800" },
  PROFESSIONAL: {
    label: "Professional",
    color: "bg-purple-100 text-purple-800",
  },
};

const statusInfo: Record<string, { label: string; color: string }> = {
  TRIALING: { label: "Testphase", color: "bg-yellow-100 text-yellow-800" },
  ACTIVE: { label: "Aktiv", color: "bg-green-100 text-green-800" },
  CANCELED: { label: "Gekündigt", color: "bg-red-100 text-red-800" },
  PAST_DUE: {
    label: "Zahlung ausstehend",
    color: "bg-orange-100 text-orange-800",
  },
  UNPAID: { label: "Unbezahlt", color: "bg-red-100 text-red-800" },
};

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const { data: profile, isLoading: profileLoading } =
    trpc.auth.getProfile.useQuery();
  const { data: subscription, isLoading: subLoading } =
    trpc.billing.getSubscription.useQuery();
  const { data: usage, isLoading: usageLoading } =
    trpc.billing.getUsage.useQuery();

  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(
        error.message || "Stripe-Portal konnte nicht geöffnet werden."
      );
    },
  });

  if (status === "loading" || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Lade Profil…
      </div>
    );
  }

  const user = session?.user;
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const plan = subscription
    ? planInfo[subscription.subscriptionPlan] || planInfo.TRIAL
    : null;
  const subStatus = subscription
    ? statusInfo[subscription.subscriptionStatus] || statusInfo.TRIALING
    : null;

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Mein Profil</h2>
        <p className="text-muted-foreground">
          Ihre persönlichen Daten und Kontoübersicht
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Persönliche Daten
          ══════════════════════════════════════════════════════════════ */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-text-main">Persönliche Daten</CardTitle>
          <CardDescription>
            Ihre Kontoinformationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-white text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-text-main">
                {user.name}
              </h3>
              <Badge
                className={
                  user.role === "ADMIN"
                    ? "rounded-xl bg-primary text-white"
                    : "rounded-xl bg-accent text-text-main"
                }
              >
                {user.role === "ADMIN" ? "Administrator" : "Mitarbeiter"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Info-Grid */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">E-Mail</p>
                <p className="text-sm font-medium text-text-main">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Rolle</p>
                <p className="text-sm font-medium text-text-main">
                  {user.role === "ADMIN" ? "Administrator" : "Mitarbeiter"}
                  {user.role === "ADMIN" &&
                    " – Voller Zugriff inkl. Einstellungen"}
                  {user.role === "STAFF" &&
                    " – Patienten & Pläne verwalten"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Einrichtung</p>
                <p className="text-sm font-medium text-text-main">
                  {profile?.organization?.name || "–"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Mitglied seit</p>
                <p className="text-sm font-medium text-text-main">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("de-DE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "–"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          Abo & Abrechnung
          ══════════════════════════════════════════════════════════════ */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-text-main flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Abo & Abrechnung
          </CardTitle>
          <CardDescription>
            Ihr aktuelles Abonnement und Nutzung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subLoading ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lade Abo-Daten…
            </div>
          ) : subscription ? (
            <>
              {/* Plan + Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Aktueller Plan
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {plan && (
                        <Badge className={`rounded-xl ${plan.color}`}>
                          {plan.label}
                        </Badge>
                      )}
                      {subStatus && (
                        <Badge className={`rounded-xl ${subStatus.color}`}>
                          {subStatus.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trial-Info */}
              {subscription.subscriptionPlan === "TRIAL" &&
                subscription.trialDaysLeft > 0 && (
                  <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        <strong>{subscription.trialDaysLeft} Tage</strong>{" "}
                        verbleibend in Ihrer Testphase
                      </p>
                    </div>
                  </div>
                )}

              {subscription.isTrialExpired && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">
                    Ihre Testphase ist abgelaufen. Bitte wählen Sie einen Plan.
                  </p>
                </div>
              )}

              <Separator />

              {/* Nutzung */}
              {usageLoading ? (
                <div className="flex items-center justify-center py-2 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lade Nutzung…
                </div>
              ) : usage ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-text-main">
                    Nutzung
                  </p>

                  {/* Patienten */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Aktive Patienten
                      </span>
                      <span className="font-medium text-text-main">
                        {usage.patients.current} / {usage.patients.max}
                      </span>
                    </div>
                    <Progress
                      value={
                        (usage.patients.current / usage.patients.max) * 100
                      }
                      className="h-2 rounded-full"
                    />
                  </div>

                  {/* Pläne */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Pläne diesen Monat
                      </span>
                      <span className="font-medium text-text-main">
                        {usage.plansThisMonth.current} /{" "}
                        {usage.plansThisMonth.max}
                      </span>
                    </div>
                    <Progress
                      value={
                        (usage.plansThisMonth.current /
                          usage.plansThisMonth.max) *
                        100
                      }
                      className="h-2 rounded-full"
                    />
                  </div>
                </div>
              ) : null}

              <Separator />

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link href="/billing">
                  <Button variant="outline" className="rounded-xl">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Abo verwalten
                  </Button>
                </Link>

                {isAdmin && subscription.stripeCustomerId && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => portalMutation.mutate()}
                    disabled={portalMutation.isPending}
                  >
                    {portalMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Zahlungsmethode verwalten
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Keine Abo-Daten verfügbar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          Konto-Aktionen
          ══════════════════════════════════════════════════════════════ */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-text-main">Konto-Aktionen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-text-main">
                  Passwort ändern
                </p>
                <p className="text-xs text-muted-foreground">
                  Sie erhalten eine E-Mail mit einem Link zum Zurücksetzen
                </p>
              </div>
            </div>
            <Link href="/forgot-password">
              <Button variant="outline" size="sm" className="rounded-xl">
                Ändern
              </Button>
            </Link>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-text-main">Abmelden</p>
                <p className="text-xs text-muted-foreground">
                  Von diesem Gerät abmelden
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Abmelden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
