"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { AlertTriangle, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "trialBannerDismissed";

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: subscription, isLoading } =
    trpc.billing.getSubscription.useQuery();

  // localStorage-Persistenz: Beim Mount prüfen
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  // Nicht anzeigen wenn: laden, nicht gemountet, dismissed, oder kein Trial
  if (!mounted || isLoading || dismissed) return null;
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
              um mein-nutrikompass.de weiter zu nutzen.
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
                Plan wählen
              </Link>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-yellow-600 hover:text-yellow-800 p-1 rounded-lg hover:bg-yellow-100 transition-colors"
            aria-label="Banner schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
