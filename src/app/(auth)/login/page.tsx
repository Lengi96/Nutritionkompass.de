"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Compass, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben."),
  password: z.string().min(1, "Bitte ein Passwort eingeben."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setError(null);
    const email = data.email.trim().toLowerCase();

    const result = await signIn("credentials", {
      email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      // NextAuth v5 gibt "CredentialsSignin" zurück, auch bei custom Errors.
      // Wir prüfen per tRPC ob die E-Mail unverifiziert ist.
      try {
        const res = await fetch(
          `/api/trpc/auth.checkVerificationStatus?input=${encodeURIComponent(
            JSON.stringify({ json: { email } })
          )}`
        );
        const json = await res.json();
        if (json?.result?.data?.json?.needsVerification) {
          router.push(
            `/verify-email?email=${encodeURIComponent(email)}`
          );
          return;
        }
      } catch {
        // Fallback: normaler Fehler anzeigen
      }
      setError(
        "Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort."
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md px-4">
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main">mein-nutrikompass.de</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bitte melden Sie sich an
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Passwort eingeben"
                autoComplete="current-password"
                className="rounded-xl"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-primary hover:bg-primary-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmeldung...
                </>
              ) : (
                "Anmelden"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Noch kein Konto?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Jetzt registrieren
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Nur für autorisiertes Fachpersonal
      </p>
    </div>
  );
}
