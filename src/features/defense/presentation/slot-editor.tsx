"use client";

import React, { useState } from "react";
import { Button } from "@/core/ui/button";
import { Dialog } from "@/core/ui/dialog";
import { scheduleDefenseSlotAction } from "../actions";

interface SlotEditorProps {
  isOpen: boolean;
  onClose: () => void;
  committees: Array<{ id: string; name: string }>;
  verifiedTheses: Array<{
    id: string;
    title: string;
    studentName: string;
  }>;
}

export function SlotEditor({
  isOpen,
  onClose,
  committees,
  verifiedTheses,
}: SlotEditorProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [room, setRoom] = useState("");
  const [committeeId, setCommitteeId] = useState("");
  const [thesisId, setThesisId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await scheduleDefenseSlotAction({
      date,
      startTime,
      room,
      committeeId: committeeId || undefined,
      thesisId: thesisId || undefined,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to schedule slot.");
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      id="slot-editor-dialog"
      title="Schedule 20-minute Defense Slot"
      open={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="slot-editor-form">
        {error && <div className="feedback feedback--error">{error}</div>}

        <div className="field">
          <label htmlFor="slot-date" className="field__label">
            Defense Date
          </label>
          <input
            id="slot-date"
            type="date"
            required
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="slot-time" className="field__label">
            Start Time (20 min window)
          </label>
          <input
            id="slot-time"
            type="time"
            required
            className="input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="slot-room" className="field__label">
            Room / Location
          </label>
          <input
            id="slot-room"
            type="text"
            required
            placeholder="e.g. B204 or Online"
            className="input"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="slot-committee" className="field__label">
            Committee
          </label>
          <select
            id="slot-committee"
            className="input"
            value={committeeId}
            onChange={(e) => setCommitteeId(e.target.value)}
          >
            <option value="">Select committee...</option>
            {committees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="slot-thesis" className="field__label">
            Candidate (Verified Dossier Required)
          </label>
          <select
            id="slot-thesis"
            className="input"
            value={thesisId}
            onChange={(e) => setThesisId(e.target.value)}
          >
            <option value="">Select candidate thesis...</option>
            {verifiedTheses.map((t) => (
              <option key={t.id} value={t.id}>
                {t.studentName} — {t.title}
              </option>
            ))}
          </select>
        </div>

        <div className="dialog__actions">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Checking conflicts..." : "Save Slot"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
