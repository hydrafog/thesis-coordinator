"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/core/ui/button";
import { StatusBadge } from "@/core/ui/status-badge";
import type { SimilarityView } from "@/features/submissions/service/submission-view";
import { resolveSimilarityAction, runSimilarityAction } from "../actions";

export interface SimilarityReportProps {
  submissionId: string;
  latestVersion: number;
  isPdf: boolean;
  report: SimilarityView | null;
}

export function SimilarityReport({
  submissionId,
  latestVersion,
  isPdf,
  report,
}: SimilarityReportProps) {
  const router = useRouter();
  const [resolution, setResolution] = useState<"ACCEPTED" | "REJECTED">(
    "ACCEPTED",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function perform(
    work: () => Promise<{ success: boolean; error?: string }>,
  ) {
    setBusy(true);
    setError(null);
    const result = await work();
    setBusy(false);
    if (!result.success) {
      setError(result.error ?? "The request failed.");
      return;
    }
    router.refresh();
  }

  const stale = report !== null && report.inputVersion !== latestVersion;
  const canResolve =
    report?.state === "COMPLETED" && !stale && report.resolution === null;

  return (
    <div className="kv">
      <div className="kv__row">
        <span className="kv__key">Similarity check</span>
        <span className="kv__value">
          {!report && "Not run yet"}
          {report?.state === "PENDING" && <StatusBadge status="pending" />}
          {report?.state === "COMPLETED" && <StatusBadge status="complete" />}
          {report?.state === "FAILED" && (
            <StatusBadge status="failed" tone="danger" label="Failed" />
          )}
        </span>
      </div>

      {report?.state === "COMPLETED" && (
        <>
          <div className="kv__row">
            <span className="kv__key">Matching text</span>
            <span className="kv__value num">{report.score.toFixed(1)}%</span>
          </div>
          <div className="kv__row">
            <span className="kv__key">Checked version</span>
            <span className="kv__value">
              v{report.inputVersion} ({report.provider})
              {stale ? ", a newer version exists" : ""}
            </span>
          </div>
          {report.topMatches.length > 0 && (
            <div className="kv__row">
              <span className="kv__key">Closest stored theses</span>
              <span className="kv__value">
                {report.topMatches
                  .map((ratio) => `${ratio.toFixed(1)}%`)
                  .join(", ")}
              </span>
            </div>
          )}
        </>
      )}

      {report?.resolution && (
        <div className="kv__row">
          <span className="kv__key">Decision</span>
          <span className="kv__value">
            <StatusBadge
              status={
                report.resolution === "ACCEPTED" ? "approved" : "rejected"
              }
            />
            {report.resolutionNotes ? ` ${report.resolutionNotes}` : ""}
          </span>
        </div>
      )}

      {canResolve && (
        <div className="form-grid">
          <div className="field">
            <label
              className="field__label"
              htmlFor={`resolution-${submissionId}`}
            >
              Your decision
            </label>
            <select
              className="select"
              id={`resolution-${submissionId}`}
              value={resolution}
              onChange={(event) =>
                setResolution(event.target.value as "ACCEPTED" | "REJECTED")
              }
            >
              <option value="ACCEPTED">Accept the result</option>
              <option value="REJECTED">Not acceptable</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`notes-${submissionId}`}>
              Notes
            </label>
            <textarea
              className="textarea"
              id={`notes-${submissionId}`}
              maxLength={800}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() =>
                perform(() =>
                  resolveSimilarityAction(submissionId, {
                    resolution,
                    notes: notes.trim() === "" ? null : notes,
                  }),
                )
              }
            >
              Save decision
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="muted-block" role="alert">
          {error}
        </p>
      )}
      <div>
        <Button
          size="sm"
          disabled={busy || !isPdf}
          onClick={() => perform(() => runSimilarityAction(submissionId))}
        >
          {report ? "Run again" : "Run similarity check"}
        </Button>
        {!isPdf && (
          <p className="chat__composer-note">
            Only PDF versions can be checked.
          </p>
        )}
      </div>
    </div>
  );
}
