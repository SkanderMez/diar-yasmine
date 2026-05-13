import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/**
 * Auth.js v5 — STAFF authentication only.
 *
 * Customers (Guest table) use a separate, custom login endpoint with
 * a different cookie name. See CLAUDE.md → "Auth model" for the full
 * design.
 *
 * - Provider: Credentials (email + bcrypt password).
 * - Session strategy: JWT, 24h TTL (stateless, no DB session table).
 * - No self-signup. Staff users are created on invitation by an ADMIN.
 */

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  providers: [
    Credentials({
      name: "Staff credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.hashedPassword,
        );
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
