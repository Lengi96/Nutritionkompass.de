import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { router, adminProcedure, publicProcedure } from "../init";
import { sendStaffInvitationEmail } from "@/lib/email";
import { createOpaqueTokenPair, hashOpaqueToken } from "@/lib/security/tokens";

export const staffRouter = router({
  // ── Alle Mitarbeiter der Organisation abrufen ─────────────────
  list: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      where: { organizationId: ctx.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        phone: true,
        profileNotes: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return users;
  }),

  // ── Offene Einladungen abrufen ────────────────────────────────
  listInvitations: adminProcedure.query(async ({ ctx }) => {
    const invitations = await ctx.prisma.staffInvitation.findMany({
      where: {
        organizationId: ctx.organizationId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return invitations;
  }),

  // ── Mitarbeiter einladen ──────────────────────────────────────
  invite: adminProcedure
    .input(
      z.object({
        email: z
          .string()
          .email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
        name: z
          .string()
          .trim()
          .min(2, "Der Name muss mindestens 2 Zeichen lang sein.")
          .max(100),
        role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedEmail = input.email.trim().toLowerCase();

      // Prüfen ob E-Mail schon in der Organisation existiert
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          organizationId: ctx.organizationId,
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Ein Mitarbeiter mit dieser E-Mail-Adresse existiert bereits.",
        });
      }

      // Prüfen ob schon eine aktive Einladung existiert
      const existingInvitation = await ctx.prisma.staffInvitation.findUnique({
        where: {
          organizationId_email: {
            organizationId: ctx.organizationId,
            email: normalizedEmail,
          },
        },
      });

      if (existingInvitation && existingInvitation.expiresAt > new Date()) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Es existiert bereits eine aktive Einladung für diese E-Mail-Adresse.",
        });
      }

      // Abgelaufene Einladung löschen falls vorhanden
      if (existingInvitation) {
        await ctx.prisma.staffInvitation.delete({
          where: { id: existingInvitation.id },
        });
      }

      const {
        plainToken: token,
        storedTokenHash: tokenHash,
      } = createOpaqueTokenPair();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage gültig

      // Organisation + Einladender Name für die E-Mail
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { name: true },
      });

      const inviter = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true },
      });

      const invitation = await ctx.prisma.staffInvitation.create({
        data: {
          organizationId: ctx.organizationId,
          email: normalizedEmail,
          name: input.name,
          role: input.role,
          token: tokenHash,
          expiresAt,
          invitedBy: ctx.user.id,
        },
      });

      // E-Mail senden (best-effort)
      try {
        await sendStaffInvitationEmail(
          normalizedEmail,
          input.name,
          organization?.name || "Ihre Einrichtung",
          inviter?.name || "Ein Administrator",
          token
        );
      } catch (error) {
        console.error("[Email] Einladungs-E-Mail fehlgeschlagen:", error);
      }

      return {
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
        },
      };
    }),

  // ── Einladung widerrufen ──────────────────────────────────────
  revokeInvitation: adminProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.staffInvitation.findFirst({
        where: {
          id: input.invitationId,
          organizationId: ctx.organizationId,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einladung nicht gefunden.",
        });
      }

      await ctx.prisma.staffInvitation.delete({
        where: { id: invitation.id },
      });

      return { success: true };
    }),

  // ── Rolle eines Mitarbeiters ändern ───────────────────────────
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["ADMIN", "STAFF"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Sich selbst kann man nicht ändern
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sie können Ihre eigene Rolle nicht ändern.",
        });
      }

      const user = await ctx.prisma.user.findFirst({
        where: {
          id: input.userId,
          organizationId: ctx.organizationId,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mitarbeiter nicht gefunden.",
        });
      }

      const updated = await ctx.prisma.user.update({
        where: { id: user.id },
        data: { role: input.role },
        select: { id: true, name: true, role: true },
      });

      return updated;
    }),

  // ── Mitarbeiterdaten bearbeiten ───────────────────────────────
  update: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        name: z
          .string()
          .trim()
          .min(2, "Der Name muss mindestens 2 Zeichen lang sein.")
          .max(120, "Der Name darf maximal 120 Zeichen lang sein.")
          .regex(/^[^<>]*$/, "Bitte keine HTML-Tags oder Sondermarkierungen verwenden."),
        email: z
          .string()
          .trim()
          .email("Bitte geben Sie eine gültige E-Mail-Adresse ein.")
          .max(160),
        role: z.enum(["ADMIN", "STAFF"]),
        jobTitle: z
          .string()
          .trim()
          .max(100, "Funktion darf maximal 100 Zeichen lang sein.")
          .regex(/^[^<>]*$/, "Bitte keine HTML-Tags oder Sondermarkierungen verwenden.")
          .optional()
          .nullable(),
        phone: z
          .string()
          .trim()
          .max(40, "Telefonnummer darf maximal 40 Zeichen lang sein.")
          .regex(/^[0-9+\-()\/\s.]*$/, "Telefonnummer enthält ungültige Zeichen.")
          .optional()
          .nullable(),
        profileNotes: z
          .string()
          .trim()
          .max(1000, "Notizen dürfen maximal 1000 Zeichen lang sein.")
          .regex(/^[^<>]*$/, "Bitte keine HTML-Tags oder Sondermarkierungen verwenden.")
          .optional()
          .nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id && input.role !== "ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sie können Ihre eigene Admin-Rolle nicht entfernen.",
        });
      }

      const targetUser = await ctx.prisma.user.findFirst({
        where: {
          id: input.userId,
          organizationId: ctx.organizationId,
        },
        select: { id: true, role: true },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mitarbeiter nicht gefunden.",
        });
      }

      if (targetUser.role === "ADMIN" && input.role === "STAFF") {
        const activeAdminCount = await ctx.prisma.user.count({
          where: {
            organizationId: ctx.organizationId,
            role: "ADMIN",
            isActive: true,
          },
        });

        if (activeAdminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Mindestens ein aktiver Administrator muss erhalten bleiben.",
          });
        }
      }

      const normalizedEmail = input.email.trim().toLowerCase();
      const duplicateEmail = await ctx.prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
          NOT: { id: input.userId },
        },
        select: { id: true },
      });

      if (duplicateEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Diese E-Mail-Adresse ist bereits vergeben.",
        });
      }

      const normalizeOptional = (value?: string | null) => {
        if (!value) return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const updated = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          name: input.name.trim(),
          email: normalizedEmail,
          role: input.role,
          jobTitle: normalizeOptional(input.jobTitle),
          phone: normalizeOptional(input.phone),
          profileNotes: normalizeOptional(input.profileNotes),
        },
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          phone: true,
          profileNotes: true,
          role: true,
          isActive: true,
        },
      });

      return updated;
    }),

  // ── Mitarbeiter deaktivieren ──────────────────────────────────
  deactivate: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Sich selbst kann man nicht deaktivieren
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sie können sich nicht selbst deaktivieren.",
        });
      }

      const user = await ctx.prisma.user.findFirst({
        where: {
          id: input.userId,
          organizationId: ctx.organizationId,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mitarbeiter nicht gefunden.",
        });
      }

      const updated = await ctx.prisma.user.update({
        where: { id: user.id },
        data: { isActive: !user.isActive },
        select: { id: true, name: true, isActive: true },
      });

      return updated;
    }),

  // ── Mitarbeiter datenschutzkonform entfernen ──────────────────
  remove: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sie können Ihren eigenen Account hier nicht entfernen.",
        });
      }

      const user = await ctx.prisma.user.findFirst({
        where: {
          id: input.userId,
          organizationId: ctx.organizationId,
        },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mitarbeiter nicht gefunden.",
        });
      }

      if (user.role === "ADMIN" && user.isActive) {
        const activeAdminCount = await ctx.prisma.user.count({
          where: {
            organizationId: ctx.organizationId,
            role: "ADMIN",
            isActive: true,
          },
        });

        if (activeAdminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Der letzte aktive Administrator kann nicht entfernt werden.",
          });
        }
      }

      const deletedEmail = `deleted+${user.id}+${Date.now()}@anonymized.local`;
      const deletedName = "Gelöschter Account";

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          isActive: false,
          name: deletedName,
          email: deletedEmail,
          jobTitle: null,
          phone: null,
          profileNotes: null,
        },
      });

      return { success: true };
    }),

  // ── Einladung annehmen (öffentlich – per Token) ───────────────
  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.staffInvitation.findUnique({
        where: { token: hashOpaqueToken(input.token) },
        include: { organization: { select: { name: true } } },
      });
      const resolvedInvitation =
        invitation ??
        (await ctx.prisma.staffInvitation.findUnique({
          where: { token: input.token },
          include: { organization: { select: { name: true } } },
        }));

      if (!resolvedInvitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einladung nicht gefunden oder bereits verwendet.",
        });
      }

      if (resolvedInvitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Diese Einladung ist abgelaufen.",
        });
      }

      return {
        email: resolvedInvitation.email,
        name: resolvedInvitation.name,
        role: resolvedInvitation.role,
        organizationName: resolvedInvitation.organization.name,
      };
    }),

  // ── Einladung abschließen (Account erstellen) ─────────────────
  completeInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        password: z
          .string()
          .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.staffInvitation.findUnique({
        where: { token: hashOpaqueToken(input.token) },
      });
      const resolvedInvitation =
        invitation ??
        (await ctx.prisma.staffInvitation.findUnique({
          where: { token: input.token },
        }));

      if (!resolvedInvitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einladung nicht gefunden oder bereits verwendet.",
        });
      }

      if (resolvedInvitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Diese Einladung ist abgelaufen.",
        });
      }

      // Prüfen ob die E-Mail bereits existiert
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: resolvedInvitation.email.toLowerCase() },
      });

      if (existingUser) {
        // Einladung aufräumen
        await ctx.prisma.staffInvitation.delete({
          where: { id: resolvedInvitation.id },
        });
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Ein Konto mit dieser E-Mail-Adresse existiert bereits. Bitte melden Sie sich an.",
        });
      }

      const passwordHash = await hash(input.password, 12);

      // User erstellen + Einladung löschen in einer Transaktion
      await ctx.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            organizationId: resolvedInvitation.organizationId,
            email: resolvedInvitation.email.toLowerCase(),
            name: resolvedInvitation.name,
            passwordHash,
            role: resolvedInvitation.role,
            emailVerified: true, // Per Einladung verifiziert
          },
        });

        await tx.staffInvitation.delete({
          where: { id: resolvedInvitation.id },
        });
      });

      return { success: true, email: resolvedInvitation.email.toLowerCase() };
    }),

  // ── DSGVO: Datenexport ────────────────────────────────────────
  exportData: adminProcedure.mutation(async ({ ctx }) => {
    const organization = await ctx.prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            phone: true,
            profileNotes: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        patients: {
          include: {
            weightHistory: true,
            mealPlans: {
              include: { shoppingList: true },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organisation nicht gefunden.",
      });
    }

    return {
      exportDate: new Date().toISOString(),
      organization: {
        id: organization.id,
        name: organization.name,
        createdAt: organization.createdAt,
        subscriptionPlan: organization.subscriptionPlan,
      },
      users: organization.users,
      patients: organization.patients.map((p) => ({
        id: p.id,
        pseudonym: p.pseudonym,
        birthYear: p.birthYear,
        currentWeight: p.currentWeight,
        targetWeight: p.targetWeight,
        allergies: p.allergies,
        notes: p.notes,
        isActive: p.isActive,
        createdAt: p.createdAt,
        weightHistory: p.weightHistory.map((w) => ({
          weightKg: w.weightKg,
          recordedAt: w.recordedAt,
        })),
        mealPlans: p.mealPlans.map((mp) => ({
          weekStart: mp.weekStart,
          totalKcal: mp.totalKcal,
          planJson: mp.planJson,
          createdAt: mp.createdAt,
          shoppingList: mp.shoppingList?.itemsJson || null,
        })),
      })),
    };
  }),

  // ── DSGVO: Datenlöschung beantragen ───────────────────────────
  requestDeletion: adminProcedure.mutation(async ({ ctx }) => {
    // In der Praxis würde hier eine E-Mail an den Support gehen
    // oder ein Lösch-Flag gesetzt werden. Für jetzt: Soft-Delete der Patienten.
    const organization = await ctx.prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { name: true },
    });

    // Alle aktiven Patienten deaktivieren (Soft-Delete)
    const result = await ctx.prisma.patient.updateMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
      },
      data: { isActive: false },
    });

    return {
      success: true,
      deactivatedPatients: result.count,
      message: `${result.count} Patientendatensätze wurden deaktiviert. Für eine vollständige Löschung kontaktieren Sie bitte den Support.`,
      organizationName: organization?.name,
    };
  }),
});
