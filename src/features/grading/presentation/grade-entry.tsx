"use client";

import React, { useState } from "react";
import { Button } from "@/core/ui/button";
import { Person } from "@/core/ui/person";
import { submitGradeAction } from "../actions";
import { GRADE_MIN, GRADE_MAX } from "../domain/grade";

export interface CommitteeMemberGradeRow {
  memberId: string;
  name: string;
  role: "PRESIDENT" | "MEMBER";
  currentGrade: number | null;
  criterion?: string;
  weight?: number;
}

interface GradeEntryProps {
  gradingSessionId: string;
  members: CommitteeMemberGradeRow[];
  isClosed: boolean;
  onGradeSubmitted?: () => void;
}

export function GradeEntry({
  gradingSessionId,
  members,
  isClosed,
  onGradeSubmitted,
}: GradeEntryProps) {
  const [grades, setGrades] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const m of members) {
      initial[m.memberId] =
        m.currentGrade !== null ? String(m.currentGrade) : "";
    }
    return initial;
  });

  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (memberId: string, value: string) => {
    setGrades((prev) => ({ ...prev, [memberId]: value }));
  };

  const handleSave = async (memberId: string) => {
    const rawVal = grades[memberId];
    const num = parseFloat(rawVal);

    if (isNaN(num) || num < GRADE_MIN || num > GRADE_MAX) {
      setError(`Grade must be between ${GRADE_MIN} and ${GRADE_MAX}.`);
      return;
    }

    setError(null);
    setSavingMemberId(memberId);

    const res = await submitGradeAction({
      gradingSessionId,
      memberId,
      value: num,
    });

    setSavingMemberId(null);
    if (!res.success) {
      setError(res.error || "Failed to submit grade.");
    } else if (onGradeSubmitted) {
      onGradeSubmitted();
    }
  };

  return (
    <div className="grade-entry-list">
      {error && <div className="feedback feedback--error">{error}</div>}

      <div className="grades__table">
        {members.map((m) => {
          const val = grades[m.memberId] ?? "";
          const isSaving = savingMemberId === m.memberId;

          return (
            <div key={m.memberId} className="grades__row split">
              <Person
                name={m.name}
                role={m.role === "PRESIDENT" ? "President" : "Committee Member"}
              />

              <div className="grades__input-group">
                <input
                  id={`grade-${m.memberId}`}
                  type="number"
                  min={GRADE_MIN}
                  max={GRADE_MAX}
                  step="0.01"
                  disabled={isClosed}
                  className="input grade-input"
                  placeholder="1.00–10.00"
                  value={val}
                  onChange={(e) =>
                    handleInputChange(m.memberId, e.target.value)
                  }
                />

                {!isClosed && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSaving || !val}
                    onClick={() => handleSave(m.memberId)}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
