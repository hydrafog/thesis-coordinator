import {
  Prisma,
  SimilarityResolution,
  SimilarityState,
  SubmissionState,
} from "@prisma/client";
import { prisma } from "@/core/db/prisma";
import { runInTransaction } from "@/core/db/transaction";
import type { StoredFileDescriptor } from "@/features/submissions/domain/attachment";
import type { AnnotationInput } from "../domain/review";
import type { SimilarityDocument } from "../domain/similarity";

export interface CreateReviewInput {
  submissionId: string;
  authorId: string;
  version: number;
  decision: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
  comments: string | null;
  annotations: AnnotationInput[];
}

export interface SaveSupervisorReportInput {
  thesisId: string;
  authorId: string;
  summary: string | null;
  file: StoredFileDescriptor;
}

export class ReviewRepository {
  async createReview(input: CreateReviewInput) {
    return runInTransaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          submissionId: input.submissionId,
          authorId: input.authorId,
          version: input.version,
          decision: input.decision,
          comments: input.comments,
          annotations: {
            create: input.annotations.map((annotation) => ({
              chapter: annotation.chapter,
              page: annotation.page,
              quote: annotation.quote,
              comment: annotation.comment,
            })),
          },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorId: input.authorId,
          action: "review.created",
          targetType: "Submission",
          targetId: input.submissionId,
          metadata: { version: input.version, decision: input.decision },
        },
      });
      return review;
    });
  }

  async findLatestVersion(submissionId: string) {
    const version = await prisma.fileVersion.findFirst({
      where: { submissionId },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        mimeType: true,
        fileKey: true,
        extractedText: true,
        submission: { select: { state: true, thesisId: true } },
      },
    });
    return version;
  }

  async findFinalSubmissionId(thesisId: string): Promise<string | null> {
    const submission = await prisma.submission.findFirst({
      where: { thesisId, state: SubmissionState.LOCKED },
      orderBy: { lockedAt: "desc" },
      select: { id: true },
    });
    return submission?.id ?? null;
  }

  async loadCorpus(thesisId: string): Promise<SimilarityDocument[]> {
    const versions = await prisma.fileVersion.findMany({
      where: {
        extractedText: { not: null },
        submission: { thesisId: { not: thesisId } },
      },
      orderBy: [{ submissionId: "asc" }, { version: "desc" }],
      distinct: ["submissionId"],
      select: { submissionId: true, extractedText: true },
    });
    return versions.map((version) => ({
      id: version.submissionId,
      text: version.extractedText ?? "",
    }));
  }

  async startSimilarityReport(
    submissionId: string,
    provider: string,
    inputVersion: number,
  ) {
    return prisma.similarityReport.upsert({
      where: { submissionId },
      create: { submissionId, provider, inputVersion },
      update: {
        provider,
        inputVersion,
        state: SimilarityState.PENDING,
        score: 0,
        metadata: Prisma.DbNull,
        resolution: null,
        resolutionNotes: null,
        resolvedById: null,
        resolvedAt: null,
      },
    });
  }

  async completeSimilarityReport(
    submissionId: string,
    actorId: string,
    score: number,
    metadata: Prisma.InputJsonValue,
  ) {
    return runInTransaction(async (tx) => {
      const report = await tx.similarityReport.update({
        where: { submissionId },
        data: { state: SimilarityState.COMPLETED, score, metadata },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          action: "similarity.completed",
          targetType: "Submission",
          targetId: submissionId,
          metadata: { score, inputVersion: report.inputVersion },
        },
      });
      return report;
    });
  }

  async failSimilarityReport(submissionId: string, reason: string) {
    return prisma.similarityReport.update({
      where: { submissionId },
      data: { state: SimilarityState.FAILED, metadata: { reason } },
    });
  }

  async resolveSimilarityReport(
    submissionId: string,
    actorId: string,
    resolution: SimilarityResolution,
    notes: string | null,
  ) {
    return runInTransaction(async (tx) => {
      const updated = await tx.similarityReport.updateMany({
        where: { submissionId, state: SimilarityState.COMPLETED },
        data: {
          resolution,
          resolutionNotes: notes,
          resolvedById: actorId,
          resolvedAt: new Date(),
        },
      });
      if (updated.count === 0) {
        return false;
      }
      await tx.auditEvent.create({
        data: {
          actorId,
          action: "similarity.resolved",
          targetType: "Submission",
          targetId: submissionId,
          metadata: { resolution },
        },
      });
      return true;
    });
  }

  async findSupervisorReport(thesisId: string) {
    return prisma.supervisorReport.findUnique({
      where: { thesisId },
      select: { id: true, fileKey: true, fileName: true, submittedAt: true },
    });
  }

  async saveSupervisorReport(
    input: SaveSupervisorReportInput,
  ): Promise<{ previousKey: string | null }> {
    return runInTransaction(async (tx) => {
      const previous = await tx.supervisorReport.findUnique({
        where: { thesisId: input.thesisId },
        select: { fileKey: true },
      });
      const data = {
        authorId: input.authorId,
        summary: input.summary,
        fileName: input.file.fileName,
        fileKey: input.file.fileKey,
        fileSize: input.file.fileSize,
        mimeType: input.file.mimeType,
        checksum: input.file.checksum,
        submittedAt: new Date(),
      };
      await tx.supervisorReport.upsert({
        where: { thesisId: input.thesisId },
        create: { thesisId: input.thesisId, ...data },
        update: data,
      });
      await tx.auditEvent.create({
        data: {
          actorId: input.authorId,
          action: "supervisor_report.submitted",
          targetType: "Thesis",
          targetId: input.thesisId,
          metadata: { checksum: input.file.checksum },
        },
      });
      return { previousKey: previous?.fileKey ?? null };
    });
  }
}

export const reviewRepository = new ReviewRepository();
