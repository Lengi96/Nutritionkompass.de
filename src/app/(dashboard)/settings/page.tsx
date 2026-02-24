"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Users,
  Building2,
  Lock,
  Info,
  Loader2,
  MoreHorizontal,
  UserPlus,
  Mail,
  Download,
  Trash2,
  Clock,
  X,
} from "lucide-react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const utils = trpc.useUtils();
  const [organizationName, setOrganizationName] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ── Invite Dialog ──
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"STAFF" | "ADMIN">("STAFF");

  // ── Delete Dialog ──
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";

  // ── Organization Data ──
  const { data: organization, isLoading: organizationLoading } =
    trpc.organization.get.useQuery(undefined, {
      enabled: isAdmin,
    });

  // ── Staff Data ──
  const { data: staffList, isLoading: staffLoading } =
    trpc.staff.list.useQuery(undefined, {
      enabled: isAdmin,
    });

  // ── Invitations Data ──
  const { data: invitations } = trpc.staff.listInvitations.useQuery(
    undefined,
    { enabled: isAdmin }
  );

  useEffect(() => {
    if (organization?.name) {
      setOrganizationName(organization.name);
    }
  }, [organization?.name]);

  // ── Mutations ──
  const updateOrganization = trpc.organization.updateName.useMutation({
    onSuccess: (updatedOrganization) => {
      utils.organization.get.setData(undefined, updatedOrganization);
      setLastSavedAt(
        new Date().toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setInlineFeedback({
        type: "success",
        message: "Einrichtung wurde erfolgreich gespeichert.",
      });
      toast.success("Einrichtung wurde gespeichert.");
    },
    onError: (error) => {
      setInlineFeedback({
        type: "error",
        message:
          error.message || "Einrichtung konnte nicht gespeichert werden.",
      });
      toast.error(
        error.message || "Einrichtung konnte nicht gespeichert werden."
      );
    },
  });

  const inviteMutation = trpc.staff.invite.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Einladung an ${data.invitation.email} wurde gesendet.`
      );
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("STAFF");
      utils.staff.listInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Einladung konnte nicht gesendet werden.");
    },
  });

  const revokeInvitationMutation = trpc.staff.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success("Einladung wurde widerrufen.");
      utils.staff.listInvitations.invalidate();
    },
    onError: (error) => {
      toast.error(
        error.message || "Einladung konnte nicht widerrufen werden."
      );
    },
  });

  const updateRoleMutation = trpc.staff.updateRole.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Rolle von ${data.name} wurde zu ${data.role === "ADMIN" ? "Administrator:in" : "Mitarbeiter:in"} geändert.`
      );
      utils.staff.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Rolle konnte nicht geändert werden.");
    },
  });

  const deactivateMutation = trpc.staff.deactivate.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.isActive
          ? `${data.name} wurde reaktiviert.`
          : `${data.name} wurde deaktiviert.`
      );
      utils.staff.list.invalidate();
    },
    onError: (error) => {
      toast.error(
        error.message || "Status konnte nicht geändert werden."
      );
    },
  });

  const exportMutation = trpc.staff.exportData.useMutation({
    onSuccess: (data) => {
      // JSON-Export herunterladen
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mein-nutrikompass-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Datenexport wurde heruntergeladen.");
    },
    onError: (error) => {
      toast.error(error.message || "Datenexport fehlgeschlagen.");
    },
  });

  const deletionMutation = trpc.staff.requestDeletion.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setDeleteOpen(false);
      setDeleteConfirmText("");
    },
    onError: (error) => {
      toast.error(
        error.message || "Löschungsantrag konnte nicht verarbeitet werden."
      );
    },
  });

  const trimmedName = organizationName.trim();
  const hasUnsavedChanges = useMemo(() => {
    if (!organization) return false;
    return trimmedName !== organization.name;
  }, [organization, trimmedName]);

  const saveStatus = useMemo(() => {
    if (organizationLoading) return "Lade Einrichtungsdaten…";
    if (updateOrganization.isPending) return "Speichert…";
    if (hasUnsavedChanges) return "Ungespeicherte Änderungen";
    if (lastSavedAt) return `Zuletzt gespeichert um ${lastSavedAt} Uhr`;
    return "Alle Änderungen gespeichert";
  }, [
    organizationLoading,
    updateOrganization.isPending,
    hasUnsavedChanges,
    lastSavedAt,
  ]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Lade Einstellungen…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Shield className="mx-auto h-12 w-12 mb-3 opacity-50" />
        <p>Zugriff verweigert. Diese Seite ist nur für Administratoren.</p>
      </div>
    );
  }

  function handleOrganizationSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInlineFeedback(null);
    updateOrganization.mutate({ name: trimmedName });
  }

  function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inviteMutation.mutate({
      email: inviteEmail.trim(),
      name: inviteName.trim(),
      role: inviteRole,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Einstellungen</h2>
        <p className="text-muted-foreground">
          Verwaltung der Einrichtung und Mitarbeiter:innen
        </p>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="staff" className="rounded-xl">
            <Users className="mr-2 h-4 w-4" />
            Mitarbeiter:innen
          </TabsTrigger>
          <TabsTrigger value="organization" className="rounded-xl">
            <Building2 className="mr-2 h-4 w-4" />
            Einrichtung
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-xl">
            <Lock className="mr-2 h-4 w-4" />
            Datenschutz
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════
            TAB: Mitarbeiter verwalten
            ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="staff" className="space-y-4">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-text-main">
                    Mitarbeiter:innen verwalten
                  </CardTitle>
                  <CardDescription>
                    Übersicht aller Mitarbeiter:innen Ihrer Einrichtung
                  </CardDescription>
                </div>
                <Button
                  className="rounded-xl bg-primary hover:bg-primary-600"
                  onClick={() => setInviteOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Mitarbeiter:in einladen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Lade Mitarbeiter:innen…
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList?.map((member) => {
                      const isCurrentUser = member.id === session?.user?.id;
                      return (
                        <TableRow
                          key={member.id}
                          className={
                            !member.isActive ? "opacity-50" : undefined
                          }
                        >
                          <TableCell className="font-medium">
                            {member.name}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                member.role === "ADMIN"
                                  ? "rounded-xl bg-primary text-white"
                                  : "rounded-xl bg-accent text-text-main"
                              }
                            >
                              {member.role === "ADMIN"
                                ? "Administrator:in"
                                : "Mitarbeiter:in"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                member.isActive
                                  ? "rounded-xl bg-secondary/20 text-secondary-600"
                                  : "rounded-xl bg-destructive/10 text-destructive"
                              }
                            >
                              {member.isActive ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isCurrentUser ? (
                              <span className="text-xs text-muted-foreground">
                                (Sie)
                              </span>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="rounded-xl"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateRoleMutation.mutate({
                                        userId: member.id,
                                        role:
                                          member.role === "ADMIN"
                                            ? "STAFF"
                                            : "ADMIN",
                                      })
                                    }
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    {member.role === "ADMIN"
                                      ? "Zu Mitarbeiter:in ändern"
                                      : "Zum Admin befördern"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className={
                                      member.isActive
                                        ? "text-destructive focus:text-destructive"
                                        : "text-green-600 focus:text-green-600"
                                    }
                                    onClick={() =>
                                      deactivateMutation.mutate({
                                        userId: member.id,
                                      })
                                    }
                                  >
                                    {member.isActive ? (
                                      <>
                                        <X className="mr-2 h-4 w-4" />
                                        Deaktivieren
                                      </>
                                    ) : (
                                      <>
                                        <Users className="mr-2 h-4 w-4" />
                                        Reaktivieren
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Offene Einladungen */}
          {invitations && invitations.length > 0 && (
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-text-main text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Offene Einladungen
                </CardTitle>
                <CardDescription>
                  Einladungen, die noch nicht angenommen wurden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Gültig bis</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          {inv.name}
                        </TableCell>
                        <TableCell>{inv.email}</TableCell>
                        <TableCell>
                          <Badge className="rounded-xl bg-accent text-text-main">
                            {inv.role === "ADMIN"
                              ? "Administrator"
                              : "Mitarbeiter"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(inv.expiresAt).toLocaleDateString(
                              "de-DE"
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              revokeInvitationMutation.mutate({
                                invitationId: inv.id,
                              })
                            }
                            disabled={revokeInvitationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB: Einrichtung
            ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="organization">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-text-main">
                Einrichtungsdaten
              </CardTitle>
              <CardDescription>
                Grunddaten Ihrer Einrichtung bearbeiten
              </CardDescription>
            </CardHeader>
            <CardContent className="max-w-md">
              <form className="space-y-4" onSubmit={handleOrganizationSave}>
                <div className="space-y-2">
                  <Label htmlFor="orgName">Einrichtungsname</Label>
                  <Input
                    id="orgName"
                    name="orgName"
                    autoComplete="organization"
                    className="rounded-xl"
                    placeholder="Name der Einrichtung…"
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    disabled={
                      organizationLoading || updateOrganization.isPending
                    }
                  />
                </div>

                <p
                  aria-live="polite"
                  className="text-sm text-muted-foreground"
                >
                  {saveStatus}
                </p>

                {inlineFeedback && (
                  <div
                    role="status"
                    aria-live={
                      inlineFeedback.type === "error" ? "assertive" : "polite"
                    }
                    className={
                      inlineFeedback.type === "error"
                        ? "rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                        : "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                    }
                  >
                    {inlineFeedback.message}
                  </div>
                )}

                <Button
                  type="submit"
                  className="rounded-xl bg-primary hover:bg-primary-600"
                  disabled={
                    organizationLoading ||
                    updateOrganization.isPending ||
                    trimmedName.length < 2 ||
                    !hasUnsavedChanges
                  }
                >
                  {updateOrganization.isPending ? "Speichert…" : "Speichern"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB: Datenschutz
            ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="privacy">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-text-main flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Datenschutz & DSGVO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl bg-accent/50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-text-main mb-1">
                      Datenschutzhinweise
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      mein-nutrikompass.de speichert ausschließlich pseudonymisierte
                      Daten. Es werden keine Klarnamen der Betreuten
                      erfasst. Alle Daten werden verschlüsselt in
                      einer sicheren Datenbank gespeichert und sind nur für
                      autorisiertes Fachpersonal Ihrer Einrichtung zugänglich.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-text-main mb-2">
                  Gespeicherte Daten
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Pseudonyme und Geburtsjahre der betreuten Personen</li>
                  <li>Gewichtsverlaufsdaten</li>
                  <li>Allergien und Unverträglichkeiten</li>
                  <li>
                    Generierte Ernährungspläne und Einkaufslisten
                  </li>
                  <li>Mitarbeiter:innen-Accounts (E-Mail, Name, Rolle)</li>
                </ul>
              </div>

              <Separator />

              {/* Datenexport */}
              <div>
                <h4 className="font-medium text-text-main mb-2">
                  Daten exportieren
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Gemäß DSGVO Art. 20 haben Sie das Recht auf
                  Datenübertragbarkeit. Exportieren Sie alle Daten Ihrer
                  Einrichtung im JSON-Format.
                </p>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending}
                >
                  {exportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exportiert…
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Daten exportieren
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Datenlöschung */}
              <div>
                <h4 className="font-medium text-text-main mb-2">
                  Datenlöschung beantragen
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Gemäß DSGVO Art. 17 haben betroffene Personen das Recht auf
                  Löschung ihrer Daten. Bewohner:innen werden in mein-nutrikompass.de
                  standardmäßig deaktiviert (Soft-Delete), um die
                  Dokumentationspflicht zu erfüllen.
                </p>
                <Button
                  variant="outline"
                  className="rounded-xl text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Datenlöschung beantragen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ════════════════════════════════════════════════════════════════
          DIALOG: Mitarbeiter einladen
          ════════════════════════════════════════════════════════════════ */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>Mitarbeiter:in einladen</DialogTitle>
            <DialogDescription>
              Die eingeladene Person erhält eine E-Mail mit einem Link zur
              Registrierung. Die Einladung ist 7 Tage gültig.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteName">Name</Label>
              <Input
                id="inviteName"
                className="rounded-xl"
                placeholder="Vor- und Nachname"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">E-Mail-Adresse</Label>
              <Input
                id="inviteEmail"
                type="email"
                className="rounded-xl"
                placeholder="name@einrichtung.de"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Rolle</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as "STAFF" | "ADMIN")}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="STAFF">
                    Mitarbeiter:in – kann Bewohner:innen & Pläne verwalten
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    Administrator:in – voller Zugriff inkl. Einstellungen
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setInviteOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-primary hover:bg-primary-600"
                disabled={
                  inviteMutation.isPending ||
                  inviteName.trim().length < 2 ||
                  !inviteEmail.includes("@")
                }
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sendet…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Einladung senden
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          DIALOG: Datenlöschung bestätigen
          ════════════════════════════════════════════════════════════════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Datenlöschung beantragen
            </DialogTitle>
            <DialogDescription>
              Dies deaktiviert alle aktiven Datensätze Ihrer
              Einrichtung (Soft-Delete). Für eine vollständige Löschung
              kontaktieren Sie bitte den Support.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              <strong>Achtung:</strong> Diese Aktion kann nicht direkt
              rückgängig gemacht werden. Alle aktiven Daten werden
              deaktiviert.
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">
                Bitte geben Sie <strong>LÖSCHEN</strong> ein, um zu bestätigen:
              </Label>
              <Input
                id="deleteConfirm"
                className="rounded-xl"
                placeholder="LÖSCHEN"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirmText("");
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={
                deleteConfirmText !== "LÖSCHEN" || deletionMutation.isPending
              }
              onClick={() => deletionMutation.mutate()}
            >
              {deletionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verarbeitet…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschung beantragen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
