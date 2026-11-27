import type { SessionUser } from "@/core/auth/session";
import { DomainError, isDomainError } from "@/core/errors/domain-error";
import { errorContext, logger } from "@/core/logging/logger";
import { createDownloadUrl } from "@/core/storage/signed-url";
import { getMaxUploadBytes } from "@/core/config/app-config";
import { parseInput } from "@/lib/validation/schemas";
import {
  discardFile,
  storeFile,
} from "@/features/submissions/data/storage-client";
import {
  submissionRepository,
  type ThesisAccess,
} from "@/features/submissions/data/submission-repository";
import { validateUpload } from "@/features/submissions/domain/attachment";
import { SubmissionState } from "@/features/submissions/domain/submission";
import { listSubmissionViews } from "@/features/submissions/service/submission-service";
import type { SubmissionView } from "@/features/submissions/service/submission-view";
import { reviewRepository } from "../data/review-repository";
import { similarityClient } from "../data/similarity-client";
import {
  assertReportReady,
  reportSummarySchema,
  resolutionSchema,
  reviewInputSchema,
  supervisorReportBlockers,
} from "../domain/review";

async function requireSupervisor(
  actor: SessionUser,
  submissionId: string,
): Promise<ThesisAccess> {
  const access =
    await submissionRepository.findThesisAccessBySubmission(submissionId);
  if (!access) {
    throw new DomainError("not_found", "Submission not found.");
  }
  if (access.coordinatorUserId !== actor.id) {
    throw new DomainError(
      "forbidden",
      "Only the supervising coordinator can do this.",
    );
  }
  return access;
}

export async function createReview(
  actor: SessionUser,
  submissionId: string,
  rawInput: unknown,
): Promise<void> {
  const input = parseInput(reviewInputSchema, rawInput);
  await requireSupervisor(actor, submissionId);
  const latest = await reviewRepository.findLatestVersion(submissionId);
  if (!latest) {
    throw new DomainError(
      "validation_failed",
      "There is no version to review.",
    );
  }
  if (latest.submission.state === SubmissionState.LOCKED) {
    throw new DomainError(
      "submission_locked",
      "A locked submission cannot be reviewed.",
    );
  }
  if (latest.version !== input.version) {
    throw new DomainError(
      "conflict",
      "A newer version was uploaded. Review the latest version.",
    );
  }
  await reviewRepository.createReview({
    submissionId,
    authorId: actor.id,
    version: input.version,
    decision: input.decision,
    comments: input.comments,
    annotations: input.annotations,
  });
}

export async function runSimilarityCheck(
  actor: SessionUser,
  submissionId: string,
): Promise<void> {
  const access = await requireSupervisor(actor, submissionId);
  const latest = await reviewRepository.findLatestVersion(submissionId);
  if (!latest) {
    throw new DomainError("validation_failed", "There is no version to check.");
  }
  if (latest.mimeType !== "application/pdf") {
    throw new DomainError(
      "validation_failed",
      "Similarity checks need a PDF version.",
    );
  }

  await reviewRepository.startSimilarityReport(
    submissionId,
    similarityClient.provider,
    latest.version,
  );
  try {
    const subject = await similarityClient.textOf(latest);
    const corpus = await reviewRepository.loadCorpus(access.id);
    const result = similarityClient.compare(subject, corpus);
    await reviewRepository.completeSimilarityReport(
      submissionId,
      actor.id,
      result.score,
      { ...result.metadata, matches: result.matches },
    );
  } catch (error) {
    const reason = isDomainError(error)
      ? error.message
      : "The document text could not be read.";
    logger.warn("similarity check failed", {
      submissionId,
      ...errorContext(error),
    });
    await reviewRepository.failSimilarityReport(submissionId, reason);
  }
}

export async function resolveSimilarity(
  actor: SessionUser,
  submissionId: string,
  rawInput: unknown,
): Promise<void> {
  const input = parseInput(resolutionSchema, rawInput);
  await requireSupervisor(actor, submissionId);
  if (input.resolution === "REJECTED" && !input.notes) {
    throw new DomainError(
      "validation_failed",
      "Explain why the similarity result is not acceptable.",
    );
  }
  const resolved = await reviewRepository.resolveSimilarityReport(
    submissionId,
    actor.id,
    input.resolution,
    input.notes,
  );
  if (!resolved) {
    throw new DomainError(
      "invalid_transition",
      "Run a completed similarity check before resolving it.",
    );
  }
}

async function readinessFor(thesisId: string, views: SubmissionView[]) {
  const finalId = await reviewRepository.findFinalSubmissionId(thesisId);
  const final = views.find((view) => view.id === finalId) ?? null;
  return {
    finalSubmission: final && {
      latestVersion: final.latestVersion,
      reviewState: final.reviewState,
      similarity: final.similarity && {
        state: final.similarity.state,
        inputVersion: final.similarity.inputVersion,
        resolution: final.similarity.resolution,
      },
    },
  };
}

export async function submitSupervisorReport(
  actor: SessionUser,
  thesisId: string,
  summaryText: string | null,
  file: File,
): Promise<void> {
  const access = await submissionRepository.findThesisAccess(thesisId);
  if (!access) {
    throw new DomainError("not_found", "Thesis not found.");
  }
  if (access.coordinatorUserId !== actor.id) {
    throw new DomainError(
      "forbidden",
      "Only the supervising coordinator can submit the report.",
    );
  }
  const summary = summaryText
    ? parseInput(reportSummarySchema, summaryText)
    : null;
  const views = await listSubmissionViews(thesisId, actor);
  assertReportReady(await readinessFor(thesisId, views));

  const format = validateUpload(
    { fileName: file.name, size: file.size, mimeType: file.type },
    { maxBytes: getMaxUploadBytes(), formats: ["pdf"] },
  );
  const stored = await storeFile({
    prefix: `reports/${thesisId}`,
    fileName: file.name,
    format,
    bytes: Buffer.from(await file.arrayBuffer()),
  });
  try {
    const { previousKey } = await reviewRepository.saveSupervisorReport({
      thesisId,
      authorId: actor.id,
      summary,
      file: stored,
    });
    if (previousKey) {
      await discardFile(previousKey);
    }
  } catch (error) {
    await discardFile(stored.fileKey);
    throw error;
  }
}

export interface ReviewWorkspace {
  theses: Array<{ id: string; title: string; studentName: string }>;
  selected: {
    thesisId: string;
    submissions: SubmissionView[];
    blockers: string[];
    report: {
      fileName: string;
      submittedAt: string;
      downloadUrl: string;
    } | null;
  } | null;
}

export async function loadReviewWorkspace(
  actor: SessionUser,
  requestedThesisId: string | null,
): Promise<ReviewWorkspace> {
  const supervised = await submissionRepository.listSupervisedTheses(actor.id);
  const theses = supervised.map((thesis) => ({
    id: thesis.id,
    title: thesis.title,
    studentName: thesis.student.user.name ?? thesis.student.user.email,
  }));
  const current =
    theses.find((thesis) => thesis.id === requestedThesisId) ??
    theses[0] ??
    null;
  if (!current) {
    return { theses, selected: null };
  }
  const [submissions, report] = await Promise.all([
    listSubmissionViews(current.id, actor),
    reviewRepository.findSupervisorReport(current.id),
  ]);
  return {
    theses,
    selected: {
      thesisId: current.id,
      submissions,
      blockers: supervisorReportBlockers(
        await readinessFor(current.id, submissions),
      ),
      report: report && {
        fileName: report.fileName,
        submittedAt: report.submittedAt.toISOString(),
        downloadUrl: createDownloadUrl(report.fileKey, actor.id),
      },
    },
  };
}
