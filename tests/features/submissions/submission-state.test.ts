import { describe, it, expect } from "vitest";
import {
  SubmissionState,
  assertAcceptsUploads,
  deriveReviewState,
  nextVersionNumber,
  transitionSubmission,
} from "../../../src/features/submissions/domain/submission";

function codeOf(action: () => unknown): string | undefined {
  try {
    action();
  } catch (error) {
    return (error as { code?: string }).code;
  }
  return undefined;
}

describe("submission locking", () => {
  it("locks an open submission", () => {
    expect(transitionSubmission(SubmissionState.OPEN, "LOCK")).toBe(
      SubmissionState.LOCKED,
    );
  });

  it("does not lock twice or supersede an open submission", () => {
    const relock = codeOf(() =>
      transitionSubmission(SubmissionState.LOCKED, "LOCK"),
    );
    const supersedeOpen = codeOf(() =>
      transitionSubmission(SubmissionState.OPEN, "SUPERSEDE"),
    );
    expect(relock).toBe("invalid_transition");
    expect(supersedeOpen).toBe("invalid_transition");
  });

  it("follows the audited correction cycle", () => {
    const locked = SubmissionState.LOCKED;
    const superseded = transitionSubmission(locked, "SUPERSEDE");
    expect(superseded).toBe(SubmissionState.SUPERSEDED);
    expect(transitionSubmission(superseded, "LOCK")).toBe(locked);
  });

  it("blocks ordinary uploads once locked", () => {
    const check = (state: SubmissionState) =>
      codeOf(() => assertAcceptsUploads(state));
    expect(check(SubmissionState.LOCKED)).toBe("submission_locked");
    expect(check(SubmissionState.SUPERSEDED)).toBeUndefined();
    expect(check(SubmissionState.OPEN)).toBeUndefined();
  });
});

describe("versions and review state", () => {
  it("numbers versions after the highest existing one", () => {
    expect(nextVersionNumber([])).toBe(1);
    expect(nextVersionNumber([1, 3, 2])).toBe(4);
  });

  it("uses the newest review for the latest version only", () => {
    const early = new Date("2025-01-01T10:00:00Z");
    const late = new Date("2025-01-02T10:00:00Z");
    expect(deriveReviewState(null, [])).toBe("pending");
    expect(
      deriveReviewState(2, [
        { version: 1, decision: "APPROVED", createdAt: early },
      ]),
    ).toBe("pending");
    expect(
      deriveReviewState(2, [
        { version: 2, decision: "CHANGES_REQUESTED", createdAt: early },
        { version: 2, decision: "APPROVED", createdAt: late },
      ]),
    ).toBe("approved");
  });
});
