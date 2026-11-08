export const GRADE_MIN = 1.0;
export const GRADE_MAX = 10.0;

export interface GradeDomain {
  id: string;
  gradingSessionId: string;
  memberId: string;
  criterion: string;
  value: number;
  weight: number;
  comments?: string | null;
}

export function validateGradeValue(value: number): {
  valid: boolean;
  error?: string;
} {
  if (typeof value !== "number" || isNaN(value)) {
    return { valid: false, error: "Grade must be a valid number." };
  }
  if (value < GRADE_MIN || value > GRADE_MAX) {
    return {
      valid: false,
      error: `Grade must be between ${GRADE_MIN.toFixed(2)} and ${GRADE_MAX.toFixed(2)}.`,
    };
  }
  return { valid: true };
}
