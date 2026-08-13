import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

function isProActive(isPro: boolean, proExpiresAt: Date | null | undefined): boolean {
  if (!isPro) return false;
  if (!proExpiresAt) return true;
  return proExpiresAt > new Date();
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("Email ou senha incorretos");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Email ou senha incorretos");
        }

        const active = isProActive(user.isPro, user.proExpiresAt);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isPro: active,
          proExpiresAt: user.proExpiresAt?.toISOString() ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.isPro = (user as any).isPro ?? false;
        token.proExpiresAt = (user as any).proExpiresAt ?? null;
      }

      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isPro: true, proExpiresAt: true },
          });
          if (dbUser) {
            token.isPro = isProActive(dbUser.isPro, dbUser.proExpiresAt);
            token.proExpiresAt = dbUser.proExpiresAt?.toISOString() ?? null;
          }
        } catch {
          // ignore
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isPro = token.isPro;
        (session.user as any).proExpiresAt = token.proExpiresAt;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function generateSessionCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
