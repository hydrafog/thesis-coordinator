"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/core/ui/button";

export interface UploadFormProps {
  thesisId: string;
  submissionId?: string;
  milestones: Array<{ id: string; title: string }>;
  maxBytes: number;
}

export function UploadForm({
  thesisId,
  submissionId,
  milestones,
  maxBytes,
}: UploadFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const limitMb = Math.floor(maxBytes / 1_048_576);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a PDF or ZIP file.");
      return;
    }
    if (file.size > maxBytes) {
      setError(`Files larger than ${limitMb} MB are not accepted.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/submissions", {
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
      {submissionId ? (
        <input type="hidden" name="submissionId" value={submissionId} />
      ) : (
        <>
          <div className="field">
            <label className="field__label" htmlFor={`title-${thesisId}`}>
              Draft title
            </label>
            <input
              className="input"
              id={`title-${thesisId}`}
              name="title"
              maxLength={120}
              required
            />
          </div>
          {milestones.length > 0 && (
            <div className="field">
              <label className="field__label" htmlFor={`milestone-${thesisId}`}>
                Milestone
              </label>
              <select
                className="select"
                id={`milestone-${thesisId}`}
                name="milestoneId"
                defaultValue=""
              >
                <option value="">No milestone</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
      <div className="field">
        <label
          className="field__label"
          htmlFor={`file-${submissionId ?? thesisId}`}
        >
          {submissionId ? "New version" : "File"}
        </label>
        <input
          className="input"
          id={`file-${submissionId ?? thesisId}`}
          name="file"
          type="file"
          accept=".pdf,.zip,application/pdf,application/zip"
          required
        />
        <span className="chat__composer-note">
          PDF or ZIP, up to {limitMb} MB.
        </span>
      </div>
      {error && (
        <p className="muted-block" role="alert">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  );
}
