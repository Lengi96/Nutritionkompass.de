"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingSuccessPage() {
  const router = useRouter();

  // Nach 10 Sekunden automatisch zum Dashboard weiterleiten
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 10000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="rounded-xl shadow-lg max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-text-main">
              Zahlung erfolgreich!
            </h2>
            <p className="text-muted-foreground">
              Vielen Dank! Ihr Abonnement wurde aktiviert. Sie koennen NutriKompass
              jetzt ohne Einschraenkungen nutzen.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Link href="/dashboard">
              <Button className="w-full rounded-xl">
                Zum Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline" className="w-full rounded-xl">
                Abo-Details ansehen
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Sie werden in 10 Sekunden automatisch weitergeleitet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
