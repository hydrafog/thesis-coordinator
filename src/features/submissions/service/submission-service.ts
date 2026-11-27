import { UserRole } from "@prisma/client";
import { z } from "zod";
import type { SessionUser } from "@/core/auth/session";
import { getMaxUploadBytes } from "@/core/config/app-config";
import { extractPdfText } from "@/core/documents/pdf-text";
import { DomainError } from "@/core/errors/domain-error";
import { errorContext, logger } from "@/core/logging/logger";
import { idSchema, parseInput } from "@/lib/validation/schemas";
import { discardFile, storeFile } from "../data/storage-client";
import {
  submissionRepository,
  type ThesisAccess,
} from "../data/submission-repository";
import { validateUpload } from "../domain/attachment";
import { assertAcceptsUploads, deriveReviewState } from "../domain/submission";
import { toSubmissionView, type SubmissionView } from "./submission-view";

const uploadSchema = z.object({
  thesisId: idSchema,
  submissionId: idSchema.nullable(),
  title: z.string().trim().max(120, "The title is too long."),
  notes: z.string().trim().max(500, "The notes are too long.").nullable(),
  milestoneId: idSchema.nullable(),
});

export interface UploadSubmissionInput {
  actor: SessionUser;
  thesisId: string;
  submissionId: string | null;
  title: string;
  notes: string | null;
  milestoneId: string | null;
  file: File;
}

function isStaff(user: SessionUser): boolean {
  return (
    user.roles.includes(UserRole.ADMINISTRATOR) ||
    user.roles.includes(UserRole.SECRETARY)
  );
}

export function assertThesisMember(
  access: ThesisAccess,
  user: SessionUser,
): void {
  if (
    user.id !== access.studentUserId &&
    user.id !== access.coordinatorUserId &&
    !isStaff(user)
  ) {
    throw new DomainError(
      "forbidden",
      "You do not have access to this thesis.",
    );
  }
}

async function extractTextOrNull(bytes: Buffer): Promise<string | null> {
  try {
    return await extractPdfText(bytes);
  } catch (error) {
    logger.warn("pdf text extraction failed", errorContext(error));
    return null;
  }
}

export async function uploadSubmissionVersion(
  input: UploadSubmissionInput,
): Promise<{ submissionId: string; version: number }> {
  const fields = parseInput(uploadSchema, input);
  const access = await submissionRepository.findThesisAccess(fields.thesisId);
  if (!access) {
    throw new DomainError("not_found", "Thesis not found.");
  }
  if (access.studentUserId !== input.actor.id) {
    throw new DomainError(
      "forbidden",
      "Only the thesis owner can upload drafts.",
    );
  }

  if (fields.submissionId) {
    const state = await submissionRepository.findStateForThesis(
      fields.submissionId,
      access.id,
    );
    if (!state) {
      throw new DomainError("not_found", "Submission not found.");
    }
    assertAcceptsUploads(state);
  } else if (fields.title === "") {
    throw new DomainError("validation_failed", "A title is required.");
  }

  const format = validateUpload(
    {
      fileName: input.file.name,
      size: input.file.size,
      mimeType: input.file.type,
    },
    { maxBytes: getMaxUploadBytes() },
  );

  if (
    fields.milestoneId &&
    !(await submissionRepository.milestoneBelongsToThesis(
      fields.milestoneId,
      access.id,
    ))
  ) {
    throw new DomainError("not_found", "Milestone not found.");
  }

  const bytes = Buffer.from(await input.file.arrayBuffer());
  const stored = await storeFile({
    prefix: `submissions/${access.id}`,
    fileName: input.file.name,
    format,
    bytes,
  });
  const extractedText =
    format === "pdf" ? await extractTextOrNull(bytes) : null;

  try {
    const { submission, fileVersion } = await submissionRepository.addVersion({
      thesisId: access.id,
      submissionId: fields.submissionId,
      title: fields.title,
      notes: fields.notes,
      milestoneId: fields.milestoneId,
      uploadedById: input.actor.id,
      file: stored,
      extractedText,
    });
    return { submissionId: submission.id, version: fileVersion.version };
  } catch (error) {
    await discardFile(stored.fileKey);
    throw error;
  }
}

export async function listSubmissionViews(
  thesisId: string,
  viewer: SessionUser,
): Promise<SubmissionView[]> {
  const access = await submissionRepository.findThesisAccess(thesisId);
  if (!access) {
    throw new DomainError("not_found", "Thesis not found.");
  }
  assertThesisMember(access, viewer);
  const includeSimilarity = viewer.id !== access.studentUserId;
  const details = await submissionRepository.listForThesis(thesisId);
  return details.map((detail) =>
    toSubmissionView(detail, viewer.id, includeSimilarity),
  );
}

export async function lockSubmission(
  actor: SessionUser,
  submissionId: string,
): Promise<void> {
  const access =
    await submissionRepository.findThesisAccessBySubmission(submissionId);
  if (!access) {
    throw new DomainError("not_found", "Submission not found.");
  }
  if (access.coordinatorUserId !== actor.id) {
    throw new DomainError(
      "forbidden",
      "Only the supervisor can lock a submission.",
    );
  }
  const detail = await submissionRepository.findById(submissionId);
  const latest = detail?.fileVersions[0]?.version ?? null;
  if (!detail || latest === null) {
    throw new DomainError("validation_failed", "There is no version to lock.");
  }
  if (deriveReviewState(latest, detail.reviews) !== "approved") {
    throw new DomainError(
      "invalid_transition",
      "Approve the latest version before locking the submission.",
    );
  }
  await submissionRepository.transition(submissionId, "LOCK", actor.id, null);
}

const reasonSchema = z
  .string()
  .trim()
  .min(10, "Describe the correction in at least 10 characters.")
  .max(500, "The reason is too long.");

export async function supersedeSubmission(
  actor: SessionUser,
  submissionId: string,
  reason: string,
): Promise<void> {
  if (!isStaff(actor)) {
    throw new DomainError(
      "forbidden",
      "Only administrators can correct a locked submission.",
    );
  }
  await submissionRepository.transition(
    submissionId,
    "SUPERSEDE",
    actor.id,
    parseInput(reasonSchema, reason),
  );
}

export interface StudentWorkspace {
  thesisId: string;
  milestones: Array<{ id: string; title: string }>;
  submissions: SubmissionView[];
}

export async function loadStudentWorkspace(
  student: SessionUser,
): Promise<StudentWorkspace | null> {
  const thesisId = await submissionRepository.findThesisIdForStudent(
    student.id,
  );
  if (!thesisId) {
    return null;
  }
  const [milestones, submissions] = await Promise.all([
    submissionRepository.listMilestones(thesisId),
    listSubmissionViews(thesisId, student),
  ]);
  return { thesisId, milestones, submissions };
}
