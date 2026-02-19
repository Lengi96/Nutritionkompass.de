import type { NextAuthConfig } from "next-auth";

// Sicherheitshinweis: TypeScript-Augmentation für erweiterte Session-Daten
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "STAFF";
      organizationId: string;
    };
  }

  interface User {
    role: "ADMIN" | "STAFF";
    organizationId: string;
  }
}

// Edge-kompatible Auth-Konfiguration (ohne Prisma/bcrypt)
// Wird vom Middleware verwendet, das in der Edge-Runtime läuft
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 Stunden
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Provider werden in auth.ts hinzugefügt
  callbacks: {
    // Sicherheitshinweis: JWT enthält nur die nötigen Daten, keine sensiblen Infos
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = user.name as string;
        token.role = (user as { role: string }).role;
        token.organizationId = (user as { organizationId: string }).organizationId;
      }
      return token;
    },
    // Sicherheitshinweis: Session-Daten werden aus dem JWT abgeleitet
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).role = token.role as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).organizationId = token.organizationId as string;
      return session;
    },
    // Middleware-Autorisierung
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isDashboard && !isLoggedIn) {
        return false; // Redirect zu Login
      }
      return true;
    },
  },
};
