import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getSessionUser } from "@/core/auth/session";
import { getMaxUploadBytes } from "@/core/config/app-config";
import { EmptyState } from "@/core/ui/empty-state";
import { ChapterAnnotator } from "@/features/review/presentation/chapter-annotator";
import { SimilarityReport } from "@/features/review/presentation/similarity-report";
import { SupervisorReportForm } from "@/features/review/presentation/supervisor-report-form";
import { loadReviewWorkspace } from "@/features/review/service/review-service";
import { LockControl } from "@/features/submissions/presentation/lock-control";
import { VersionList } from "@/features/submissions/presentation/version-list";
import { formatDateTime } from "@/lib/utils/date";

interface PageProps {
  searchParams?: Promise<{ thesisId?: string }>;
}

export default async function ReviewPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user || !user.roles.includes(UserRole.COORDINATOR)) {
    redirect("/sign-in");
  }
  const params = searchParams ? await searchParams : {};
  const workspace = await loadReviewWorkspace(user, params.thesisId ?? null);
  const selected = workspace.selected;

  return (
    <div className="workspace">
      <main className="workspace__main" id="main">
        <div>
          <h1 className="card__title">Draft review</h1>
          <p className="muted">
            Review drafts, run similarity checks, and submit the supervisor
            report.
          </p>
        </div>

        {!selected ? (
          <EmptyState
            title="No supervised students"
            text="Approve a proposal to start supervising a student."
          />
        ) : (
          <>
            <nav className="chips" aria-label="Supervised theses">
              {workspace.theses.map((thesis) => (
                <a
                  key={thesis.id}
                  className="btn btn--sm"
                  href={`/review?thesisId=${thesis.id}`}
                  aria-current={
                    thesis.id === selected.thesisId ? "page" : undefined
                  }
                >
                  {thesis.studentName}
                </a>
              ))}
            </nav>

            <section className="card">
              <h2 className="card__title">Drafts</h2>
              <VersionList
                submissions={selected.submissions}
                renderActions={(submission) => (
                  <>
                    {submission.state !== "LOCKED" &&
                      submission.latestVersion !== null && (
                        <details>
                          <summary>
                            Review version {submission.latestVersion}
                          </summary>
                          <ChapterAnnotator
                            submissionId={submission.id}
                            version={submission.latestVersion}
                          />
                        </details>
                      )}
                    {submission.latestVersion !== null && (
                      <SimilarityReport
                        submissionId={submission.id}
                        latestVersion={submission.latestVersion}
                        isPdf={
                          submission.versions[0]?.mimeType === "application/pdf"
                        }
                        report={submission.similarity}
                      />
                    )}
                    {submission.state !== "LOCKED" &&
                      submission.reviewState === "approved" && (
                        <LockControl submissionId={submission.id} />
                      )}
                  </>
                )}
              />
            </section>

            <section className="card">
              <h2 className="card__title">Supervisor report</h2>
              {selected.report && (
                <p className="muted">
                  Submitted {formatDateTime(selected.report.submittedAt)}:{" "}
                  <a href={selected.report.downloadUrl}>
                    {selected.report.fileName}
                  </a>
                </p>
              )}
              {selected.blockers.length > 0 ? (
                <ul className="muted">
                  {selected.blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              ) : (
                <SupervisorReportForm
                  thesisId={selected.thesisId}
                  maxBytes={getMaxUploadBytes()}
                />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
