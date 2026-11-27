import { SubmissionState } from "@prisma/client";
import { DomainError } from "@/core/errors/domain-error";

export { SubmissionState };

export type SubmissionAction = "LOCK" | "SUPERSEDE";

const TRANSITIONS: Record<
  SubmissionAction,
  { from: SubmissionState[]; to: SubmissionState }
> = {
  LOCK: {
    from: [SubmissionState.OPEN, SubmissionState.SUPERSEDED],
    to: SubmissionState.LOCKED,
  },
  SUPERSEDE: { from: [SubmissionState.LOCKED], to: SubmissionState.SUPERSEDED },
};

export function transitionSubmission(
  state: SubmissionState,
  action: SubmissionAction,
): SubmissionState {
  const rule = TRANSITIONS[action];
  if (!rule.from.includes(state)) {
    throw new DomainError(
      "invalid_transition",
      `A ${state.toLowerCase()} submission cannot be ${
        action === "LOCK" ? "locked" : "superseded"
      }.`,
    );
  }
  return rule.to;
}

export function assertAcceptsUploads(state: SubmissionState): void {
  if (state === SubmissionState.LOCKED) {
    throw new DomainError(
      "submission_locked",
      "The final submission is locked and cannot be replaced.",
    );
  }
}

export function nextVersionNumber(existing: number[]): number {
  return existing.length === 0 ? 1 : Math.max(...existing) + 1;
}

export type ReviewState =
  | "pending"
  | "approved"
  | "changes-requested"
  | "rejected";

export function deriveReviewState(
  latestVersion: number | null,
  reviews: Array<{ version: number; decision: string; createdAt: Date }>,
): ReviewState {
  if (latestVersion === null) {
    return "pending";
  }
  const current = reviews
    .filter((review) => review.version === latestVersion)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  switch (current?.decision) {
    case "APPROVED":
      return "approved";
    case "CHANGES_REQUESTED":
      return "changes-requested";
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
}
