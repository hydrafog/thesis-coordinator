"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/core/auth/guards";
import { runAction } from "@/core/errors/mapper";
import { idSchema, parseInput } from "@/lib/validation/schemas";
import {
  createReview,
  resolveSimilarity,
  runSimilarityCheck,
} from "./service/review-service";

export async function createReviewAction(submissionId: string, input: unknown) {
  return runAction(async () => {
    const actor = await requireUser();
    await createReview(actor, parseInput(idSchema, submissionId), input);
    revalidatePath("/review");
    revalidatePath("/supervision");
    return {};
  });
}

export async function runSimilarityAction(submissionId: string) {
  return runAction(async () => {
    const actor = await requireUser();
    await runSimilarityCheck(actor, parseInput(idSchema, submissionId));
    revalidatePath("/review");
    return {};
  });
}

export async function resolveSimilarityAction(
  submissionId: string,
  input: unknown,
) {
  return runAction(async () => {
    const actor = await requireUser();
    await resolveSimilarity(actor, parseInput(idSchema, submissionId), input);
    revalidatePath("/review");
    return {};
  });
}
