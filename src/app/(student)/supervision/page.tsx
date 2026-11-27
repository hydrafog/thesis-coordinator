import { redirect } from "next/navigation";
import { getSessionUser } from "@/core/auth/session";
import { getMaxUploadBytes } from "@/core/config/app-config";
import { EmptyState } from "@/core/ui/empty-state";
import { loadStudentWorkspace } from "@/features/submissions/service/submission-service";
import { UploadForm } from "@/features/submissions/presentation/upload-form";
import { VersionList } from "@/features/submissions/presentation/version-list";

export default async function SupervisionPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }
  const workspace = await loadStudentWorkspace(user);
  const maxBytes = getMaxUploadBytes();

  return (
    <div className="workspace">
      <main className="workspace__main" id="main">
        <div>
          <h1 className="card__title">Drafts and feedback</h1>
          <p className="muted">
            Upload thesis drafts, add new versions, and read your
            supervisor&apos;s feedback.
          </p>
        </div>

        {!workspace ? (
          <EmptyState
            title="No thesis yet"
            text="Drafts open once you have a thesis with an approved supervisor."
          />
        ) : (
          <>
            <section className="card">
              <h2 className="card__title">New draft</h2>
              <UploadForm
                thesisId={workspace.thesisId}
                milestones={workspace.milestones}
                maxBytes={maxBytes}
              />
            </section>

            <section className="card">
              <h2 className="card__title">Versions and feedback</h2>
              <VersionList
                submissions={workspace.submissions}
                renderActions={(submission) =>
                  submission.state === "LOCKED" ? null : (
                    <details>
                      <summary>Upload a new version</summary>
                      <UploadForm
                        thesisId={workspace.thesisId}
                        submissionId={submission.id}
                        milestones={[]}
                        maxBytes={maxBytes}
                      />
                    </details>
                  )
                }
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
