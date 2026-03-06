"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogoIcon } from "@/components/ui/LogoIcon";
import { trpc } from "@/trpc/client";

const plainTextInputRegex = /^[^<>]*$/;

const registerSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(2, "Der Einrichtungsname muss mindestens 2 Zeichen lang sein.")
      .max(120, "Der Einrichtungsname darf maximal 120 Zeichen lang sein.")
      .regex(
        plainTextInputRegex,
        "Bitte keine HTML-Tags oder Sondermarkierungen verwenden."
      ),
    name: z
      .string()
      .trim()
      .min(2, "Der Name muss mindestens 2 Zeichen lang sein.")
      .max(100, "Der Name darf maximal 100 Zeichen lang sein.")
      .regex(
        plainTextInputRegex,
        "Bitte keine HTML-Tags oder Sondermarkierungen verwenden."
      ),
    email: z.string().email("Bitte eine gueltige E-Mail-Adresse eingeben."),
    password: z
      .string()
      .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
    passwordConfirm: z.string().min(1, "Bitte bestaetigen Sie das Passwort."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Die Passwoerter stimmen nicht ueberein.",
    path: ["passwordConfirm"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setError(null);
    registerMutation.mutate({
      organizationName: data.organizationName,
      name: data.name,
      email: data.email,
      password: data.password,
    });
  }

  return (
    <div className="w-full max-w-[460px]">
      <Card className="overflow-hidden rounded-[28px] border border-primary/10 bg-white/92 shadow-[0_26px_90px_rgba(53,95,81,0.16)] backdrop-blur">
        <CardHeader className="space-y-6 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
          <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Registrierung
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6f2] ring-1 ring-primary/10">
                <LogoIcon className="h-10 w-10" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-main">NutriKompass</p>
                <p className="text-sm text-slate-500">Neues Konto fuer Ihre Einrichtung</p>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-text-main">
                Zugang fuer Ihr Team anlegen.
              </h1>
              <p className="text-sm leading-6 text-slate-600 sm:text-[15px]">
                Registrieren Sie Ihre Einrichtung, damit Planung, Dokumentation und Zusammenarbeit an einem zentralen Ort starten koennen.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div
                aria-live="polite"
                className="rounded-2xl border border-destructive/15 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-sm font-semibold text-text-main">
                Einrichtungsname
              </Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="z. B. Wohngruppe Lindenhof"
                autoComplete="organization"
                className="h-12 rounded-2xl border-primary/10 bg-[#fbfcfb] px-4"
                {...register("organizationName")}
              />
              {errors.organizationName && (
                <p className="text-xs text-destructive">{errors.organizationName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-text-main">
                Vollstaendiger Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Max Mustermann"
                autoComplete="name"
                className="h-12 rounded-2xl border-primary/10 bg-[#fbfcfb] px-4"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

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
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-text-main">
                  Passwort
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  autoComplete="new-password"
                  className="h-12 rounded-2xl border-primary/10 bg-[#fbfcfb] px-4"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-sm font-semibold text-text-main">
                  Passwort bestaetigen
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="Passwort wiederholen"
                  autoComplete="new-password"
                  className="h-12 rounded-2xl border-primary/10 bg-[#fbfcfb] px-4"
                  {...register("passwordConfirm")}
                />
                {errors.passwordConfirm && (
                  <p className="text-xs text-destructive">{errors.passwordConfirm.message}</p>
                )}
              </div>
            </div>

            <p className="rounded-2xl border border-primary/10 bg-[#f6faf8] px-4 py-3 text-xs leading-5 text-slate-600">
              Mit der Registrierung erstellen Sie den ersten Zugang fuer Ihre Einrichtung. Die E-Mail-Adresse wird im naechsten Schritt bestaetigt.
            </p>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-primary text-sm font-semibold shadow-[0_16px_30px_rgba(80,145,123,0.22)] hover:bg-[#447e6b]"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrierung laeuft...
                </>
              ) : (
                <>
                  Konto erstellen
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Bereits ein Konto?{" "}
            <Link href="/login" className="font-semibold text-primary transition-colors hover:text-[#355F51]">
              Anmelden
            </Link>
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <Link href="/impressum" className="transition-colors hover:text-primary">
              Impressum
            </Link>
            <Link href="/datenschutz" className="transition-colors hover:text-primary">
              Datenschutz
            </Link>
            <Link href="/agb" className="transition-colors hover:text-primary">
              AGB
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
