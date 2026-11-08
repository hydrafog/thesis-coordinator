import React from "react";
import { slotRepository } from "@/features/defense/data/slot-repository";
import { committeeRepository } from "@/features/defense/data/committee-repository";
import { dossierRepository } from "@/features/defense/data/dossier-repository";
import {
  ScheduleBoard,
  ScheduleSlotView,
} from "@/features/defense/presentation/schedule-board";
import { SlotScheduleControls } from "./schedule-controls";
import { DossierState } from "@prisma/client";

export default async function AdminSchedulePage() {
  const [slots, committees, verifiedDossiers] = await Promise.all([
    slotRepository.findAll(),
    committeeRepository.findAll(),
    dossierRepository.findAll(DossierState.VERIFIED),
  ]);

  const slotDtos: ScheduleSlotView[] = slots.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    durationMinutes: s.durationMinutes,
    room: s.room,
    status: s.status,
    order: s.order,
    studentName: s.thesis?.student.user.name ?? "Unassigned",
    thesisTitle: s.thesis?.title,
    committeeName: s.committee?.name,
  }));

  const verifiedTheses = verifiedDossiers.map((d) => ({
    id: d.thesisId,
    title: d.thesis.title,
    studentName: d.thesis.student.user.name ?? "Student",
  }));

  return (
    <div className="workspace">
      <main className="workspace__main">
        <div className="split">
          <div>
            <h1 className="card__title">Defense Scheduling</h1>
            <p className="muted">
              Manage 20-minute defense slots, committees, and candidate
              timelines.
            </p>
          </div>
          <SlotScheduleControls
            committees={committees.map((c) => ({ id: c.id, name: c.name }))}
            verifiedTheses={verifiedTheses}
          />
        </div>

        <ScheduleBoard slots={slotDtos} isAdmin={true} />
      </main>
    </div>
  );
}
