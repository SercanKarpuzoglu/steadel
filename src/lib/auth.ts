import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "./password";
import { consumeAuthToken } from "./tokens";

export class UnverifiedEmailError extends CredentialsSignin {
  code = "unverified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      id: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await db.query.users.findFirst({
          where: and(eq(users.email, email), isNull(users.deletedAt)),
        });
        if (!user?.passwordHash) return null;
        if (!(await verifyPassword(user.passwordHash, password))) return null;
        if (!user.emailVerifiedAt) throw new UnverifiedEmailError();
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    Credentials({
      id: "token",
      credentials: { token: {} },
      async authorize(credentials) {
        const raw = String(credentials?.token ?? "");
        if (!raw) return null;
        const userId = await consumeAuthToken(raw, "magic_link");
        if (!userId) return null;
        const user = await db.query.users.findFirst({
          where: and(eq(users.id, userId), isNull(users.deletedAt)),
        });
        if (!user) return null;
        // A magic link proves inbox ownership; treat as verified.
        if (!user.emailVerifiedAt) {
          await db
            .update(users)
            .set({ emailVerifiedAt: new Date() })
            .where(eq(users.id, user.id));
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
});
