import type { UserRole } from "@prisma/client";
import { auth } from "./config";

export interface SessionUser {
  id: string;
  roles: UserRole[];
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) {
    return null;
  }
  return { id: user.id, roles: user.roles };
}
