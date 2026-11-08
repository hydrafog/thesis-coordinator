import { SlotStatus } from "@prisma/client";

export { SlotStatus };

export const DEFENSE_SLOT_DURATION_MINUTES = 20;

export interface DefenseSlotDomain {
  id: string;
  thesisId: string | null;
  committeeId: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  room: string;
  status: SlotStatus;
  order: number;
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((v) => parseInt(v, 10));
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM.`);
  }
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = totalMinutes % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function calculateSlotEndTime(
  startTime: string,
  durationMinutes: number = DEFENSE_SLOT_DURATION_MINUTES,
): string {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return formatMinutesToTime(endMinutes);
}

export function doTimeIntervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const sA = parseTimeToMinutes(startA);
  const eA = parseTimeToMinutes(endA);
  const sB = parseTimeToMinutes(startB);
  const eB = parseTimeToMinutes(endB);
  return sA < eB && sB < eA;
}

export interface ConflictCheckParams {
  date: Date;
  startTime: string;
  endTime: string;
  room: string;
  committeeId: string | null;
  committeeMemberUserIds: string[];
  thesisSupervisorUserId?: string | null;
  existingSlots: Array<{
    id: string;
    room: string;
    date: Date;
    startTime: string;
    endTime: string;
    committeeId: string | null;
    committeeMemberUserIds: string[];
  }>;
  currentSlotId?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  reasons: string[];
}

export function checkDefenseSlotConflicts(
  params: ConflictCheckParams,
): ConflictCheckResult {
  const reasons: string[] = [];
  const targetDateStr = params.date.toISOString().slice(0, 10);

  if (
    params.thesisSupervisorUserId &&
    params.committeeMemberUserIds.includes(params.thesisSupervisorUserId)
  ) {
    reasons.push(
      "Supervisor conflict: A supervisor cannot serve on their own student's defense committee.",
    );
  }

  for (const slot of params.existingSlots) {
    if (params.currentSlotId && slot.id === params.currentSlotId) {
      continue;
    }
    const slotDateStr = slot.date.toISOString().slice(0, 10);
    if (slotDateStr !== targetDateStr) {
      continue;
    }

    const overlaps = doTimeIntervalsOverlap(
      params.startTime,
      params.endTime,
      slot.startTime,
      slot.endTime,
    );

    if (!overlaps) {
      continue;
    }

    if (slot.room.toLowerCase().trim() === params.room.toLowerCase().trim()) {
      reasons.push(
        `Room conflict: Room ${params.room} is already booked from ${slot.startTime} to ${slot.endTime}.`,
      );
    }

    const memberOverlap = params.committeeMemberUserIds.filter((mId) =>
      slot.committeeMemberUserIds.includes(mId),
    );
    if (memberOverlap.length > 0) {
      reasons.push(
        `Committee overlap: One or more committee members are already assigned to another slot from ${slot.startTime} to ${slot.endTime}.`,
      );
    }
  }

  return {
    hasConflict: reasons.length > 0,
    reasons,
  };
}
