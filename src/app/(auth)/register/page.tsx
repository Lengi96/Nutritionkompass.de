"use client";

import { useState } from "react";
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
import { trpc } from "@/trpc/client";

const registerSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(2, "Der Einrichtungsname muss mindestens 2 Zeichen lang sein.")
      .max(120, "Der Einrichtungsname darf maximal 120 Zeichen lang sein."),
    name: z
      .string()
      .trim()
      .min(2, "Der Name muss mindestens 2 Zeichen lang sein.")
      .max(100, "Der Name darf maximal 100 Zeichen lang sein."),
    email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben."),
    password: z
      .string()
      .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
    passwordConfirm: z.string().min(1, "Bitte bestätigen Sie das Passwort."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      router.push(
        `/verify-email?email=${encodeURIComponent(data.email)}`
      );
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
    <div className="w-full max-w-md px-4">
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main">NutriKompass</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Neues Konto erstellen
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
              <Label htmlFor="organizationName">Einrichtungsname</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="z. B. Pflegeheim Sonnenschein"
                autoComplete="organization"
                className="rounded-xl"
                {...register("organizationName")}
              />
              {errors.organizationName && (
                <p className="text-xs text-destructive">
                  {errors.organizationName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Vollständiger Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Max Mustermann"
                autoComplete="name"
                className="rounded-xl"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

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
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mindestens 8 Zeichen"
                autoComplete="new-password"
                className="rounded-xl"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Passwort bestätigen</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="Passwort wiederholen"
                autoComplete="new-password"
                className="rounded-xl"
                {...register("passwordConfirm")}
              />
              {errors.passwordConfirm && (
                <p className="text-xs text-destructive">
                  {errors.passwordConfirm.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-primary hover:bg-primary-600"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrierung...
                </>
              ) : (
                "Konto erstellen"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Bereits ein Konto?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Anmelden
            </Link>
          </p>
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
        <span>&middot;</span>
        <Link href="/agb" className="hover:underline">
          AGB
        </Link>
      </div>
    </div>
  );
}
