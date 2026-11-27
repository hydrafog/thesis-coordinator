"use client";

import React from "react";
import { Metric } from "@/core/ui/metric";
import { StatusBadge } from "@/core/ui/status-badge";

interface LiveAverageProps {
  average: number | null;
  formatted: string;
  isClosed: boolean;
  totalGradesEntered: number;
  expectedGradesCount: number;
}

export function LiveAverage({
  average,
  formatted,
  isClosed,
  totalGradesEntered,
  expectedGradesCount,
}: LiveAverageProps) {
  return (
    <div className="card live-average-panel">
      <div className="split">
        <h3 className="card__title">Evaluation Average</h3>
        <StatusBadge
          status={isClosed ? "approved" : "pending"}
          label={isClosed ? "Grades Locked" : "Live Session"}
        />
      </div>

      <div className="live-average__display">
        <Metric
          value={average !== null && average > 0 ? formatted : "—"}
          label="Computed Average (out of 10.00)"
        />
      </div>

      <div className="live-average__progress">
        <p className="muted">
          Scores submitted: {totalGradesEntered} / {expectedGradesCount}{" "}
          committee members
        </p>
      </div>
    </div>
  );
}
