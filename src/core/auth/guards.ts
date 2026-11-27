import type { UserRole } from "@prisma/client";
import { DomainError } from "@/core/errors/domain-error";
import { getSessionUser, type SessionUser } from "./session";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new DomainError("unauthenticated", "Sign in to continue.");
  }
  return user;
}

export function requireRole(user: SessionUser, ...allowed: UserRole[]): void {
  if (!allowed.some((role) => user.roles.includes(role))) {
    throw new DomainError(
      "forbidden",
      "You do not have access to this action.",
    );
  }
}
