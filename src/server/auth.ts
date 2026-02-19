import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Bitte E-Mail und Passwort eingeben.");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Sicherheitshinweis: User wird anhand der E-Mail gesucht, Passwort wird mit bcrypt verglichen
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("Ungültige Anmeldedaten.");
        }

        // Sicherheitshinweis: Deaktivierte Accounts können sich nicht einloggen
        if (!user.isActive) {
          throw new Error(
            "Ihr Account wurde deaktiviert. Bitte kontaktieren Sie die Administration."
          );
        }

        // Sicherheitshinweis: Passwort-Vergleich über bcrypt (timing-safe)
        const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error("Ungültige Anmeldedaten.");
        }

        // E-Mail-Verifizierung prüfen
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
});
