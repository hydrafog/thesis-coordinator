"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/core/ui/button";
import { createReviewAction } from "../actions";
import { MAX_ANNOTATIONS, REVIEW_DECISIONS } from "../domain/review";

const DECISION_LABELS: Record<(typeof REVIEW_DECISIONS)[number], string> = {
  APPROVED: "Approve",
  CHANGES_REQUESTED: "Request changes",
  REJECTED: "Reject",
};

interface AnnotationDraft {
  key: number;
  chapter: string;
  page: string;
  quote: string;
  comment: string;
}

export interface ChapterAnnotatorProps {
  submissionId: string;
  version: number;
}

export function ChapterAnnotator({
  submissionId,
  version,
}: ChapterAnnotatorProps) {
  const router = useRouter();
  const [decision, setDecision] =
    useState<(typeof REVIEW_DECISIONS)[number]>("CHANGES_REQUESTED");
  const [comments, setComments] = useState("");
  const [annotations, setAnnotations] = useState<AnnotationDraft[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function updateAnnotation(key: number, patch: Partial<AnnotationDraft>) {
    setAnnotations((current) =>
      current.map((entry) =>
        entry.key === key ? { ...entry, ...patch } : entry,
      ),
    );
  }

  function addAnnotation() {
    setAnnotations((current) => [
      ...current,
      { key: nextKey, chapter: "", page: "", quote: "", comment: "" },
    ]);
    setNextKey((current) => current + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createReviewAction(submissionId, {
      version,
      decision,
      comments: comments.trim() === "" ? null : comments,
      annotations: annotations.map((entry) => ({
        chapter: entry.chapter,
        page: entry.page.trim() === "" ? null : Number(entry.page),
        quote: entry.quote.trim() === "" ? null : entry.quote,
        comment: entry.comment,
      })),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setComments("");
    setAnnotations([]);
    router.refresh();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <fieldset className="field">
        <legend className="field__label">Decision for version {version}</legend>
        <div className="choice-group">
          {REVIEW_DECISIONS.map((value) => (
            <label key={value} className="choice">
              <input
                type="radio"
                name={`decision-${submissionId}`}
                checked={decision === value}
                onChange={() => setDecision(value)}
              />
              <span className="choice__label">{DECISION_LABELS[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor={`comments-${submissionId}`}>
          Feedback
        </label>
        <textarea
          className="textarea"
          id={`comments-${submissionId}`}
          maxLength={800}
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="What should the student revise?"
        />
      </div>

      {annotations.map((entry, index) => (
        <div key={entry.key} className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor={`chapter-${entry.key}`}>
              Annotation {index + 1}: chapter
            </label>
            <input
              className="input"
              id={`chapter-${entry.key}`}
              maxLength={80}
              value={entry.chapter}
              onChange={(event) =>
                updateAnnotation(entry.key, { chapter: event.target.value })
              }
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`page-${entry.key}`}>
              Page
            </label>
            <input
              className="input"
              id={`page-${entry.key}`}
              type="number"
              min={1}
              value={entry.page}
              onChange={(event) =>
                updateAnnotation(entry.key, { page: event.target.value })
              }
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`quote-${entry.key}`}>
              Quoted passage
            </label>
            <input
              className="input"
              id={`quote-${entry.key}`}
              maxLength={300}
              value={entry.quote}
              onChange={(event) =>
                updateAnnotation(entry.key, { quote: event.target.value })
              }
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`note-${entry.key}`}>
              Comment
            </label>
            <textarea
              className="textarea"
              id={`note-${entry.key}`}
              maxLength={800}
              value={entry.comment}
              onChange={(event) =>
                updateAnnotation(entry.key, { comment: event.target.value })
              }
            />
          </div>
          <div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setAnnotations((current) =>
                  current.filter((item) => item.key !== entry.key),
                )
              }
            >
              Remove annotation
            </Button>
          </div>
        </div>
      ))}

      {error && (
        <p className="muted-block" role="alert">
          {error}
        </p>
      )}
      <div className="cluster">
        <Button
          size="sm"
          disabled={annotations.length >= MAX_ANNOTATIONS}
          onClick={addAnnotation}
        >
          Add annotation
        </Button>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Saving..." : "Save review"}
        </Button>
      </div>
    </form>
  );
}
