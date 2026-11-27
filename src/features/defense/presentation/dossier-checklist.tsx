"use client";

import React, { useState } from "react";
import { Button } from "@/core/ui/button";
import { StatusBadge } from "@/core/ui/status-badge";
import { Dialog } from "@/core/ui/dialog";
import {
  verifyDossierAction,
  returnDossierAction,
  updateDossierItemStatusAction,
} from "../actions";
import {
  DossierState,
  DossierItemType,
  ItemStatus,
} from "../domain/defense-file";

export interface DossierView {
  id: string;
  thesisId: string;
  studentName: string;
  thesisTitle: string;
  state: DossierState;
  feedback: string | null;
  items: Array<{
    id: string;
    type: DossierItemType;
    name: string;
    fileKey: string | null;
    status: ItemStatus;
  }>;
}

interface DossierChecklistProps {
  dossiers: DossierView[];
  isAdmin?: boolean;
}

export function DossierChecklist({
  dossiers,
  isAdmin = false,
}: DossierChecklistProps) {
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (id: string) => {
    setError(null);
    setLoading(true);
    const res = await verifyDossierAction(id);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to verify dossier.");
    }
  };

  const handleOpenReturn = (id: string) => {
    setSelectedDossierId(id);
    setFeedback("");
    setError(null);
    setReturnDialogOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedDossierId || !feedback.trim()) return;
    setLoading(true);
    const res = await returnDossierAction(selectedDossierId, feedback);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to return dossier.");
    } else {
      setReturnDialogOpen(false);
    }
  };

  const handleToggleItem = async (
    defenseFileId: string,
    type: DossierItemType,
    currentStatus: ItemStatus,
  ) => {
    if (!isAdmin) return;
    const nextStatus =
      currentStatus === ItemStatus.COMPLETE
        ? ItemStatus.PENDING
        : ItemStatus.COMPLETE;
    await updateDossierItemStatusAction(defenseFileId, type, nextStatus);
  };

  if (dossiers.length === 0) {
    return (
      <div className="empty-state">
        <h3 className="empty-state__title">No dossiers to display</h3>
        <p className="empty-state__description">
          Dossiers will appear here when students submit their thesis documents
          for defense review.
        </p>
      </div>
    );
  }

  return (
    <div className="dossier-checklist-container">
      {error && <div className="feedback feedback--error">{error}</div>}

      <div className="dossier-list">
        {dossiers.map((dossier) => (
          <div key={dossier.id} className="card dossier-card">
            <div className="split">
              <div>
                <h3 className="card__title">{dossier.studentName}</h3>
                <p className="muted">{dossier.thesisTitle}</p>
              </div>
              <StatusBadge
                status={
                  dossier.state === DossierState.VERIFIED
                    ? "approved"
                    : dossier.state === DossierState.RETURNED
                      ? "rejected"
                      : "pending"
                }
                label={dossier.state}
              />
            </div>

            {dossier.feedback && (
              <div className="feedback feedback--warning">
                <strong>Return feedback:</strong> {dossier.feedback}
              </div>
            )}

            <div className="file-list">
              {dossier.items.map((item) => (
                <div key={item.id} className="file-list__row">
                  <span>{item.name}</span>
                  <div className="file-list__actions">
                    <StatusBadge
                      status={
                        item.status === ItemStatus.COMPLETE
                          ? "approved"
                          : "pending"
                      }
                      label={item.status}
                    />
                    {isAdmin && dossier.state !== DossierState.VERIFIED && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleToggleItem(dossier.id, item.type, item.status)
                        }
                      >
                        {item.status === ItemStatus.COMPLETE
                          ? "Mark Pending"
                          : "Mark Complete"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {isAdmin && dossier.state === DossierState.SUBMITTED && (
              <div className="dossier-actions">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleVerify(dossier.id)}
                >
                  Verify Dossier
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleOpenReturn(dossier.id)}
                >
                  Return for Correction
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        id="return-dossier-dialog"
        title="Return Dossier for Correction"
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
      >
        <div className="field">
          <label htmlFor="return-feedback" className="field__label">
            Correction Details & Reason
          </label>
          <textarea
            id="return-feedback"
            required
            className="input textarea"
            rows={4}
            placeholder="Explain what is missing or needs correction..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <div className="dialog__actions">
          <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!feedback.trim() || loading}
            onClick={handleConfirmReturn}
          >
            Confirm Return
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
