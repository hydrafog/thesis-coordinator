import { describe, it, expect } from "vitest";
import {
  validateGradeValue,
  GRADE_MIN,
  GRADE_MAX,
} from "../../../src/features/grading/domain/grade";
import {
  computeLiveMean,
  canCloseGradingSession,
  GradingState,
} from "../../../src/features/grading/domain/grading-session";
import { generateDefenseMinutesDocument } from "../../../src/core/pdf/minutes";

describe("Live Grading & Defense Minutes Domain", () => {
  it("enforces grade validation within the 1.00 to 10.00 scale", () => {
    expect(validateGradeValue(0.5).valid).toBe(false);
    expect(validateGradeValue(10.5).valid).toBe(false);
    expect(validateGradeValue(NaN).valid).toBe(false);

    expect(validateGradeValue(GRADE_MIN).valid).toBe(true);
    expect(validateGradeValue(GRADE_MAX).valid).toBe(true);
    expect(validateGradeValue(8.75).valid).toBe(true);
  });

  it("calculates live arithmetic mean accurately", () => {
    const grades = [
      { value: 8.0, weight: 1.0 },
      { value: 9.0, weight: 1.0 },
      { value: 10.0, weight: 1.0 },
    ];

    const result = computeLiveMean(grades);
    expect(result.average).toBe(9.0);
    expect(result.formatted).toBe("9.00");
  });

  it("calculates live weighted mean when weights differ", () => {
    const grades = [
      { value: 8.0, weight: 2.0 }, // 16
      { value: 10.0, weight: 1.0 }, // 10 => 26 / 3 = 8.666...
    ];

    const result = computeLiveMean(grades);
    expect(result.average).toBe(8.67);
    expect(result.formatted).toBe("8.67");
  });

  it("prevents session closure when committee members have not all entered scores", () => {
    const session = {
      id: "sess-1",
      defenseSlotId: "slot-1",
      state: GradingState.OPEN,
      finalAverage: null,
      closedAt: null,
      grades: [
        {
          id: "g1",
          gradingSessionId: "sess-1",
          memberId: "prof-1",
          criterion: "general",
          value: 9.0,
          weight: 1.0,
        },
      ],
    };

    const check = canCloseGradingSession(session, [
      "prof-1",
      "prof-2",
      "prof-3",
    ]);
    expect(check.canClose).toBe(false);
    expect(check.reason).toContain("2 missing");
  });

  it("permits session closure when all expected members have submitted grades", () => {
    const session = {
      id: "sess-1",
      defenseSlotId: "slot-1",
      state: GradingState.OPEN,
      finalAverage: null,
      closedAt: null,
      grades: [
        {
          id: "g1",
          gradingSessionId: "sess-1",
          memberId: "prof-1",
          criterion: "general",
          value: 9.0,
          weight: 1.0,
        },
        {
          id: "g2",
          gradingSessionId: "sess-1",
          memberId: "prof-2",
          criterion: "general",
          value: 8.5,
          weight: 1.0,
        },
        {
          id: "g3",
          gradingSessionId: "sess-1",
          memberId: "prof-3",
          criterion: "general",
          value: 9.5,
          weight: 1.0,
        },
      ],
    };

    const check = canCloseGradingSession(session, [
      "prof-1",
      "prof-2",
      "prof-3",
    ]);
    expect(check.canClose).toBe(true);
  });

  it("generates defense minutes buffer with valid SHA-256 checksum and pdfKey", async () => {
    const doc = await generateDefenseMinutesDocument({
      gradingSessionId: "sess-1",
      studentName: "Clara Oswald",
      studyGroup: "CS-401",
      thesisTitle: "Explainable AI for Education",
      coordinatorName: "Dr. Martha Jones",
      committeeName: "Committee A",
      defenseDate: new Date("2026-11-20T10:00:00Z"),
      room: "B204",
      scores: [
        {
          memberName: "Dr. Martha Jones",
          role: "PRESIDENT",
          criterion: "general",
          score: 9.5,
          weight: 1.0,
        },
        {
          memberName: "Prof. Alan Turing",
          role: "MEMBER",
          criterion: "general",
          score: 9.0,
          weight: 1.0,
        },
        {
          memberName: "Dr. Sarah Jane",
          role: "MEMBER",
          criterion: "general",
          score: 8.5,
          weight: 1.0,
        },
      ],
      finalAverage: 9.0,
    });

    expect(doc.buffer).toBeInstanceOf(Buffer);
    expect(doc.checksum).toHaveLength(64);
    expect(doc.pdfKey).toContain("clara-oswald");
  });
});
