import { createDownloadUrl } from "@/core/storage/signed-url";
import type { SubmissionDetail } from "../data/submission-repository";
import { deriveReviewState, type ReviewState } from "../domain/submission";

export interface VersionView {
  id: string;
  version: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  downloadUrl: string;
}

export interface AnnotationView {
  id: string;
  chapter: string;
  page: number | null;
  quote: string | null;
  comment: string;
}

export interface ReviewView {
  id: string;
  version: number;
  decision: string;
  comments: string | null;
  createdAt: string;
  annotations: AnnotationView[];
}

export interface SimilarityView {
  state: string;
  score: number;
  provider: string;
  inputVersion: number;
  resolution: string | null;
  resolutionNotes: string | null;
  topMatches: number[];
}

export interface SubmissionView {
  id: string;
  title: string;
  notes: string | null;
  state: string;
  lockedAt: string | null;
  milestoneTitle: string | null;
  reviewState: ReviewState;
  latestVersion: number | null;
  versions: VersionView[];
  reviews: ReviewView[];
  similarity: SimilarityView | null;
}

function topMatchRatios(metadata: unknown): number[] {
  if (typeof metadata !== "object" || metadata === null) {
    return [];
  }
  const matches = (metadata as { matches?: unknown }).matches;
  if (!Array.isArray(matches)) {
    return [];
  }
  return matches
    .map((match) => (match as { ratio?: unknown } | null)?.ratio)
    .filter((ratio): ratio is number => typeof ratio === "number");
}

export function toSubmissionView(
  detail: SubmissionDetail,
  viewerId: string,
  includeSimilarity: boolean,
): SubmissionView {
  const latestVersion = detail.fileVersions[0]?.version ?? null;
  const report = detail.similarityReport;
  return {
    id: detail.id,
    title: detail.title,
    notes: detail.notes,
    state: detail.state,
    lockedAt: detail.lockedAt?.toISOString() ?? null,
    milestoneTitle: detail.milestone?.title ?? null,
    reviewState: deriveReviewState(latestVersion, detail.reviews),
    latestVersion,
    versions: detail.fileVersions.map((file) => ({
      id: file.id,
      version: file.version,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      createdAt: file.createdAt.toISOString(),
      downloadUrl: createDownloadUrl(file.fileKey, viewerId),
    })),
    reviews: detail.reviews.map((review) => ({
      id: review.id,
      version: review.version,
      decision: review.decision,
      comments: review.comments,
      createdAt: review.createdAt.toISOString(),
      annotations: review.annotations.map((annotation) => ({
        id: annotation.id,
        chapter: annotation.chapter,
        page: annotation.page,
        quote: annotation.quote,
        comment: annotation.comment,
      })),
    })),
    similarity:
      includeSimilarity && report
        ? {
            state: report.state,
            score: report.score,
            provider: report.provider,
            inputVersion: report.inputVersion,
            resolution: report.resolution,
            resolutionNotes: report.resolutionNotes,
            topMatches: topMatchRatios(report.metadata),
          }
        : null,
  };
}
