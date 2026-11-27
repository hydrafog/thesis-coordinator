"use server";

import { revalidatePath } from "next/cache";
import { gradingRepository } from "./data/grading-repository";
import { minutesRepository } from "./data/minutes-repository";
import { validateGradeValue } from "./domain/grade";
import {
  computeLiveMean,
  canCloseGradingSession,
  GradingState,
} from "./domain/grading-session";
import { generateDefenseMinutesDocument } from "@/core/pdf/minutes";

export async function submitGradeAction(params: {
  gradingSessionId: string;
  memberId: string;
  value: number;
  criterion?: string;
  weight?: number;
  comments?: string;
}) {
  const validation = validateGradeValue(params.value);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const session = await gradingRepository.findSessionById(
    params.gradingSessionId,
  );
  if (!session) {
    return { success: false, error: "Grading session not found." };
  }

  if (session.state === GradingState.CLOSED) {
    return {
      success: false,
      error: "Grading session is closed. Grades are locked.",
    };
  }

  try {
    const grade = await gradingRepository.upsertGrade(params);
    const updatedSession = await gradingRepository.findSessionById(
      params.gradingSessionId,
    );
    const liveMean = computeLiveMean(
      (updatedSession?.grades ?? []).map((g) => ({
        value: g.value,
        weight: g.weight,
      })),
    );

    revalidatePath("/(coordinator)/gradebook");
    revalidatePath("/(student)/results");
    return { success: true, grade, liveMean };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save grade.",
    };
  }
}

export async function closeGradingSessionAction(gradingSessionId: string) {
  try {
    const session = await gradingRepository.findSessionById(gradingSessionId);
    if (!session) {
      return { success: false, error: "Grading session not found." };
    }

    if (session.state === GradingState.CLOSED) {
      return { success: false, error: "Grading session is already closed." };
    }

    const committeeMembers = session.defenseSlot?.committee?.members ?? [];
    const expectedMemberIds = committeeMembers.map((m) => m.userId);

    const closeCheck = canCloseGradingSession(
      {
        id: session.id,
        defenseSlotId: session.defenseSlotId,
        state: session.state,
        finalAverage: session.finalAverage,
        closedAt: session.closedAt,
        grades: session.grades.map((g) => ({
          id: g.id,
          gradingSessionId: g.gradingSessionId,
          memberId: g.memberId,
          criterion: g.criterion,
          value: g.value,
          weight: g.weight,
          comments: g.comments,
        })),
      },
      expectedMemberIds,
    );

    if (!closeCheck.canClose) {
      return { success: false, error: closeCheck.reason };
    }

    const { average } = computeLiveMean(
      session.grades.map((g) => ({ value: g.value, weight: g.weight })),
    );

    const closed = await gradingRepository.closeSession(session.id, average);

    const scores = session.grades.map((g) => {
      const member = committeeMembers.find((m) => m.userId === g.memberId);
      return {
        memberName:
          member?.user?.name ?? member?.user?.email ?? "Committee Member",
        role: member?.role ?? "MEMBER",
        criterion: g.criterion,
        score: g.value,
        weight: g.weight,
      };
    });

    const studentUser = session.defenseSlot?.thesis?.student?.user;
    const coordinatorUser = session.defenseSlot?.thesis?.coordinator?.user;

    const doc = await generateDefenseMinutesDocument({
      gradingSessionId: session.id,
      studentName: studentUser?.name ?? studentUser?.email ?? "Candidate",
      studyGroup: "Faculty of Computer Science",
      thesisTitle: session.defenseSlot?.thesis?.title ?? "Bachelor Thesis",
      coordinatorName: coordinatorUser?.name ?? "Supervisor",
      committeeName:
        session.defenseSlot?.committee?.name ?? "Examination Committee",
      defenseDate: session.defenseSlot?.date ?? new Date(),
      room: session.defenseSlot?.room ?? "B204",
      scores,
      finalAverage: average,
    });

    const minutes = await minutesRepository.saveMinutes({
      gradingSessionId: session.id,
      pdfKey: doc.pdfKey,
      checksum: doc.checksum,
    });

    revalidatePath("/(coordinator)/gradebook");
    revalidatePath("/(student)/results");
    return {
      success: true,
      session: closed,
      minutes,
      average,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to close session.",
    };
  }
}
