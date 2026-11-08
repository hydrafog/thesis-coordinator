import React from "react";
import { slotRepository } from "@/features/defense/data/slot-repository";
import { gradingRepository } from "@/features/grading/data/grading-repository";
import {
  GradeEntry,
  CommitteeMemberGradeRow,
} from "@/features/grading/presentation/grade-entry";
import { LiveAverage } from "@/features/grading/presentation/live-average";
import { SessionControls } from "@/features/grading/presentation/session-controls";
import { computeLiveMean } from "@/features/grading/domain/grading-session";

interface PageProps {
  searchParams?: Promise<{ slotId?: string }>;
}

export default async function GradebookPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const slots = await slotRepository.findAll();

  const activeSlot =
    (resolvedParams.slotId
      ? slots.find((s) => s.id === resolvedParams.slotId)
      : slots[0]) ?? null;

  let session = null;
  if (activeSlot) {
    session = await gradingRepository.createOrGetSession(activeSlot.id);
  }

  const committeeMembers = activeSlot?.committee?.members ?? [];
  const grades = session?.grades ?? [];

  const memberRows: CommitteeMemberGradeRow[] = committeeMembers.map((m) => {
    const existingGrade = grades.find((g) => g.memberId === m.userId);
    return {
      memberId: m.userId,
      name: m.user.name ?? m.user.email,
      role: m.role,
      currentGrade: existingGrade ? existingGrade.value : null,
      criterion: existingGrade?.criterion,
      weight: existingGrade?.weight,
    };
  });

  const { average, formatted } = computeLiveMean(
    grades.map((g) => ({ value: g.value, weight: g.weight })),
  );

  const isClosed = session?.state === "CLOSED";
  const validGradesCount = memberRows.filter(
    (m) => m.currentGrade !== null,
  ).length;
  const canClose =
    !isClosed &&
    memberRows.length > 0 &&
    validGradesCount === memberRows.length;

  return (
    <div className="workspace">
      <main className="workspace__main">
        <div className="split">
          <div>
            <h1 className="card__title">Online Committee Gradebook</h1>
            <p className="muted">
              Enter independent committee evaluations and monitor the live
              computed mean.
            </p>
          </div>
        </div>

        {slots.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state__title">
              No defense sessions available
            </h3>
            <p className="empty-state__description">
              Defense slots and committees must be scheduled before opening the
              gradebook.
            </p>
          </div>
        ) : (
          <>
            <div className="card candidate-banner">
              <div className="split">
                <div>
                  <span className="section__count">Candidate Defense</span>
                  <h2 className="card__title">
                    {activeSlot?.thesis?.student.user.name ?? "Candidate"}
                  </h2>
                  <p className="muted">
                    {activeSlot?.thesis?.title ?? "Bachelor Thesis"} • Room{" "}
                    {activeSlot?.room} • Committee:{" "}
                    {activeSlot?.committee?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="gradebook-grid">
              <section className="card">
                <h3 className="card__title">Committee Member Scores</h3>
                <p className="muted">
                  Members input marks from 1.00 to 10.00 independently.
                </p>
                {session && (
                  <GradeEntry
                    gradingSessionId={session.id}
                    members={memberRows}
                    isClosed={isClosed}
                  />
                )}
              </section>

              <aside className="gradebook-side">
                <LiveAverage
                  average={
                    session?.finalAverage ?? (average > 0 ? average : null)
                  }
                  formatted={session?.finalAverage?.toFixed(2) ?? formatted}
                  isClosed={isClosed}
                  totalGradesEntered={validGradesCount}
                  expectedGradesCount={memberRows.length}
                />

                {session && (
                  <SessionControls
                    gradingSessionId={session.id}
                    isClosed={isClosed}
                    canClose={canClose}
                    minutesKey={session.minutes?.pdfKey}
                  />
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
