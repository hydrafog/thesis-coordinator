import { describe, it, expect } from "vitest";
import {
  calculateSlotEndTime,
  doTimeIntervalsOverlap,
  checkDefenseSlotConflicts,
  DEFENSE_SLOT_DURATION_MINUTES,
} from "../../../src/features/defense/domain/defense-slot";

describe("Defense Slot Domain & Conflict Checks", () => {
  it("enforces a fixed 20-minute slot duration", () => {
    expect(DEFENSE_SLOT_DURATION_MINUTES).toBe(20);
    expect(calculateSlotEndTime("09:00", 20)).toBe("09:20");
    expect(calculateSlotEndTime("09:40", 20)).toBe("10:00");
    expect(calculateSlotEndTime("11:50", 20)).toBe("12:10");
  });

  it("accurately detects time interval overlaps", () => {
    expect(doTimeIntervalsOverlap("09:00", "09:20", "09:10", "09:30")).toBe(
      true,
    );
    expect(doTimeIntervalsOverlap("09:00", "09:20", "09:20", "09:40")).toBe(
      false,
    );
    expect(doTimeIntervalsOverlap("09:30", "09:50", "09:00", "09:20")).toBe(
      false,
    );
  });

  it("rejects a supervisor serving on their own student's defense committee", () => {
    const result = checkDefenseSlotConflicts({
      date: new Date("2026-11-20T09:00:00Z"),
      startTime: "09:00",
      endTime: "09:20",
      room: "B204",
      committeeId: "comm-1",
      committeeMemberUserIds: ["prof-martha", "prof-alan", "prof-sarah"],
      thesisSupervisorUserId: "prof-martha",
      existingSlots: [],
    });

    expect(result.hasConflict).toBe(true);
    expect(result.reasons[0]).toContain("Supervisor conflict");
  });

  it("detects when a committee member has an overlapping slot", () => {
    const existingDate = new Date("2026-11-20T09:00:00Z");
    const result = checkDefenseSlotConflicts({
      date: existingDate,
      startTime: "09:10",
      endTime: "09:30",
      room: "Room-A",
      committeeId: "comm-2",
      committeeMemberUserIds: ["member-overlap-1", "member-2"],
      existingSlots: [
        {
          id: "slot-prev",
          room: "Room-B",
          date: existingDate,
          startTime: "09:00",
          endTime: "09:20",
          committeeId: "comm-1",
          committeeMemberUserIds: ["member-overlap-1", "member-3"],
        },
      ],
    });

    expect(result.hasConflict).toBe(true);
    expect(result.reasons[0]).toContain("Committee overlap");
  });

  it("detects room double-booking on overlapping slots", () => {
    const targetDate = new Date("2026-11-20T09:00:00Z");
    const result = checkDefenseSlotConflicts({
      date: targetDate,
      startTime: "09:00",
      endTime: "09:20",
      room: "Room-B204",
      committeeId: "comm-1",
      committeeMemberUserIds: ["user-1", "user-2"],
      existingSlots: [
        {
          id: "slot-existing",
          room: "Room-B204",
          date: targetDate,
          startTime: "09:10",
          endTime: "09:30",
          committeeId: "comm-other",
          committeeMemberUserIds: ["user-3", "user-4"],
        },
      ],
    });

    expect(result.hasConflict).toBe(true);
    expect(result.reasons[0]).toContain("Room conflict");
  });

  it("passes conflict check when slots are non-overlapping or on different dates", () => {
    const targetDate = new Date("2026-11-20T09:00:00Z");
    const result = checkDefenseSlotConflicts({
      date: targetDate,
      startTime: "09:20",
      endTime: "09:40",
      room: "Room-B204",
      committeeId: "comm-1",
      committeeMemberUserIds: ["user-1", "user-2"],
      thesisSupervisorUserId: "supervisor-external",
      existingSlots: [
        {
          id: "slot-prev",
          room: "Room-B204",
          date: targetDate,
          startTime: "09:00",
          endTime: "09:20",
          committeeId: "comm-prev",
          committeeMemberUserIds: ["user-3", "user-4"],
        },
      ],
    });

    expect(result.hasConflict).toBe(false);
    expect(result.reasons.length).toBe(0);
  });
});
