import React from "react";
import { prisma } from "@/core/db/prisma";
import { StatusBadge } from "@/core/ui/status-badge";
import { Metric } from "@/core/ui/metric";

export default async function StudentResultsPage() {
  const student = await prisma.studentProfile.findFirst({
    include: {
      user: true,
      theses: {
        include: {
          defenseSlot: {
            include: {
              committee: true,
              gradingSession: {
                include: {
                  grades: true,
                  minutes: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const thesis = student?.theses[0];
  const slot = thesis?.defenseSlot;
  const session = slot?.gradingSession;
  const isFinalized = session?.state === "CLOSED";

  return (
    <div className="workspace">
      <main className="workspace__main">
        <div className="split">
          <div>
            <h1 className="card__title">Defense Results</h1>
            <p className="muted">
              Official thesis defense outcome and final committee evaluation.
            </p>
          </div>
          <StatusBadge
            status={isFinalized ? "approved" : "pending"}
            label={isFinalized ? "Finalized" : "Pending Defense"}
          />
        </div>

        <div className="card results-card">
          <div className="results-content">
            <h2 className="card__title">
              {thesis?.title ?? "Bachelor Thesis"}
            </h2>
            <p className="muted">
              {slot?.committee?.name ?? "Examination Committee"} • Date:{" "}
              {slot ? slot.date.toLocaleDateString() : "To be scheduled"}
            </p>

            <div className="results-metric-block">
              {isFinalized && session?.finalAverage ? (
                <>
                  <Metric
                    value={`${session.finalAverage.toFixed(2)}`}
                    label="Final Grade (out of 10.00)"
                  />
                  <p className="results-congrats">
                    Your thesis defense has been approved by the examination
                    board.
                  </p>
                </>
              ) : (
                <div className="empty-state">
                  <h3 className="empty-state__title">Evaluation In Progress</h3>
                  <p className="empty-state__description">
                    The committee gradebook has not yet been closed. Results
                    will be published here upon session finalization.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
