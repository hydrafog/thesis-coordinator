import { describe, it, expect } from "vitest";
import {
  assertReportReady,
  reviewInputSchema,
  supervisorReportBlockers,
} from "../../../src/features/review/domain/review";

const annotation = {
  chapter: "Introduction",
  page: 3,
  quote: null,
  comment: "Define the scope.",
};

describe("review input", () => {
  it("allows approval without comments", () => {
    const result = reviewInputSchema.safeParse({
      version: 1,
      decision: "APPROVED",
      comments: null,
      annotations: [],
    });
    expect(result.success).toBe(true);
  });

  it("requires an explanation when changes are requested", () => {
    const empty = reviewInputSchema.safeParse({
      version: 1,
      decision: "CHANGES_REQUESTED",
      comments: null,
      annotations: [],
    });
    expect(empty.success).toBe(false);

    const withAnnotation = reviewInputSchema.safeParse({
      version: 1,
      decision: "CHANGES_REQUESTED",
      comments: null,
      annotations: [annotation],
    });
    expect(withAnnotation.success).toBe(true);
  });

  it("rejects unknown decisions and oversized annotation lists", () => {
    expect(
      reviewInputSchema.safeParse({
        version: 1,
        decision: "MAYBE",
        comments: "x",
        annotations: [],
      }).success,
    ).toBe(false);
    expect(
      reviewInputSchema.safeParse({
        version: 1,
        decision: "REJECTED",
        comments: "x",
        annotations: Array.from({ length: 31 }, () => annotation),
      }).success,
    ).toBe(false);
  });
});

describe("supervisor report readiness", () => {
  const accepted = {
    state: "COMPLETED",
    inputVersion: 2,
    resolution: "ACCEPTED",
  };
  const ready = {
    finalSubmission: {
      latestVersion: 2,
      reviewState: "approved",
      similarity: accepted,
    },
  };

  it("passes when review and similarity work is complete", () => {
    expect(supervisorReportBlockers(ready)).toEqual([]);
    expect(() => assertReportReady(ready)).not.toThrow();
  });

  it("requires a locked final submission", () => {
    expect(supervisorReportBlockers({ finalSubmission: null })).toHaveLength(1);
  });

  it("blocks on a stale or unresolved similarity check", () => {
    const stale = {
      finalSubmission: {
        ...ready.finalSubmission,
        similarity: { ...accepted, inputVersion: 1 },
      },
    };
    expect(supervisorReportBlockers(stale)).toHaveLength(1);

    const unresolved = {
      finalSubmission: {
        ...ready.finalSubmission,
        similarity: { ...accepted, resolution: null },
      },
    };
    expect(() => assertReportReady(unresolved)).toThrowError("Accept");
  });

  it("blocks when the latest version is not approved", () => {
    const pending = {
      finalSubmission: { ...ready.finalSubmission, reviewState: "pending" },
    };
    expect(supervisorReportBlockers(pending)).toHaveLength(1);
  });
});
