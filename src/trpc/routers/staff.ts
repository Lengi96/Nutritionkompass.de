import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { router, adminProcedure, publicProcedure } from "../init";
import { sendStaffInvitationEmail } from "@/lib/email";

export const staffRouter = router({
  // ── Alle Mitarbeiter der Organisation abrufen ─────────────────
  list: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      where: { organizationId: ctx.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
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
      // Prüfen ob E-Mail schon in der Organisation existiert
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
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
            email: input.email,
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

      const token = crypto.randomUUID();
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
          email: input.email,
          name: input.name,
          role: input.role,
          token,
          expiresAt,
          invitedBy: ctx.user.id,
        },
      });

      // E-Mail senden (best-effort)
      try {
        await sendStaffInvitationEmail(
          input.email,
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

  // ── Einladung annehmen (öffentlich – per Token) ───────────────
  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.staffInvitation.findUnique({
        where: { token: input.token },
        include: { organization: { select: { name: true } } },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einladung nicht gefunden oder bereits verwendet.",
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Diese Einladung ist abgelaufen.",
        });
      }

      return {
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        organizationName: invitation.organization.name,
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
        where: { token: input.token },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einladung nicht gefunden oder bereits verwendet.",
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Diese Einladung ist abgelaufen.",
        });
      }

      // Prüfen ob die E-Mail bereits existiert
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: invitation.email },
      });

      if (existingUser) {
        // Einladung aufräumen
        await ctx.prisma.staffInvitation.delete({
          where: { id: invitation.id },
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
            organizationId: invitation.organizationId,
            email: invitation.email,
            name: invitation.name,
            passwordHash,
            role: invitation.role,
            emailVerified: true, // Per Einladung verifiziert
          },
        });

        await tx.staffInvitation.delete({
          where: { id: invitation.id },
        });
      });

      return { success: true, email: invitation.email };
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
