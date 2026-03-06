"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getUiDensityDataValue,
  LANDING_PAGE_OPTIONS,
  UI_DENSITY_OPTIONS,
} from "@/lib/settings";
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
import {
  Building2,
  Clock,
  Info,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";

const normalizeOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "";
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const utils = trpc.useUtils();
  const isAdmin = session?.user?.role === "ADMIN";
  const [defaultLandingPage, setDefaultLandingPage] = useState<
    "DASHBOARD" | "PATIENTS" | "MEAL_PLANS" | "SHOPPING_LISTS"
  >("DASHBOARD");
  const [uiDensity, setUiDensity] = useState<"COMFORTABLE" | "COMPACT">("COMFORTABLE");

  const [orgName, setOrgName] = useState("");
  const [orgContactEmail, setOrgContactEmail] = useState("");
  const [orgContactPhone, setOrgContactPhone] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgPostalCode, setOrgPostalCode] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgCountry, setOrgCountry] = useState("");
  const [orgNotes, setOrgNotes] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "STAFF">("STAFF");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeName, setRemoveName] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const { data: mySettings, isLoading: mySettingsLoading } = trpc.settings.getMySettings.useQuery();

  const { data: organization, isLoading: orgLoading } = trpc.organization.get.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: staffList, isLoading: staffLoading } = trpc.staff.list.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: invitations } = trpc.staff.listInvitations.useQuery(undefined, { enabled: isAdmin });

  useEffect(() => {
    if (!organization) return;
    setOrgName(organization.name ?? "");
    setOrgContactEmail(organization.contactEmail ?? "");
    setOrgContactPhone(organization.contactPhone ?? "");
    setOrgWebsite(organization.websiteUrl ?? "");
    setOrgAddress(organization.addressLine ?? "");
    setOrgPostalCode(organization.postalCode ?? "");
    setOrgCity(organization.city ?? "");
    setOrgCountry(organization.country ?? "");
    setOrgNotes(organization.profileNotes ?? "");
  }, [organization]);

  useEffect(() => {
    if (!mySettings) return;
    setDefaultLandingPage(mySettings.defaultLandingPage);
    setUiDensity(mySettings.uiDensity);
  }, [mySettings]);

  const updateOrg = trpc.organization.updateProfile.useMutation({
    onSuccess: (data) => {
      utils.organization.get.setData(undefined, data);
      toast.success("Einrichtung wurde gespeichert.");
    },
    onError: (error) => toast.error(error.message || "Einrichtung konnte nicht gespeichert werden."),
  });
  const updateMySettings = trpc.settings.updateMySettings.useMutation({
    onSuccess: (data) => {
      utils.settings.getMySettings.setData(undefined, data);
      const densityValue = getUiDensityDataValue(data.uiDensity);
      document.getElementById("dashboard-shell")?.setAttribute("data-ui-density", densityValue);
      toast.success("Persönliche Einstellungen wurden gespeichert.");
    },
    onError: (error) =>
      toast.error(error.message || "Persönliche Einstellungen konnten nicht gespeichert werden."),
  });
  const inviteMutation = trpc.staff.invite.useMutation({
    onSuccess: () => {
      toast.success("Einladung wurde gesendet.");
      setInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("STAFF");
      utils.staff.listInvitations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Einladung fehlgeschlagen."),
  });
  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => {
      toast.success("Mitarbeiter wurde aktualisiert.");
      setEditOpen(false);
      setEditId(null);
      utils.staff.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Mitarbeiter konnte nicht aktualisiert werden."),
  });
  const updateRoleMutation = trpc.staff.updateRole.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
    onError: (error) => toast.error(error.message || "Rolle konnte nicht geÃ¤ndert werden."),
  });
  const deactivateMutation = trpc.staff.deactivate.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
    onError: (error) => toast.error(error.message || "Status konnte nicht geÃ¤ndert werden."),
  });
  const removeMutation = trpc.staff.remove.useMutation({
    onSuccess: () => {
      toast.success("Mitarbeiterkonto wurde anonymisiert und deaktiviert.");
      setRemoveOpen(false);
      setRemoveId(null);
      setRemoveName("");
      setRemoveConfirm("");
      utils.staff.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Mitarbeiter konnte nicht entfernt werden."),
  });
  const revokeInviteMutation = trpc.staff.revokeInvitation.useMutation({
    onSuccess: () => utils.staff.listInvitations.invalidate(),
    onError: (error) => toast.error(error.message || "Einladung konnte nicht widerrufen werden."),
  });
  const requestDeletionMutation = trpc.staff.requestDeletion.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setDeleteOpen(false);
      setDeleteConfirm("");
    },
    onError: (error) => toast.error(error.message || "LÃ¶schungsantrag fehlgeschlagen."),
  });

  const orgPayload = useMemo(
    () => ({
      name: orgName.trim(),
      contactEmail: normalizeOptional(orgContactEmail),
      contactPhone: normalizeOptional(orgContactPhone),
      websiteUrl: normalizeOptional(orgWebsite),
      addressLine: normalizeOptional(orgAddress),
      postalCode: normalizeOptional(orgPostalCode),
      city: normalizeOptional(orgCity),
      country: normalizeOptional(orgCountry),
      profileNotes: normalizeOptional(orgNotes),
    }),
    [orgAddress, orgCity, orgContactEmail, orgContactPhone, orgCountry, orgName, orgNotes, orgPostalCode, orgWebsite]
  );
  const orgHasChanges = useMemo(() => {
    if (!organization) return false;
    return (
      orgPayload.name !== organization.name ||
      orgPayload.contactEmail !== (organization.contactEmail ?? "") ||
      orgPayload.contactPhone !== (organization.contactPhone ?? "") ||
      orgPayload.websiteUrl !== (organization.websiteUrl ?? "") ||
      orgPayload.addressLine !== (organization.addressLine ?? "") ||
      orgPayload.postalCode !== (organization.postalCode ?? "") ||
      orgPayload.city !== (organization.city ?? "") ||
      orgPayload.country !== (organization.country ?? "") ||
      orgPayload.profileNotes !== (organization.profileNotes ?? "")
    );
  }, [orgPayload, organization]);

  const mySettingsHasChanges =
    !!mySettings &&
    (defaultLandingPage !== mySettings.defaultLandingPage ||
      uiDensity !== mySettings.uiDensity);

  if (status === "loading") return <div className="py-20 text-center text-muted-foreground">Lade Einstellungen...</div>;

  const submitOrg = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateOrg.mutate({
      ...orgPayload,
      contactEmail: orgPayload.contactEmail || null,
      contactPhone: orgPayload.contactPhone || null,
      websiteUrl: orgPayload.websiteUrl || null,
      addressLine: orgPayload.addressLine || null,
      postalCode: orgPayload.postalCode || null,
      city: orgPayload.city || null,
      country: orgPayload.country || null,
      profileNotes: orgPayload.profileNotes || null,
    });
  };
  const submitMySettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateMySettings.mutate({
      defaultLandingPage,
      uiDensity,
    });
  };
  const submitInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    inviteMutation.mutate({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole });
  };
  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editId) return;
    updateMutation.mutate({
      userId: editId,
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
      jobTitle: normalizeOptional(editJobTitle) || null,
      phone: normalizeOptional(editPhone) || null,
      profileNotes: normalizeOptional(editNotes) || null,
    });
  };
  const openEditDialog = (member: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "STAFF";
    jobTitle: string | null;
    phone: string | null;
    profileNotes: string | null;
  }) => {
    setEditId(member.id);
    setEditName(member.name ?? "");
    setEditEmail(member.email ?? "");
    setEditRole(member.role);
    setEditJobTitle(member.jobTitle ?? "");
    setEditPhone(member.phone ?? "");
    setEditNotes(member.profileNotes ?? "");
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Einstellungen</h2>
        <p className="text-muted-foreground">Persönliche Einstellungen und Verwaltung</p>
      </div>

      <div className="grid gap-6">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-text-main">Persönliche Einstellungen</CardTitle>
            <CardDescription>
              Gilt nur für Ihren eigenen Arbeitsplatz und Ihre Navigation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitMySettings}>
              <div className="space-y-2">
                <Label htmlFor="defaultLandingPage">Standard-Startseite</Label>
                <Select value={defaultLandingPage} onValueChange={(value) => setDefaultLandingPage(value as typeof defaultLandingPage)}>
                  <SelectTrigger id="defaultLandingPage" disabled={mySettingsLoading || updateMySettings.isPending}>
                    <SelectValue placeholder="Startseite wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANDING_PAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Wird nach dem Login und über das Logo in der Hauptnavigation berücksichtigt.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uiDensity">Listendichte</Label>
                <Select value={uiDensity} onValueChange={(value) => setUiDensity(value as typeof uiDensity)}>
                  <SelectTrigger id="uiDensity" disabled={mySettingsLoading || updateMySettings.isPending}>
                    <SelectValue placeholder="Dichte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {UI_DENSITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Wirkt auf Tabellen und Übersichtslisten im Dashboard-Bereich.
                </p>
              </div>

              <Button
                type="submit"
                className="rounded-xl bg-primary hover:bg-primary-600"
                disabled={mySettingsLoading || updateMySettings.isPending || !mySettingsHasChanges}
              >
                {updateMySettings.isPending ? "Speichert..." : "Persönliche Einstellungen speichern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="staff" className="rounded-xl"><Users className="mr-2 h-4 w-4" />Mitarbeiter:innen</TabsTrigger>
          <TabsTrigger value="organization" className="rounded-xl"><Building2 className="mr-2 h-4 w-4" />Einrichtung</TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-xl"><Lock className="mr-2 h-4 w-4" />Datenschutz</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-text-main">Mitarbeiter:innen verwalten</CardTitle>
                  <CardDescription>Bearbeiten, deaktivieren und datenschutzkonform entfernen</CardDescription>
                </div>
                <Button className="rounded-xl bg-primary hover:bg-primary-600" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />Mitarbeiter:in einladen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Lade Mitarbeiter:innen...</div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>E-Mail</TableHead><TableHead>Rolle</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {staffList?.map((member) => {
                      const isCurrentUser = member.id === session?.user?.id;
                      return (
                        <TableRow key={member.id} className={!member.isActive ? "opacity-50" : undefined}>
                          <TableCell className="font-medium">
                            <div>{member.name}</div>
                            {(member.jobTitle || member.phone) && <div className="text-xs text-muted-foreground">{member.jobTitle || ""}{member.jobTitle && member.phone ? " â€¢ " : ""}{member.phone || ""}</div>}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell><Badge className={member.role === "ADMIN" ? "rounded-xl bg-primary text-white" : "rounded-xl bg-accent text-text-main"}>{member.role === "ADMIN" ? "Administrator:in" : "Mitarbeiter:in"}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className={member.isActive ? "rounded-xl bg-secondary/20 text-secondary-600" : "rounded-xl bg-destructive/10 text-destructive"}>{member.isActive ? "Aktiv" : "Inaktiv"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => openEditDialog(member)}><Pencil className="mr-2 h-4 w-4" />Bearbeiten {isCurrentUser ? "(Sie)" : ""}</DropdownMenuItem>
                                <DropdownMenuItem disabled={isCurrentUser} onClick={() => updateRoleMutation.mutate({ userId: member.id, role: member.role === "ADMIN" ? "STAFF" : "ADMIN" })}><Shield className="mr-2 h-4 w-4" />{member.role === "ADMIN" ? "Zu Mitarbeiter:in Ã¤ndern" : "Zum Admin befÃ¶rdern"}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled={isCurrentUser} className={member.isActive ? "text-destructive focus:text-destructive" : "text-green-600 focus:text-green-600"} onClick={() => deactivateMutation.mutate({ userId: member.id })}>{member.isActive ? (<><X className="mr-2 h-4 w-4" />Deaktivieren</>) : (<><Users className="mr-2 h-4 w-4" />Reaktivieren</>)}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled={isCurrentUser} className="text-destructive focus:text-destructive" onClick={() => { setRemoveId(member.id); setRemoveName(member.name); setRemoveConfirm(""); setRemoveOpen(true); }}><UserX className="mr-2 h-4 w-4" />Entfernen</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {invitations && invitations.length > 0 && (
            <Card className="rounded-xl shadow-sm">
              <CardHeader><CardTitle className="text-base text-text-main">Offene Einladungen</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>E-Mail</TableHead><TableHead>Rolle</TableHead><TableHead>GÃ¼ltig bis</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {invitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.name}</TableCell><TableCell>{inv.email}</TableCell><TableCell>{inv.role}</TableCell>
                        <TableCell><span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3 w-3" />{new Date(inv.expiresAt).toLocaleDateString("de-DE")}</span></TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => revokeInviteMutation.mutate({ invitationId: inv.id })}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="organization">
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-text-main">Einrichtungsdaten</CardTitle><CardDescription>Erweiterte Details mit datensparsamen Feldern (keine Patientendaten)</CardDescription></CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitOrg}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="orgName">Einrichtungsname</Label><Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} disabled={orgLoading || updateOrg.isPending} /></div>
                  <div className="space-y-2"><Label htmlFor="orgContactEmail">Kontakt-E-Mail</Label><Input id="orgContactEmail" type="email" value={orgContactEmail} onChange={(e) => setOrgContactEmail(e.target.value)} disabled={orgLoading || updateOrg.isPending} /></div>
                  <div className="space-y-2"><Label htmlFor="orgContactPhone">Telefon</Label><Input id="orgContactPhone" value={orgContactPhone} onChange={(e) => setOrgContactPhone(e.target.value)} disabled={orgLoading || updateOrg.isPending} /></div>
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="orgWebsite">Website</Label><Input id="orgWebsite" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} disabled={orgLoading || updateOrg.isPending} placeholder="https://..." /></div>
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="orgAddress">Adresse</Label><Input id="orgAddress" value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} disabled={orgLoading || updateOrg.isPending} /></div>
                  <div className="space-y-2"><Label htmlFor="orgPostalCode">PLZ</Label><Input id="orgPostalCode" value={orgPostalCode} onChange={(e) => setOrgPostalCode(e.target.value)} disabled={orgLoading || updateOrg.isPending} /></div>
                  <div className="space-y-2"><Label htmlFor="orgCity">Ort</Label><Input id="orgCity" value={orgCity} onChange={(e) => setOrgCity(e.target.value)} disabled={orgLoading || updateOrg.isPending} /></div>
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="orgCountry">Land</Label><Input id="orgCountry" value={orgCountry} onChange={(e) => setOrgCountry(e.target.value)} disabled={orgLoading || updateOrg.isPending} /></div>
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="orgNotes">Interne Hinweise</Label><Textarea id="orgNotes" value={orgNotes} onChange={(e) => setOrgNotes(e.target.value)} placeholder="Nur Organisationshinweise, keine sensiblen Patientendaten." disabled={orgLoading || updateOrg.isPending} /></div>
                </div>
                <Button type="submit" className="rounded-xl bg-primary hover:bg-primary-600" disabled={updateOrg.isPending || orgPayload.name.length < 2 || !orgHasChanges}>{updateOrg.isPending ? "Speichert..." : "Speichern"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-text-main"><Shield className="h-5 w-5 text-primary" />Datenschutz & DSGVO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="flex items-start gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4" />Mitarbeiter- und Einrichtungsdetails sind optional, validiert, und auf notwendige Felder begrenzt.</p>
              <Button variant="outline" className="rounded-xl text-destructive border-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" />DatenlÃ¶schung beantragen</Button>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:rounded-xl">
          <DialogHeader><DialogTitle>Mitarbeiter:in einladen</DialogTitle><DialogDescription>Einladung ist 7 Tage gÃ¼ltig.</DialogDescription></DialogHeader>
          <form onSubmit={submitInvite} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="inviteName">Name</Label><Input id="inviteName" value={inviteName} onChange={(e) => setInviteName(e.target.value)} required minLength={2} /></div>
            <div className="space-y-2"><Label htmlFor="inviteEmail">E-Mail</Label><Input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="inviteRole">Rolle</Label><Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "ADMIN" | "STAFF")}><SelectTrigger id="inviteRole"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STAFF">Mitarbeiter:in</SelectItem><SelectItem value="ADMIN">Administrator:in</SelectItem></SelectContent></Select></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Abbrechen</Button><Button type="submit" disabled={inviteMutation.isPending || inviteName.trim().length < 2 || !inviteEmail.includes("@")}>{inviteMutation.isPending ? "Sendet..." : "Einladen"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:rounded-xl">
          <DialogHeader><DialogTitle>Mitarbeiter:in bearbeiten</DialogTitle><DialogDescription>Nur arbeitsbezogene Daten speichern.</DialogDescription></DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="editName">Name</Label><Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} required minLength={2} /></div>
            <div className="space-y-2"><Label htmlFor="editEmail">E-Mail</Label><Input id="editEmail" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="editRole">Rolle</Label><Select value={editRole} onValueChange={(v) => setEditRole(v as "ADMIN" | "STAFF")}><SelectTrigger id="editRole"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STAFF">Mitarbeiter:in</SelectItem><SelectItem value="ADMIN">Administrator:in</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="editJobTitle">Funktion</Label><Input id="editJobTitle" value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="editPhone">Telefon</Label><Input id="editPhone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="editNotes">Interne Notiz</Label><Textarea id="editNotes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => { setEditOpen(false); setEditId(null); }}>Abbrechen</Button><Button type="submit" disabled={updateMutation.isPending || !editId || editName.trim().length < 2 || !editEmail.includes("@")}>{updateMutation.isPending ? "Speichert..." : "Speichern"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent className="sm:rounded-xl">
          <DialogHeader><DialogTitle className="text-destructive">Mitarbeiterkonto entfernen</DialogTitle><DialogDescription>Konto wird deaktiviert und personenbezogene Kontodaten anonymisiert.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="removeConfirm">Zur BestÃ¤tigung Namen eingeben: <strong>{removeName}</strong></Label><Input id="removeConfirm" value={removeConfirm} onChange={(e) => setRemoveConfirm(e.target.value)} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => { setRemoveOpen(false); setRemoveId(null); setRemoveName(""); setRemoveConfirm(""); }}>Abbrechen</Button><Button variant="destructive" disabled={!removeId || removeMutation.isPending || removeConfirm.trim() !== removeName} onClick={() => removeId && removeMutation.mutate({ userId: removeId })}>{removeMutation.isPending ? "Entfernt..." : "Entfernen"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:rounded-xl">
          <DialogHeader><DialogTitle className="text-destructive">DatenlÃ¶schung beantragen</DialogTitle><DialogDescription>Soft-Delete fÃ¼r aktive DatensÃ¤tze Ihrer Einrichtung.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="deleteConfirm">Bitte <strong>LÃ–SCHEN</strong> eingeben:</Label><Input id="deleteConfirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}>Abbrechen</Button><Button variant="destructive" disabled={requestDeletionMutation.isPending || deleteConfirm !== "LÃ–SCHEN"} onClick={() => requestDeletionMutation.mutate()}>{requestDeletionMutation.isPending ? "Verarbeitet..." : "LÃ¶schung beantragen"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

