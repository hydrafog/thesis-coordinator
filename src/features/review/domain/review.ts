import { z } from "zod";
import { DomainError } from "@/core/errors/domain-error";

export const REVIEW_DECISIONS = [
  "APPROVED",
  "CHANGES_REQUESTED",
  "REJECTED",
] as const;

export const MAX_ANNOTATIONS = 30;

const annotationSchema = z.object({
  chapter: z.string().trim().min(1, "Name the chapter.").max(80),
  page: z.number().int().min(1).max(10_000).nullable(),
  quote: z.string().trim().max(300).nullable(),
  comment: z.string().trim().min(1, "Write the annotation.").max(800),
});

export const reviewInputSchema = z
  .object({
    version: z.number().int().min(1),
    decision: z.enum(REVIEW_DECISIONS),
    comments: z
      .string()
      .trim()
      .max(800, "The feedback is too long.")
      .nullable(),
    annotations: z.array(annotationSchema).max(MAX_ANNOTATIONS),
  })
  .refine(
    (review) =>
      review.decision === "APPROVED" ||
      Boolean(review.comments) ||
      review.annotations.length > 0,
    { message: "Explain what the student should revise." },
  );

export type ReviewInput = z.output<typeof reviewInputSchema>;
export type AnnotationInput = ReviewInput["annotations"][number];

export interface ReadinessInput {
  finalSubmission: {
    latestVersion: number | null;
    reviewState: string;
    similarity: {
      state: string;
      inputVersion: number;
      resolution: string | null;
    } | null;
  } | null;
}

export function supervisorReportBlockers(input: ReadinessInput): string[] {
  const submission = input.finalSubmission;
  if (!submission || submission.latestVersion === null) {
    return ["Lock the final submission first."];
  }
  const blockers: string[] = [];
  if (submission.reviewState !== "approved") {
    blockers.push("The final version needs an approving review.");
  }
  const similarity = submission.similarity;
  if (
    !similarity ||
    similarity.state !== "COMPLETED" ||
    similarity.inputVersion !== submission.latestVersion
  ) {
    blockers.push("Run the similarity check on the final version.");
  } else if (similarity.resolution !== "ACCEPTED") {
    blockers.push("Accept the similarity result before submitting the report.");
  }
  return blockers;
}

export function assertReportReady(input: ReadinessInput): void {
  const blockers = supervisorReportBlockers(input);
  if (blockers.length > 0) {
    throw new DomainError("invalid_transition", blockers.join(" "));
  }
}

export const resolutionSchema = z.object({
  resolution: z.enum(["ACCEPTED", "REJECTED"]),
  notes: z.string().trim().max(800, "The notes are too long.").nullable(),
});

export const reportSummarySchema = z
  .string()
  .trim()
  .max(1000, "The summary is too long.");
