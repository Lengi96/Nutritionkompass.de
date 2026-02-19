"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Compass, MailCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/trpc/client";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resent, setResent] = useState(false);

  const resendMutation = trpc.auth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      setResent(true);
      toast.success("Bestätigungs-E-Mail wurde erneut gesendet.");
    },
    onError: () => {
      toast.error("Fehler beim Senden. Bitte versuchen Sie es später erneut.");
    },
  });

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
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-text-main">
              E-Mail bestätigen
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Wir haben eine E-Mail an{" "}
              {email ? (
                <strong className="text-text-main">{email}</strong>
              ) : (
                "Ihre E-Mail-Adresse"
              )}{" "}
              gesendet. Bitte klicken Sie auf den Link in der E-Mail, um
              Ihr Konto zu aktivieren.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            {!resent && email && (
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => resendMutation.mutate({ email })}
                disabled={resendMutation.isPending}
              >
                {resendMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  "Keine E-Mail erhalten? Erneut senden"
                )}
              </Button>
            )}

            {resent && (
              <p className="text-sm text-green-600 font-medium">
                Eine neue E-Mail wurde gesendet. Prüfen Sie auch Ihren
                Spam-Ordner.
              </p>
            )}

            <Link href="/login">
              <Button
                variant="ghost"
                className="w-full rounded-xl text-muted-foreground"
              >
                Zurück zur Anmeldung
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
        <Link href="/impressum" className="hover:underline">
          Impressum
        </Link>
        <span>&middot;</span>
        <Link href="/datenschutz" className="hover:underline">
          Datenschutz
        </Link>
      </div>
    </div>
  );
}
