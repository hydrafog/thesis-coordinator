"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/core/ui/button";

export interface SupervisorReportFormProps {
  thesisId: string;
  maxBytes: number;
}

export function SupervisorReportForm({
  thesisId,
  maxBytes,
}: SupervisorReportFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose the report PDF.");
      return;
    }
    if (file.size > maxBytes) {
      setError(
        `Files larger than ${Math.floor(maxBytes / 1_048_576)} MB are not accepted.`,
      );
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/supervisor-reports", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "The upload failed.");
        return;
      }
      form.reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="thesisId" value={thesisId} />
      <div className="field">
        <label className="field__label" htmlFor={`report-file-${thesisId}`}>
          Supervisor report (PDF)
        </label>
        <input
          className="input"
          id={`report-file-${thesisId}`}
          name="file"
          type="file"
          accept=".pdf,application/pdf"
          required
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`report-summary-${thesisId}`}>
          Summary
        </label>
        <textarea
          className="textarea"
          id={`report-summary-${thesisId}`}
          name="summary"
          maxLength={1000}
        />
      </div>
      {error && (
        <p className="muted-block" role="alert">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Uploading..." : "Submit report"}
        </Button>
      </div>
    </form>
  );
}
