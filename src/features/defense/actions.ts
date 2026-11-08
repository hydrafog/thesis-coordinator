"use server";

import { revalidatePath } from "next/cache";
import { committeeRepository } from "./data/committee-repository";
import { slotRepository } from "./data/slot-repository";
import { dossierRepository } from "./data/dossier-repository";
import {
  calculateSlotEndTime,
  checkDefenseSlotConflicts,
} from "./domain/defense-slot";
import {
  transitionDossierState,
  DossierState,
  DossierItemType,
  ItemStatus,
} from "./domain/defense-file";
import { CommitteeMemberRole, SlotStatus } from "@prisma/client";

export async function createCommitteeAction(
  name: string,
  members: Array<{ userId: string; role: CommitteeMemberRole }>,
) {
  if (!name.trim()) {
    return { success: false, error: "Committee name is required." };
  }
  if (!members.length) {
    return { success: false, error: "At least one member is required." };
  }
  const presidents = members.filter(
    (m) => m.role === CommitteeMemberRole.PRESIDENT,
  );
  if (presidents.length !== 1) {
    return {
      success: false,
      error: "Committee must have exactly one president.",
    };
  }

  try {
    const committee = await committeeRepository.create(name, members);
    revalidatePath("/(admin)/committees");
    return { success: true, committee };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create committee.",
    };
  }
}

export async function deleteCommitteeAction(id: string) {
  try {
    await committeeRepository.delete(id);
    revalidatePath("/(admin)/committees");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete committee.",
    };
  }
}

export async function scheduleDefenseSlotAction(params: {
  thesisId?: string;
  committeeId?: string;
  date: string;
  startTime: string;
  room: string;
  status?: SlotStatus;
}) {
  try {
    const slotDate = new Date(params.date);
    const endTime = calculateSlotEndTime(params.startTime, 20);

    let thesisSupervisorUserId: string | null = null;
    if (params.thesisId) {
      const dossier = await dossierRepository.findByThesisId(params.thesisId);
      if (!dossier || dossier.state !== DossierState.VERIFIED) {
        return {
          success: false,
          error:
            "Cannot schedule defense slot: Student's defense dossier must be VERIFIED before scheduling.",
        };
      }
      thesisSupervisorUserId = dossier.thesis?.coordinator?.user?.id ?? null;
    }

    let committeeMemberUserIds: string[] = [];
    if (params.committeeId) {
      const committee = await committeeRepository.findById(params.committeeId);
      if (committee) {
        committeeMemberUserIds = committee.members.map((m) => m.userId);
      }
    }

    const existingSlots = await slotRepository.findByDate(slotDate);
    const existingSlotDtos = existingSlots.map((s) => ({
      id: s.id,
      room: s.room,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      committeeId: s.committeeId,
      committeeMemberUserIds: s.committee
        ? s.committee.members.map((m) => m.userId)
        : [],
    }));

    const conflictResult = checkDefenseSlotConflicts({
      date: slotDate,
      startTime: params.startTime,
      endTime,
      room: params.room,
      committeeId: params.committeeId ?? null,
      committeeMemberUserIds,
      thesisSupervisorUserId,
      existingSlots: existingSlotDtos,
    });

    if (conflictResult.hasConflict) {
      return {
        success: false,
        error: conflictResult.reasons.join(" "),
        conflicts: conflictResult.reasons,
      };
    }

    const slot = await slotRepository.create({
      thesisId: params.thesisId,
      committeeId: params.committeeId,
      date: slotDate,
      startTime: params.startTime,
      endTime,
      room: params.room,
      status: params.status ?? SlotStatus.SCHEDULED,
    });

    revalidatePath("/(admin)/admin/schedule");
    revalidatePath("/(student)/defense");
    return { success: true, slot };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to schedule slot.",
    };
  }
}

export async function reorderDefenseSlotsAction(orderedIds: string[]) {
  try {
    await slotRepository.reorder(orderedIds);
    revalidatePath("/(admin)/admin/schedule");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reorder slots.",
    };
  }
}

export async function deleteDefenseSlotAction(id: string) {
  try {
    await slotRepository.delete(id);
    revalidatePath("/(admin)/admin/schedule");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete slot.",
    };
  }
}

export async function submitDossierAction(thesisId: string) {
  try {
    const dossier = await dossierRepository.createOrGet(thesisId);
    const transition = transitionDossierState(dossier.state, "SUBMIT");
    if (transition.error) {
      return { success: false, error: transition.error };
    }

    const updated = await dossierRepository.updateState(
      dossier.id,
      transition.newState,
    );
    revalidatePath("/(admin)/dossiers");
    revalidatePath("/(student)/defense");
    return { success: true, dossier: updated };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit dossier.",
    };
  }
}

export async function verifyDossierAction(dossierId: string) {
  try {
    const dossier = await dossierRepository.findById(dossierId);
    if (!dossier) {
      return { success: false, error: "Dossier not found." };
    }

    const transition = transitionDossierState(dossier.state, "VERIFY", {
      items: dossier.items,
    });
    if (transition.error) {
      return { success: false, error: transition.error };
    }

    const updated = await dossierRepository.updateState(
      dossier.id,
      transition.newState,
      null,
      new Date(),
    );
    revalidatePath("/(admin)/dossiers");
    revalidatePath("/(student)/defense");
    return { success: true, dossier: updated };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to verify dossier.",
    };
  }
}

export async function returnDossierAction(dossierId: string, feedback: string) {
  try {
    const dossier = await dossierRepository.findById(dossierId);
    if (!dossier) {
      return { success: false, error: "Dossier not found." };
    }

    const transition = transitionDossierState(dossier.state, "RETURN", {
      feedback,
    });
    if (transition.error) {
      return { success: false, error: transition.error };
    }

    const updated = await dossierRepository.updateState(
      dossier.id,
      transition.newState,
      feedback,
      null,
    );
    revalidatePath("/(admin)/dossiers");
    revalidatePath("/(student)/defense");
    return { success: true, dossier: updated };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to return dossier.",
    };
  }
}

export async function updateDossierItemStatusAction(
  defenseFileId: string,
  type: DossierItemType,
  status: ItemStatus,
  fileKey?: string | null,
) {
  try {
    const item = await dossierRepository.updateItemStatus(
      defenseFileId,
      type,
      status,
      fileKey,
    );
    revalidatePath("/(admin)/dossiers");
    revalidatePath("/(student)/defense");
    return { success: true, item };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update item status.",
    };
  }
}
