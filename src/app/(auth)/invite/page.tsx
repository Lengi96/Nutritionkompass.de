"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Compass,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

const passwordSchema = z
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

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Einladungsdaten laden
  const {
    data: invitation,
    isLoading,
    error: fetchError,
  } = trpc.staff.acceptInvitation.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const completeMutation = trpc.staff.completeInvitation.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Konto wurde erfolgreich erstellt.");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  function onSubmit(data: PasswordFormData) {
    setError(null);
    completeMutation.mutate({ token, password: data.password });
  }

  // Kein Token
  if (!token) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-sm rounded-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Compass className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-main">mein-nutrikompass.de</h1>
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
                Dieser Einladungslink ist ungültig. Bitte wenden Sie sich an
                den Administrator Ihrer Einrichtung.
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

  // Laden
  if (isLoading) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-sm rounded-xl">
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Einladung wird geladen…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fehler beim Laden (abgelaufen, nicht gefunden)
  if (fetchError || !invitation) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-sm rounded-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Compass className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-main">mein-nutrikompass.de</h1>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-text-main">
                Einladung ungültig
              </h2>
              <p className="text-sm text-muted-foreground">
                {fetchError?.message ||
                  "Diese Einladung ist ungültig oder abgelaufen. Bitte wenden Sie sich an den Administrator."}
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

  // Erfolg – Konto erstellt
  if (success) {
    return (
      <div className="w-full max-w-md px-4">
        <Card className="shadow-sm rounded-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Compass className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-main">mein-nutrikompass.de</h1>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-text-main">
                Willkommen bei {invitation.organizationName}!
              </h2>
              <p className="text-sm text-muted-foreground">
                Ihr Konto wurde erfolgreich erstellt. Sie können sich jetzt
                anmelden.
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

  // Formular – Passwort setzen
  return (
    <div className="w-full max-w-md px-4">
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main">mein-nutrikompass.de</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Einladung annehmen
          </p>
        </CardHeader>
        <CardContent>
          {/* Einladungsinfo */}
          <div className="rounded-xl bg-accent/50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-main">
                  {invitation.organizationName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Sie wurden als{" "}
                  <Badge className="rounded-xl bg-primary/10 text-primary text-xs">
                    {invitation.role === "ADMIN"
                      ? "Administrator"
                      : "Mitarbeiter"}
                  </Badge>{" "}
                  eingeladen.
                </p>
                <p className="text-xs text-muted-foreground">
                  {invitation.name} &middot; {invitation.email}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Passwort festlegen</Label>
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
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Konto wird erstellt…
                </>
              ) : (
                "Konto erstellen & Einladung annehmen"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Bereits ein Konto?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
