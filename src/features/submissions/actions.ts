"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/core/auth/guards";
import { runAction } from "@/core/errors/mapper";
import { idSchema, parseInput } from "@/lib/validation/schemas";
import {
  lockSubmission,
  supersedeSubmission,
} from "./service/submission-service";

export async function lockSubmissionAction(submissionId: string) {
  return runAction(async () => {
    const actor = await requireUser();
    await lockSubmission(actor, parseInput(idSchema, submissionId));
    revalidatePath("/supervision");
    revalidatePath("/review");
    return {};
  });
}

export async function supersedeSubmissionAction(
  submissionId: string,
  reason: string,
) {
  return runAction(async () => {
    const actor = await requireUser();
    await supersedeSubmission(
      actor,
      parseInput(idSchema, submissionId),
      reason,
    );
    revalidatePath("/supervision");
    revalidatePath("/review");
    return {};
  });
}
