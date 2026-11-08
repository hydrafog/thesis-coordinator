import React from "react";
import { dossierRepository } from "@/features/defense/data/dossier-repository";
import { prisma } from "@/core/db/prisma";
import {
  DossierChecklist,
  DossierView,
} from "@/features/defense/presentation/dossier-checklist";
import {
  ScheduleBoard,
  ScheduleSlotView,
} from "@/features/defense/presentation/schedule-board";
import { StatusBadge } from "@/core/ui/status-badge";

export default async function StudentDefensePage() {
  const studentProfile = await prisma.studentProfile.findFirst({
    include: {
      user: true,
      theses: {
        include: {
          defenseSlot: {
            include: {
              committee: true,
            },
          },
          defenseFile: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  const activeThesis = studentProfile?.theses[0];
  const slot = activeThesis?.defenseSlot;
  const dossier = activeThesis?.defenseFile
    ? await dossierRepository.findByThesisId(activeThesis.id)
    : null;

  const slotViews: ScheduleSlotView[] = slot
    ? [
        {
          id: slot.id,
          date: slot.date.toISOString(),
          startTime: slot.startTime,
          endTime: slot.endTime,
          durationMinutes: slot.durationMinutes,
          room: slot.room,
          status: slot.status,
          order: slot.order,
          studentName: studentProfile?.user.name ?? "Me",
          thesisTitle: activeThesis?.title,
          committeeName: slot.committee?.name,
        },
      ]
    : [];

  const dossierViews: DossierView[] = dossier
    ? [
        {
          id: dossier.id,
          thesisId: dossier.thesisId,
          studentName: studentProfile?.user.name ?? "Me",
          thesisTitle: activeThesis?.title ?? "",
          state: dossier.state,
          feedback: dossier.feedback,
          items: dossier.items.map((i) => ({
            id: i.id,
            type: i.type,
            name: i.name,
            fileKey: i.fileKey,
            status: i.status,
          })),
        },
      ]
    : [];

  return (
    <div className="workspace">
      <main className="workspace__main">
        <div className="split">
          <div>
            <h1 className="card__title">My Defense Status</h1>
            <p className="muted">
              Track defense dossier verification and scheduled presentation
              slots.
            </p>
          </div>
          {dossier && (
            <StatusBadge
              status={
                dossier.state === "VERIFIED"
                  ? "approved"
                  : dossier.state === "RETURNED"
                    ? "rejected"
                    : "pending"
              }
              label={`Dossier: ${dossier.state}`}
            />
          )}
        </div>

        <section className="section">
          <h2 className="section__heading">Scheduled Presentation</h2>
          <ScheduleBoard slots={slotViews} isAdmin={false} />
        </section>

        <section className="section">
          <h2 className="section__heading">Prerequisite Defense Dossier</h2>
          <DossierChecklist dossiers={dossierViews} isAdmin={false} />
        </section>
      </main>
    </div>
  );
}
