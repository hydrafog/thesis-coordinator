"use client";

import React from "react";
import { Button } from "@/core/ui/button";
import { StatusBadge } from "@/core/ui/status-badge";
import { reorderDefenseSlotsAction, deleteDefenseSlotAction } from "../actions";

export interface ScheduleSlotView {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  room: string;
  status: string;
  order: number;
  studentName?: string;
  thesisTitle?: string;
  committeeName?: string;
}

interface ScheduleBoardProps {
  slots: ScheduleSlotView[];
  isAdmin?: boolean;
}

export function ScheduleBoard({ slots, isAdmin = false }: ScheduleBoardProps) {
  const dates = [...new Set(slots.map((s) => s.date.slice(0, 10)))].sort();

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slots.length) return;

    const reordered = [...slots];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    await reorderDefenseSlotsAction(reordered.map((s) => s.id));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this defense slot?")) {
      await deleteDefenseSlotAction(id);
    }
  };

  if (slots.length === 0) {
    return (
      <div className="empty-state">
        <h3 className="empty-state__title">No defense slots scheduled</h3>
        <p className="empty-state__description">
          Create 20-minute defense slots and assign candidates once their
          dossiers are verified.
        </p>
      </div>
    );
  }

  return (
    <div className="schedule-board">
      {dates.map((dateStr) => {
        const daySlots = slots.filter((s) => s.date.slice(0, 10) === dateStr);
        return (
          <section key={dateStr} className="agenda__day">
            <h3 className="agenda__date">
              {new Date(dateStr).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </h3>
            <div className="agenda__entries">
              {daySlots.map((slot, idx) => (
                <div key={slot.id} className="agenda__entry">
                  <div className="agenda__time-block">
                    <time className="agenda__time">{slot.startTime}</time>
                    <span className="agenda__duration">
                      {slot.durationMinutes} min
                    </span>
                  </div>

                  <div className="agenda__info">
                    <div className="agenda__candidate">
                      <span className="person__name">
                        {slot.studentName || "Unassigned Slot"}
                      </span>
                      {slot.thesisTitle && (
                        <span className="agenda__title">
                          {slot.thesisTitle}
                        </span>
                      )}
                    </div>
                    <span className="person__sub">
                      {slot.committeeName || "No committee"} • Room {slot.room}
                    </span>
                  </div>

                  <div className="agenda__status">
                    <StatusBadge
                      status={
                        slot.status === "SCHEDULED" ? "approved" : "pending"
                      }
                      label={slot.status}
                    />
                  </div>

                  {isAdmin && (
                    <div className="agenda__actions">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, "up")}
                        label="Move up"
                      >
                        ▲
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={idx === daySlots.length - 1}
                        onClick={() => handleMove(idx, "down")}
                        label="Move down"
                      >
                        ▼
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(slot.id)}
                        label="Delete slot"
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
