"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Compass, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/trpc/client";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
    passwordConfirm: z.string().min(1, "Bitte bestätigen Sie das Passwort."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Passwort wurde erfolgreich geändert.");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  function onSubmit(data: ResetFormData) {
    setError(null);
    resetMutation.mutate({ token, password: data.password });
  }

  // Kein Token in der URL
  if (!token) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-sm rounded-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Compass className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-main">
              mein-nutrikompass.de
            </h1>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-text-main">
                Ungültiger Link
              </h2>
              <p className="text-sm text-muted-foreground">
                Dieser Link ist ungültig. Bitte fordern Sie einen neuen
                Link zum Zurücksetzen des Passworts an.
              </p>
            </div>
            <Link href="/forgot-password">
              <Button className="w-full rounded-xl">
                Neuen Link anfordern
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Passwort erfolgreich geändert
  if (success) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-sm rounded-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Compass className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-main">
              mein-nutrikompass.de
            </h1>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-text-main">
                Passwort geändert!
              </h2>
              <p className="text-sm text-muted-foreground">
                Ihr Passwort wurde erfolgreich geändert. Sie können sich
                jetzt mit dem neuen Passwort anmelden.
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full rounded-xl">Zur Anmeldung</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formular
  return (
    <div className="w-full max-w-md px-4">
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main">mein-nutrikompass.de</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Neues Passwort setzen
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
                {error.includes("abgelaufen") && (
                  <Link
                    href="/forgot-password"
                    className="block mt-2 font-medium underline"
                  >
                    Neuen Link anfordern
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Neues Passwort</Label>
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
              className="w-full rounded-xl"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                "Passwort speichern"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
        <Link href="/login" className="hover:underline">
          Zur Anmeldung
        </Link>
        <span>&middot;</span>
        <Link href="/forgot-password" className="hover:underline">
          Passwort vergessen
        </Link>
      </div>
    </div>
  );
}
