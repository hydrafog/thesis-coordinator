import React from "react";
import { dossierRepository } from "@/features/defense/data/dossier-repository";
import {
  DossierChecklist,
  DossierView,
} from "@/features/defense/presentation/dossier-checklist";

export default async function AdminDossiersPage() {
  const dossiers = await dossierRepository.findAll();

  const dossierViews: DossierView[] = dossiers.map((d) => ({
    id: d.id,
    thesisId: d.thesisId,
    studentName: d.thesis.student.user.name ?? "Student",
    thesisTitle: d.thesis.title,
    state: d.state,
    feedback: d.feedback,
    items: d.items.map((i) => ({
      id: i.id,
      type: i.type,
      name: i.name,
      fileKey: i.fileKey,
      status: i.status,
    })),
  }));

  return (
    <div className="workspace">
      <main className="workspace__main">
        <div className="split">
          <div>
            <h1 className="card__title">Defense Dossiers</h1>
            <p className="muted">
              Verify prerequisite thesis documents before candidates proceed to
              scheduling.
            </p>
          </div>
        </div>

        <DossierChecklist dossiers={dossierViews} isAdmin={true} />
      </main>
    </div>
  );
}
