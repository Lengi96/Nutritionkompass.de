import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { router, publicProcedure, protectedProcedure } from "../init";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email";
import { createOpaqueTokenPair, hashOpaqueToken } from "@/lib/security/tokens";

const PLAIN_TEXT_INPUT_REGEX = /^[^<>]*$/;
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        organizationName: z
          .string()
          .trim()
          .min(2, "Der Einrichtungsname muss mindestens 2 Zeichen lang sein.")
          .max(120)
          .regex(
            PLAIN_TEXT_INPUT_REGEX,
            "Bitte keine HTML-Tags oder Sondermarkierungen verwenden."
          ),
        name: z
          .string()
          .trim()
          .min(2, "Der Name muss mindestens 2 Zeichen lang sein.")
          .max(100)
          .regex(
            PLAIN_TEXT_INPUT_REGEX,
            "Bitte keine HTML-Tags oder Sondermarkierungen verwenden."
          ),
        email: z
          .string()
          .email("Bitte geben Sie eine gueltige E-Mail-Adresse ein.")
          .max(254, "E-Mail-Adresse darf maximal 254 Zeichen lang sein."),
        password: z
          .string()
          .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein.")
          .max(128, "Das Passwort darf maximal 128 Zeichen lang sein."),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
      const emailVerificationTokenExpiresAt = new Date(
        Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS
      );

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
            emailVerificationTokenExpiresAt,
          },
        });

        return { organization, user };
      });

      try {
        await sendVerificationEmail(
          result.user.email,
          result.user.name,
          emailVerificationToken
        );
      } catch (error) {
        console.error("[Email] Verifizierungs-E-Mail fehlgeschlagen:", error);
      }

      return { success: true, email: result.user.email };
    }),

  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Ungueltiger Verifizierungstoken."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const hashedToken = hashOpaqueToken(input.token);
      const user = await ctx.prisma.user.findUnique({
        where: { emailVerificationToken: hashedToken },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Ungueltiger oder bereits verwendeter Verifizierungslink.",
        });
      }

      if (user.emailVerified) {
        return { success: true, alreadyVerified: true };
      }

      if (
        !user.emailVerificationTokenExpiresAt ||
        user.emailVerificationTokenExpiresAt < new Date()
      ) {
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationToken: null,
            emailVerificationTokenExpiresAt: null,
          },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Dieser Verifizierungslink ist abgelaufen. Bitte fordern Sie eine neue E-Mail an.",
        });
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      });

      return { success: true, alreadyVerified: false };
    }),

  resendVerificationEmail: publicProcedure
    .input(
      z.object({
        email: z
          .string()
          .email("Bitte geben Sie eine gueltige E-Mail-Adresse ein."),
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

      if (user && !user.emailVerified) {
        const {
          plainToken: emailVerificationToken,
          storedTokenHash: emailVerificationTokenHash,
        } = createOpaqueTokenPair();
        const emailVerificationTokenExpiresAt = new Date(
          Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS
        );

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationToken: emailVerificationTokenHash,
            emailVerificationTokenExpiresAt,
          },
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
          "Falls ein unbestaetigtes Konto mit dieser E-Mail existiert, wurde eine neue Bestaetigungs-E-Mail gesendet.",
      };
    }),

  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z
          .string()
          .email("Bitte geben Sie eine gueltige E-Mail-Adresse ein.")
          .max(254, "E-Mail-Adresse darf maximal 254 Zeichen lang sein."),
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

      if (user) {
        const {
          plainToken: resetToken,
          storedTokenHash: resetTokenHash,
        } = createOpaqueTokenPair();
        const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

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

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Ungueltiger Token."),
        password: z
          .string()
          .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const hashedToken = hashOpaqueToken(input.token);
      const user = await ctx.prisma.user.findUnique({
        where: { resetToken: hashedToken },
      });

      if (!user || !user.resetTokenExpiresAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Ungueltiger oder abgelaufener Link zum Zuruecksetzen des Passworts.",
        });
      }

      if (user.resetTokenExpiresAt < new Date()) {
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

  checkVerificationStatus: publicProcedure
    .input(
      z.object({
        email: z.string().email().max(254),
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
      return { needsVerification: user ? !user.emailVerified : false };
    }),

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
