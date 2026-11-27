import { UserRole } from "@prisma/client";
import { DomainError } from "@/core/errors/domain-error";

export interface FileAccessContext {
  fileName: string;
  mimeType: string;
  memberUserIds: string[];
  staffAllowed: boolean;
}

export interface FileRequester {
  id: string;
  roles: UserRole[];
}

export function authorizeFileAccess(
  context: FileAccessContext,
  requester: FileRequester,
): void {
  if (context.memberUserIds.includes(requester.id)) {
    return;
  }
  const isStaff =
    requester.roles.includes(UserRole.ADMINISTRATOR) ||
    requester.roles.includes(UserRole.SECRETARY);
  if (context.staffAllowed && isStaff) {
    return;
  }
  throw new DomainError("forbidden", "You do not have access to this file.");
}

export function contentDispositionFor(fileName: string): string {
  const fallback = fileName.replace(/[^A-Za-z0-9._-]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
