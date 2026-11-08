import { GradingState } from "@prisma/client";
import { GradeDomain, validateGradeValue } from "./grade";

export { GradingState };

export interface GradingSessionDomain {
  id: string;
  defenseSlotId: string;
  state: GradingState;
  finalAverage: number | null;
  closedAt: Date | null;
  grades: GradeDomain[];
}

export function computeLiveMean(
  grades: Array<{ value: number; weight?: number }>,
): {
  average: number;
  formatted: string;
} {
  const validGrades = grades.filter((g) => validateGradeValue(g.value).valid);
  if (validGrades.length === 0) {
    return { average: 0, formatted: "—" };
  }

  let totalWeight = 0;
  let weightedSum = 0;

  for (const g of validGrades) {
    const weight =
      typeof g.weight === "number" && g.weight > 0 ? g.weight : 1.0;
    weightedSum += g.value * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return { average: 0, formatted: "—" };
  }

  const average = weightedSum / totalWeight;
  return {
    average: Math.round(average * 100) / 100,
    formatted: average.toFixed(2),
  };
}

export function canCloseGradingSession(
  session: GradingSessionDomain,
  expectedCommitteeMemberIds: string[],
): { canClose: boolean; reason?: string } {
  if (session.state === GradingState.CLOSED) {
    return { canClose: false, reason: "Grading session is already closed." };
  }

  const recordedMemberIds = new Set(
    session.grades
      .filter((g) => validateGradeValue(g.value).valid)
      .map((g) => g.memberId),
  );

  const missingMembers = expectedCommitteeMemberIds.filter(
    (id) => !recordedMemberIds.has(id),
  );

  if (missingMembers.length > 0) {
    return {
      canClose: false,
      reason: `All committee members must enter grades before closing (${missingMembers.length} missing).`,
    };
  }

  return { canClose: true };
}
