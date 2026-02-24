import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { router, publicProcedure, protectedProcedure } from "../init";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email";
import { createOpaqueTokenPair, hashOpaqueToken } from "@/lib/security/tokens";

export const authRouter = router({
  // ── Registrierung ──────────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        organizationName: z
          .string()
          .trim()
          .min(2, "Der Einrichtungsname muss mindestens 2 Zeichen lang sein.")
          .max(120),
        name: z
          .string()
          .trim()
          .min(2, "Der Name muss mindestens 2 Zeichen lang sein.")
          .max(100),
        email: z
          .string()
          .email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
        password: z
          .string()
          .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prüfen ob die E-Mail bereits existiert
      const email = input.email.trim().toLowerCase();
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Diese E-Mail-Adresse ist bereits registriert.",
        });
      }

      const passwordHash = await hash(input.password, 12);
      const {
        plainToken: emailVerificationToken,
        storedTokenHash: emailVerificationTokenHash,
      } = createOpaqueTokenPair();

      // Einrichtung + Admin-User in einer Transaktion erstellen
      const result = await ctx.prisma.$transaction(async (tx) => {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const organization = await tx.organization.create({
          data: {
            name: input.organizationName,
            subscriptionPlan: "TRIAL",
            subscriptionStatus: "TRIALING",
            trialEndsAt,
          },
        });

        const user = await tx.user.create({
          data: {
            organizationId: organization.id,
            email,
            name: input.name,
            passwordHash,
            role: "ADMIN",
            emailVerified: false,
            emailVerificationToken: emailVerificationTokenHash,
          },
        });

        return { organization, user };
      });

      // Verifizierungs-E-Mail senden (best-effort)
      try {
        await sendVerificationEmail(
          result.user.email,
          result.user.name,
          emailVerificationToken
        );
      } catch (error) {
        console.error("[Email] Verifizierungs-E-Mail fehlgeschlagen:", error);
        // Nicht werfen – User kann per Resend erneut anfordern
      }

      return { success: true, email: result.user.email };
    }),

  // ── E-Mail verifizieren ────────────────────────────────────────
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Ungültiger Verifizierungstoken."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const hashedToken = hashOpaqueToken(input.token);
      let user = await ctx.prisma.user.findUnique({
        where: { emailVerificationToken: hashedToken },
      });
      // Legacy compatibility for already issued plaintext links.
      if (!user) {
        user = await ctx.prisma.user.findUnique({
          where: { emailVerificationToken: input.token },
        });
      }

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Ungültiger oder bereits verwendeter Verifizierungslink.",
        });
      }

      if (user.emailVerified) {
        return { success: true, alreadyVerified: true };
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });

      return { success: true, alreadyVerified: false };
    }),

  // ── Verifizierungs-E-Mail erneut senden ────────────────────────
  resendVerificationEmail: publicProcedure
    .input(
      z.object({
        email: z
          .string()
          .email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      });

      // Immer Erfolg zurückgeben (Anti-Enumeration)
      if (user && !user.emailVerified) {
        const {
          plainToken: emailVerificationToken,
          storedTokenHash: emailVerificationTokenHash,
        } = createOpaqueTokenPair();

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { emailVerificationToken: emailVerificationTokenHash },
        });

        try {
          await sendVerificationEmail(
            user.email,
            user.name,
            emailVerificationToken
          );
        } catch (error) {
          console.error(
            "[Email] Erneute Verifizierungs-E-Mail fehlgeschlagen:",
            error
          );
        }
      }

      return {
        success: true,
        message:
          "Falls ein unbestätigtes Konto mit dieser E-Mail existiert, wurde eine neue Bestätigungs-E-Mail gesendet.",
      };
    }),

  // ── Passwort-Reset anfordern ───────────────────────────────────
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z
          .string()
          .email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      });

      // Immer Erfolg zurückgeben (Anti-Enumeration)
      if (user) {
        const {
          plainToken: resetToken,
          storedTokenHash: resetTokenHash,
        } = createOpaqueTokenPair();
        const resetTokenExpiresAt = new Date(
          Date.now() + 60 * 60 * 1000
        ); // 1 Stunde

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { resetToken: resetTokenHash, resetTokenExpiresAt },
        });

        try {
          await sendPasswordResetEmail(user.email, user.name, resetToken);
        } catch (error) {
          console.error(
            "[Email] Passwort-Reset-E-Mail fehlgeschlagen:",
            error
          );
        }
      }

      return {
        success: true,
        message:
          "Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit weiteren Anweisungen gesendet.",
      };
    }),

  // ── Passwort zurücksetzen ──────────────────────────────────────
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Ungültiger Token."),
        password: z
          .string()
          .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const hashedToken = hashOpaqueToken(input.token);
      let user = await ctx.prisma.user.findUnique({
        where: { resetToken: hashedToken },
      });
      // Legacy compatibility for already issued plaintext links.
      if (!user) {
        user = await ctx.prisma.user.findUnique({
          where: { resetToken: input.token },
        });
      }

      if (!user || !user.resetTokenExpiresAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Ungültiger oder abgelaufener Link zum Zurücksetzen des Passworts.",
        });
      }

      if (user.resetTokenExpiresAt < new Date()) {
        // Abgelaufenen Token aufräumen
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { resetToken: null, resetTokenExpiresAt: null },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.",
        });
      }

      const passwordHash = await hash(input.password, 12);

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      });

      return { success: true };
    }),

  // ── Verifizierungsstatus prüfen (für Login-Seite) ──────────────
  checkVerificationStatus: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        select: { emailVerified: true },
      });
      // Nur true zurückgeben wenn User existiert UND nicht verifiziert ist
      return { needsVerification: user ? !user.emailVerified : false };
    }),

  // ── Profildaten abrufen ──────────────────────────────────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        createdAt: true,
        emailVerified: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    return user;
  }),
});
