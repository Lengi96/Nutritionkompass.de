"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { LogoIcon } from "@/components/ui/LogoIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Bitte eine gueltige E-Mail-Adresse eingeben."),
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
      try {
        const res = await fetch(
          `/api/trpc/auth.checkVerificationStatus?input=${encodeURIComponent(
            JSON.stringify({ json: { email } })
          )}`
        );
        const json = await res.json();
        if (json?.result?.data?.json?.needsVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
      } catch {
        // Fallback: normaler Fehlerhinweis.
      }

      setError(
        "Ungueltige Anmeldedaten. Bitte pruefen Sie E-Mail und Passwort."
      );
      return;
    }

    window.location.assign("/start");
  }

  return (
    <div className="w-full max-w-[460px]">
      <Card className="overflow-hidden rounded-[28px] border border-primary/10 bg-white/92 shadow-[0_26px_90px_rgba(53,95,81,0.16)] backdrop-blur">
        <CardHeader className="space-y-6 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
          <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Login
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6f2] ring-1 ring-primary/10">
                <LogoIcon className="h-10 w-10" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-main">NutriKompass</p>
                <p className="text-sm text-slate-500">Fuer autorisierte Einrichtungsteams</p>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-text-main">
                Willkommen zurueck.
              </h1>
              <p className="text-sm leading-6 text-slate-600 sm:text-[15px]">
                Melden Sie sich an, um Bewohnerdaten, Plaene und Einkaufslisten in einer gemeinsamen Arbeitsoberflaeche zu verwalten.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div
                aria-live="polite"
                className="rounded-2xl border border-destructive/15 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-text-main">
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@einrichtung.de"
                autoComplete="email"
                spellCheck={false}
                className="h-12 rounded-2xl border-primary/10 bg-[#fbfcfb] px-4"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="password" className="text-sm font-semibold text-text-main">
                  Passwort
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary transition-colors hover:text-[#355F51]"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Passwort eingeben"
                autoComplete="current-password"
                className="h-12 rounded-2xl border-primary/10 bg-[#fbfcfb] px-4"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-primary text-sm font-semibold shadow-[0_16px_30px_rgba(80,145,123,0.22)] hover:bg-[#447e6b]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmeldung laeuft...
                </>
              ) : (
                <>
                  Anmelden
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-primary/10 bg-[#f6faf8] px-4 py-3 text-sm text-slate-600">
            Zugriff nur fuer autorisierte Mitarbeitende. Bei Problemen mit der Anmeldung hilft Ihnen die verantwortliche Einrichtung weiter.
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Noch kein Konto?{" "}
            <Link href="/register" className="font-semibold text-primary transition-colors hover:text-[#355F51]">
              Jetzt registrieren
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
