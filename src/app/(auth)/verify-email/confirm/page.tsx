"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Compass, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/trpc/client";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailConfirmPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <VerifyEmailConfirmContent />
    </Suspense>
  );
}

function VerifyEmailConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setState("success");
    },
    onError: (error) => {
      setState("error");
      setErrorMessage(
        error.message || "Ein unbekannter Fehler ist aufgetreten."
      );
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setState("error");
      setErrorMessage("Kein Verifizierungstoken gefunden.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="w-full max-w-md px-4">
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main">NutriKompass</h1>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {/* Loading */}
          {state === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                E-Mail wird bestätigt...
              </p>
            </>
          )}

          {/* Success */}
          {state === "success" && (
            <>
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-text-main">
                  E-Mail bestätigt!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie
                  können sich jetzt anmelden.
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full rounded-xl">
                  Zur Anmeldung
                </Button>
              </Link>
            </>
          )}

          {/* Error */}
          {state === "error" && (
            <>
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-text-main">
                  Verifizierung fehlgeschlagen
                </h2>
                <p className="text-sm text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
              <div className="space-y-3">
                <Link href="/register">
                  <Button variant="outline" className="w-full rounded-xl">
                    Erneut registrieren
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="w-full rounded-xl text-muted-foreground"
                  >
                    Zur Anmeldung
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
