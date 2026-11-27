import { CommitteeMemberRole } from "@prisma/client";

export { CommitteeMemberRole };

export interface CommitteeMemberDomain {
  id: string;
  committeeId: string;
  userId: string;
  userName?: string;
  role: CommitteeMemberRole;
}

export interface CommitteeDomain {
  id: string;
  name: string;
  members: CommitteeMemberDomain[];
}

export function validateCommitteeComposition(
  members: Array<{ userId: string; role: CommitteeMemberRole }>,
): { valid: boolean; error?: string } {
  if (members.length === 0) {
    return {
      valid: false,
      error: "A committee must contain at least one member.",
    };
  }
  const presidents = members.filter(
    (m) => m.role === CommitteeMemberRole.PRESIDENT,
  );
  if (presidents.length !== 1) {
    return {
      valid: false,
      error: "A committee must have exactly one president.",
    };
  }
  const uniqueUsers = new Set(members.map((m) => m.userId));
  if (uniqueUsers.size !== members.length) {
    return {
      valid: false,
      error: "Duplicate members cannot exist in the same committee.",
    };
  }
  return { valid: true };
}
