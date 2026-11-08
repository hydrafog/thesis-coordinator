D"use client";

import React, { useState } from "react";
import { Button } from "@/core/ui/button";
import { closeGradingSessionAction } from "../actions";

interface SessionControlsProps {
  gradingSessionId: string;
  isClosed: boolean;
  canClose: boolean;
  minutesKey?: string | null;
  onSessionClosed?: () => void;
}

export function SessionControls({
  gradingSessionId,
  isClosed,
  canClose,
  minutesKey,
  onSessionClosed,
}: SessionControlsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = async () => {
    if (
      !confirm(
        "Are you sure you want to close grading? This will permanently lock all scores and generate the official minutes.",
      )
    ) {
      return;
    }
    setError(null);
    setLoading(true);

    const res = await closeGradingSessionAction(gradingSessionId);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to close session.");
    } else if (onSessionClosed) {
      onSessionClosed();
    }
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="session-controls">
      {error && <div className="feedback feedback--error">{error}</div>}

      <div className="split">
        <div>
          {isClosed ? (
            <div>
              <p className="muted">
                Grading session finalized. Defense minutes generated and recorded.
              </p>
              {minutesKey && (
                <p className="muted text-xs">
                  Archive key: <code>{minutesKey}</code>
                </p>
              )}
            </div>
          ) : (
            <p className="muted">
              President review: ensure all committee members have provided
              scores before closing.
            </p>
          )}
        </div>

        <div className="session-controls__buttons">
          {!isClosed ? (
            <Button
              variant="primary"
              disabled={!canClose || loading}
              onClick={handleClose}
            >
              {loading
                ? "Locking & Generating Minutes..."
                : "Close Grading & Approve Minutes"}
            </Button>
          ) : (
            <Button variant="outline" onClick={handleExport}>
              Download / Print Minutes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
