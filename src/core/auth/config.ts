import NextAuth, { type DefaultSession } from "next-auth";
import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/core/db/prisma";

declare module "next-auth" {
  interface Session {
    user: { id: string; roles: UserRole[] } & DefaultSession["user"];
  }
}

// TODO: member 1 registers the Google and demonstration credential providers.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [],
  trustHost: true,
  callbacks: {
    async session(params) {
      const userId = "token" in params ? params.token.sub : undefined;
      const account = userId
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { status: true, roles: { select: { role: true } } },
          })
        : null;
      const active =
        account !== null && account.status === AccountStatus.ACTIVE;
      return {
        expires: new Date(params.session.expires).toISOString(),
        user: {
          ...params.session.user,
          id: active && userId ? userId : "",
          roles: active ? account.roles.map((entry) => entry.role) : [],
        },
      };
    },
  },
});
