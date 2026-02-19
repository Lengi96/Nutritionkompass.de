"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Compass, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/trpc/client";

const forgotPasswordSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben."),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const resetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  function onSubmit(data: ForgotPasswordFormData) {
    resetMutation.mutate({ email: data.email });
  }

  return (
    <div className="w-full max-w-md px-4">
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main">
            Passwort vergessen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen.
          </p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-primary/10 px-4 py-4 text-sm text-primary flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                <p>
                  Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde
                  eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts
                  gesendet. Bitte überprüfen Sie auch Ihren Spam-Ordner.
                </p>
              </div>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full rounded-xl mt-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zur Anmeldung
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@einrichtung.de"
                  autoComplete="email"
                  className="rounded-xl"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-primary hover:bg-primary-600"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  "Link zum Zurücksetzen senden"
                )}
              </Button>

              <Link href="/login" className="block">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl text-muted-foreground"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zur Anmeldung
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
