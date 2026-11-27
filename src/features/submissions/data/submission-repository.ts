import {
  Prisma,
  SubmissionState,
  type Submission,
  type FileVersion,
} from "@prisma/client";
import { prisma } from "@/core/db/prisma";
import { runInTransaction } from "@/core/db/transaction";
import { DomainError } from "@/core/errors/domain-error";
import {
  assertAcceptsUploads,
  nextVersionNumber,
  transitionSubmission,
  type SubmissionAction,
} from "../domain/submission";
import type { StoredFileDescriptor } from "../domain/attachment";

export interface ThesisAccess {
  id: string;
  title: string;
  studentUserId: string;
  coordinatorUserId: string | null;
}

const THESIS_ACCESS_SELECT = {
  id: true,
  title: true,
  student: { select: { userId: true } },
  coordinator: { select: { userId: true } },
} satisfies Prisma.ThesisSelect;

function toThesisAccess(
  thesis: Prisma.ThesisGetPayload<{ select: typeof THESIS_ACCESS_SELECT }>,
): ThesisAccess {
  return {
    id: thesis.id,
    title: thesis.title,
    studentUserId: thesis.student.userId,
    coordinatorUserId: thesis.coordinator?.userId ?? null,
  };
}

const SUBMISSION_DETAIL = {
  fileVersions: { orderBy: { version: "desc" } },
  reviews: {
    orderBy: { createdAt: "desc" },
    include: { annotations: { orderBy: { createdAt: "asc" } } },
  },
  similarityReport: true,
  milestone: { select: { id: true, title: true } },
} satisfies Prisma.SubmissionInclude;

export type SubmissionDetail = Prisma.SubmissionGetPayload<{
  include: typeof SUBMISSION_DETAIL;
}>;

export interface AddVersionInput {
  thesisId: string;
  submissionId: string | null;
  title: string;
  notes: string | null;
  milestoneId: string | null;
  uploadedById: string;
  file: StoredFileDescriptor;
  extractedText: string | null;
}

export class SubmissionRepository {
  async findThesisAccess(thesisId: string): Promise<ThesisAccess | null> {
    const thesis = await prisma.thesis.findUnique({
      where: { id: thesisId },
      select: THESIS_ACCESS_SELECT,
    });
    return thesis ? toThesisAccess(thesis) : null;
  }

  async findThesisAccessBySubmission(
    submissionId: string,
  ): Promise<ThesisAccess | null> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { thesis: { select: THESIS_ACCESS_SELECT } },
    });
    return submission ? toThesisAccess(submission.thesis) : null;
  }

  async findStateForThesis(
    submissionId: string,
    thesisId: string,
  ): Promise<SubmissionState | null> {
    const submission = await prisma.submission.findFirst({
      where: { id: submissionId, thesisId },
      select: { state: true },
    });
    return submission?.state ?? null;
  }

  async findThesisIdForStudent(userId: string): Promise<string | null> {
    const thesis = await prisma.thesis.findFirst({
      where: { student: { userId } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    return thesis?.id ?? null;
  }

  async listSupervisedTheses(coordinatorUserId: string) {
    return prisma.thesis.findMany({
      where: { coordinator: { userId: coordinatorUserId } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        student: { select: { user: { select: { name: true, email: true } } } },
      },
    });
  }

  async milestoneBelongsToThesis(
    milestoneId: string,
    thesisId: string,
  ): Promise<boolean> {
    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, thesisId },
      select: { id: true },
    });
    return milestone !== null;
  }

  async listMilestones(thesisId: string) {
    return prisma.milestone.findMany({
      where: { thesisId },
      orderBy: { dueAt: "asc" },
      select: { id: true, title: true },
    });
  }

  async listForThesis(thesisId: string): Promise<SubmissionDetail[]> {
    return prisma.submission.findMany({
      where: { thesisId },
      orderBy: { createdAt: "desc" },
      include: SUBMISSION_DETAIL,
    });
  }

  async findById(id: string): Promise<SubmissionDetail | null> {
    return prisma.submission.findUnique({
      where: { id },
      include: SUBMISSION_DETAIL,
    });
  }

  async addVersion(
    input: AddVersionInput,
  ): Promise<{ submission: Submission; fileVersion: FileVersion }> {
    return runInTransaction(async (tx) => {
      let submission: Submission;
      let versions: number[] = [];

      if (input.submissionId) {
        const existing = await tx.submission.findFirst({
          where: { id: input.submissionId, thesisId: input.thesisId },
          select: { id: true },
        });
        if (!existing) {
          throw new DomainError("not_found", "Submission not found.");
        }
        // Touching the row serializes concurrent uploads and rejects a lock
        // that committed after the service-level pre-check.
        const touched = await tx.submission.updateMany({
          where: { id: existing.id, state: { not: SubmissionState.LOCKED } },
          data: { updatedAt: new Date() },
        });
        if (touched.count === 0) {
          assertAcceptsUploads(SubmissionState.LOCKED);
        }
        submission = await tx.submission.findUniqueOrThrow({
          where: { id: existing.id },
        });
        versions = (
          await tx.fileVersion.findMany({
            where: { submissionId: submission.id },
            select: { version: true },
          })
        ).map((entry) => entry.version);
      } else {
        submission = await tx.submission.create({
          data: {
            thesisId: input.thesisId,
            milestoneId: input.milestoneId,
            title: input.title,
            notes: input.notes,
          },
        });
      }

      const fileVersion = await tx.fileVersion.create({
        data: {
          submissionId: submission.id,
          version: nextVersionNumber(versions),
          uploadedById: input.uploadedById,
          fileName: input.file.fileName,
          fileKey: input.file.fileKey,
          fileSize: input.file.fileSize,
          mimeType: input.file.mimeType,
          checksum: input.file.checksum,
          extractedText: input.extractedText,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorId: input.uploadedById,
          action: "submission.version_uploaded",
          targetType: "Submission",
          targetId: submission.id,
          metadata: {
            version: fileVersion.version,
            checksum: fileVersion.checksum,
          },
        },
      });

      return { submission, fileVersion };
    });
  }

  async transition(
    submissionId: string,
    action: SubmissionAction,
    actorId: string,
    reason: string | null,
  ): Promise<SubmissionState> {
    return runInTransaction(async (tx) => {
      const current = await tx.submission.findUnique({
        where: { id: submissionId },
        select: { state: true },
      });
      if (!current) {
        throw new DomainError("not_found", "Submission not found.");
      }
      const next = transitionSubmission(current.state, action);
      const updated = await tx.submission.updateMany({
        where: { id: submissionId, state: current.state },
        data: {
          state: next,
          lockedAt: next === SubmissionState.LOCKED ? new Date() : null,
        },
      });
      if (updated.count === 0) {
        throw new DomainError(
          "conflict",
          "The submission changed while you were working. Reload and retry.",
        );
      }
      await tx.auditEvent.create({
        data: {
          actorId,
          action: `submission.${action.toLowerCase()}`,
          targetType: "Submission",
          targetId: submissionId,
          metadata: { from: current.state, to: next, reason },
        },
      });
      return next;
    });
  }

  async saveExtractedText(fileVersionId: string, text: string): Promise<void> {
    await prisma.fileVersion.update({
      where: { id: fileVersionId },
      data: { extractedText: text },
    });
  }
}

export const submissionRepository = new SubmissionRepository();
