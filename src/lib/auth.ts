import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Design decisions:
 * - JWT session strategy: Auth.js v5 requires it for the Credentials provider.
 * - Credentials provider for the MVP; OAuth providers slot in later without schema changes.
 * - Server Components call `auth()` directly; mutations must check `requireUser()`.
 * - PrismaAdapter intentionally omitted: it is incompatible with the Credentials
 *   provider (tries to create an Account record, causing silent sign-in failure).
 *   Re-enable when adding OAuth providers.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      const tokenId = token.id;
      if (session.user && tokenId) {
        session.user.id = tokenId;
      }
      return session;
    },
  },
});
