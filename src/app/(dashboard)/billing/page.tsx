"use client";

import { trpc } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Check,
  Loader2,
  AlertTriangle,
  Crown,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

const planInfo = {
  TRIAL: { label: "Testphase", color: "bg-yellow-100 text-yellow-800" },
  BASIC: { label: "Basis", color: "bg-blue-100 text-blue-800" },
  PROFESSIONAL: { label: "Professional", color: "bg-purple-100 text-purple-800" },
};

const statusInfo: Record<string, { label: string; color: string }> = {
  TRIALING: { label: "Testphase", color: "bg-yellow-100 text-yellow-800" },
  ACTIVE: { label: "Aktiv", color: "bg-green-100 text-green-800" },
  CANCELED: { label: "Gekuendigt", color: "bg-red-100 text-red-800" },
  PAST_DUE: { label: "Zahlung ausstehend", color: "bg-orange-100 text-orange-800" },
  UNPAID: { label: "Unbezahlt", color: "bg-red-100 text-red-800" },
};

export default function BillingPage() {
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const { data: subscription, isLoading: subLoading } =
    trpc.billing.getSubscription.useQuery();
  const { data: usage, isLoading: usageLoading } =
    trpc.billing.getUsage.useQuery();

  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      setUpgradingPlan(null);
    },
  });

  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const handleUpgrade = (plan: "BASIC" | "PROFESSIONAL") => {
    setUpgradingPlan(plan);
    checkoutMutation.mutate({ plan });
  };

  const handleManageBilling = () => {
    portalMutation.mutate();
  };

  if (subLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const plan = subscription?.subscriptionPlan ?? "TRIAL";
  const status = subscription?.subscriptionStatus ?? "TRIALING";
  const currentPlan = planInfo[plan];
  const currentStatus = statusInfo[status] ?? statusInfo.TRIALING;
  const isTrialExpired = subscription?.isTrialExpired ?? false;
  const trialDaysLeft = subscription?.trialDaysLeft ?? 0;

  const patientPercent =
    usage?.patients.max === Infinity
      ? 0
      : ((usage?.patients.current ?? 0) / (usage?.patients.max ?? 1)) * 100;
  const planPercent =
    usage?.plansThisMonth.max === Infinity
      ? 0
      : ((usage?.plansThisMonth.current ?? 0) / (usage?.plansThisMonth.max ?? 1)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-main">Abonnement</h2>
        <p className="text-muted-foreground">
          Verwalten Sie Ihren Plan und sehen Sie Ihre Nutzung ein.
        </p>
      </div>

      {/* Trial-Warnung */}
      {plan === "TRIAL" && isTrialExpired && (
        <Card className="rounded-xl border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-destructive">
                Ihre Testphase ist abgelaufen
              </p>
              <p className="text-sm text-muted-foreground">
                Bitte waehlen Sie einen Plan, um NutriKompass weiter nutzen zu koennen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {plan === "TRIAL" && !isTrialExpired && trialDaysLeft > 0 && (
        <Card className="rounded-xl border-yellow-300 bg-yellow-50">
          <CardContent className="flex items-center gap-4 py-4">
            <Sparkles className="h-6 w-6 text-yellow-600 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">
                {trialDaysLeft} {trialDaysLeft === 1 ? "Tag" : "Tage"} Testphase verbleibend
              </p>
              <p className="text-sm text-yellow-700">
                Upgraden Sie jetzt, um NutriKompass ohne Einschraenkungen zu nutzen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aktueller Plan + Nutzung */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Aktueller Plan */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-main">
              <CreditCard className="h-5 w-5" />
              Aktueller Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-text-main">
                {currentPlan.label}
              </span>
              <Badge className={`${currentStatus.color} rounded-xl`}>
                {currentStatus.label}
              </Badge>
            </div>

            {plan === "TRIAL" && trialDaysLeft > 0 && (
              <p className="text-sm text-muted-foreground">
                Testphase endet am{" "}
                {subscription?.trialEndsAt
                  ? new Date(subscription.trialEndsAt).toLocaleDateString("de-DE")
                  : "—"}
              </p>
            )}

            {subscription?.stripeSubscriptionId && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={handleManageBilling}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Abo verwalten
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Nutzung */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-text-main">Nutzung</CardTitle>
            <CardDescription>Ihre aktuelle Auslastung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Patienten */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Aktive Patienten</span>
                <span className="font-medium text-text-main">
                  {usage?.patients.current ?? 0} /{" "}
                  {usage?.patients.max === Infinity
                    ? "\u221E"
                    : usage?.patients.max ?? 0}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    patientPercent >= 90
                      ? "bg-destructive"
                      : patientPercent >= 70
                      ? "bg-yellow-500"
                      : "bg-primary"
                  }`}
                  style={{
                    width: `${Math.min(
                      usage?.patients.max === Infinity ? 5 : patientPercent,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Plaene diesen Monat */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">
                  Ernaehrungsplaene (diesen Monat)
                </span>
                <span className="font-medium text-text-main">
                  {usage?.plansThisMonth.current ?? 0} /{" "}
                  {usage?.plansThisMonth.max === Infinity
                    ? "\u221E"
                    : usage?.plansThisMonth.max ?? 0}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    planPercent >= 90
                      ? "bg-destructive"
                      : planPercent >= 70
                      ? "bg-yellow-500"
                      : "bg-primary"
                  }`}
                  style={{
                    width: `${Math.min(
                      usage?.plansThisMonth.max === Infinity ? 5 : planPercent,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade-Karten */}
      {plan !== "PROFESSIONAL" && (
        <div>
          <h3 className="text-lg font-semibold text-text-main mb-4">
            {plan === "TRIAL" ? "Plan waehlen" : "Upgrade"}
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basis Plan */}
            {plan !== "BASIC" && (
              <Card className="rounded-xl shadow-sm border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-text-main">
                    Basis
                  </CardTitle>
                  <CardDescription>Fuer kleinere Einrichtungen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-text-main">
                      29&euro;
                    </span>
                    <span className="text-muted-foreground">/Monat</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      Bis zu 15 Patienten
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      50 Plaene pro Monat
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      E-Mail-Support
                    </li>
                  </ul>
                  <Button
                    className="w-full rounded-xl"
                    onClick={() => handleUpgrade("BASIC")}
                    disabled={upgradingPlan !== null}
                  >
                    {upgradingPlan === "BASIC" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {plan === "TRIAL" ? "Basis waehlen" : "Auf Basis upgraden"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Professional Plan */}
            <Card className="rounded-xl shadow-sm border-2 border-primary/30 hover:border-primary transition-colors relative">
              <div className="absolute -top-3 right-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                Empfohlen
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-text-main">
                  <Crown className="h-5 w-5 text-primary" />
                  Professional
                </CardTitle>
                <CardDescription>Fuer wachsende Einrichtungen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-text-main">
                    59&euro;
                  </span>
                  <span className="text-muted-foreground">/Monat</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Unbegrenzt Patienten
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Unbegrenzt Plaene
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Prioritaets-Support
                  </li>
                </ul>
                <Button
                  className="w-full rounded-xl bg-primary hover:bg-primary/90"
                  onClick={() => handleUpgrade("PROFESSIONAL")}
                  disabled={upgradingPlan !== null}
                >
                  {upgradingPlan === "PROFESSIONAL" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {plan === "TRIAL"
                    ? "Professional waehlen"
                    : "Auf Professional upgraden"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Fehler-Anzeige */}
      {checkoutMutation.isError && (
        <Card className="rounded-xl border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">
              Fehler beim Erstellen der Checkout-Session. Bitte versuchen Sie es erneut.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
