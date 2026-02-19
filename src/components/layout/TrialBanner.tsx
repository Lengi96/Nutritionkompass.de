"use client";

import Link from "next/link";
import { trpc } from "@/trpc/client";
import { AlertTriangle, Sparkles, X } from "lucide-react";
import { useState } from "react";

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: subscription, isLoading } =
    trpc.billing.getSubscription.useQuery();

  // Nicht anzeigen wenn: laden, dismissed, oder kein Trial
  if (isLoading || dismissed) return null;
  if (!subscription) return null;
  if (subscription.subscriptionPlan !== "TRIAL") return null;

  const { isTrialExpired, trialDaysLeft } = subscription;

  // Trial abgelaufen
  if (isTrialExpired) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm font-medium text-destructive">
              Ihre Testphase ist abgelaufen.{" "}
              <Link href="/billing" className="underline font-semibold hover:no-underline">
                Jetzt upgraden
              </Link>{" "}
              um NutriKompass weiter zu nutzen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Trial noch aktiv
  if (trialDaysLeft > 0 && trialDaysLeft <= 14) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm font-medium text-yellow-800">
              Noch {trialDaysLeft} {trialDaysLeft === 1 ? "Tag" : "Tage"} in der
              Testphase.{" "}
              <Link href="/billing" className="underline font-semibold hover:no-underline">
                Plan waehlen
              </Link>
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-600 hover:text-yellow-800 p-1 rounded-lg hover:bg-yellow-100 transition-colors"
            aria-label="Banner schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
