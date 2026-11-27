import React from "react";
import { EmptyState } from "@/core/ui/empty-state";
import { StatusBadge, type StatusKey } from "@/core/ui/status-badge";
import { formatDateTime } from "@/lib/utils/date";
import { formatFileSize } from "@/lib/utils/format";
import type { SubmissionView } from "../service/submission-view";

const DECISION_STATUS: Record<string, StatusKey> = {
  APPROVED: "approved",
  CHANGES_REQUESTED: "changes-requested",
  REJECTED: "rejected",
};

export interface VersionListProps {
  submissions: SubmissionView[];
  renderActions?: (submission: SubmissionView) => React.ReactNode;
}

export function VersionList({ submissions, renderActions }: VersionListProps) {
  if (submissions.length === 0) {
    return (
      <EmptyState
        title="No drafts yet"
        text="Uploaded drafts and their versions appear here."
      />
    );
  }

  return (
    <div className="records">
      {submissions.map((submission) => (
        <article key={submission.id} className="review">
          <div className="review__head">
            <div className="person__copy">
              <span className="person__name">{submission.title}</span>
              <span className="person__sub">
                {submission.milestoneTitle ?? "No milestone"}
              </span>
            </div>
            <div className="record__end">
              {submission.state === "LOCKED" && (
                <StatusBadge
                  status="locked"
                  tone="info"
                  label="Final, locked"
                />
              )}
              {submission.state === "SUPERSEDED" && (
                <StatusBadge
                  status="superseded"
                  tone="warning"
                  label="Superseded"
                />
              )}
              <StatusBadge status={submission.reviewState} />
            </div>
          </div>

          <div className="file-list">
            {submission.versions.map((version) => (
              <div key={version.id} className="file-list__row">
                <span>
                  v{version.version}, {version.fileName} (
                  {formatFileSize(version.fileSize)}),{" "}
                  {formatDateTime(version.createdAt)}
                </span>
                <a className="btn btn--sm" href={version.downloadUrl}>
                  Download
                </a>
              </div>
            ))}
          </div>

          {submission.reviews.map((review) => (
            <div key={review.id} className="kv">
              <div className="kv__row">
                <span className="kv__key">
                  Feedback on v{review.version},{" "}
                  {formatDateTime(review.createdAt)}
                </span>
                <span className="kv__value">
                  <StatusBadge
                    status={DECISION_STATUS[review.decision] ?? "pending"}
                  />
                </span>
              </div>
              {review.comments && (
                <p className="review__comment">{review.comments}</p>
              )}
              {review.annotations.map((annotation) => (
                <p key={annotation.id} className="review__comment">
                  <strong>
                    {annotation.chapter}
                    {annotation.page ? `, p. ${annotation.page}` : ""}:
                  </strong>{" "}
                  {annotation.quote ? `"${annotation.quote}" ` : ""}
                  {annotation.comment}
                </p>
              ))}
            </div>
          ))}

          {renderActions?.(submission)}
        </article>
      ))}
    </div>
  );
}
