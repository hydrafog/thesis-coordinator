import { UserRole } from "@prisma/client";

export { UserRole };

export const ROLES = {
  student: UserRole.STUDENT,
  coordinator: UserRole.COORDINATOR,
  committeeMember: UserRole.COMMITTEE_MEMBER,
  committeePresident: UserRole.COMMITTEE_PRESIDENT,
  administrator: UserRole.ADMINISTRATOR,
  secretary: UserRole.SECRETARY,
} as const;

export type RoleName = UserRole;

export function hasRole(roles: UserRole[], requiredRole: UserRole): boolean {
  return roles.includes(requiredRole);
}

export function isAdminOrSecretary(roles: UserRole[]): boolean {
  return (
    roles.includes(UserRole.ADMINISTRATOR) || roles.includes(UserRole.SECRETARY)
  );
}

export function isCommittee(roles: UserRole[]): boolean {
  return (
    roles.includes(UserRole.COMMITTEE_MEMBER) ||
    roles.includes(UserRole.COMMITTEE_PRESIDENT)
  );
}

export function isCommitteePresident(roles: UserRole[]): boolean {
  return roles.includes(UserRole.COMMITTEE_PRESIDENT);
}
