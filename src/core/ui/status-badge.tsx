import React from "react";

export type StatusKey =
  | "submitted"
  | "approved"
  | "rejected"
  | "changes-requested"
  | "draft"
  | "needs-work"
  | "ok"
  | "pending"
  | "complete";

export type Tone = "info" | "success" | "danger" | "warning" | "neutral";

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const STATUS_MAP: Record<StatusKey, StatusMeta> = {
  submitted: { label: "Submitted", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  "changes-requested": { label: "Changes requested", tone: "warning" },
  draft: { label: "Draft", tone: "neutral" },
  "needs-work": { label: "Needs work", tone: "warning" },
  ok: { label: "OK", tone: "success" },
  pending: { label: "Pending", tone: "neutral" },
  complete: { label: "Complete", tone: "success" },
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusKey | string;
  tone?: Tone;
  label?: string;
}

export function StatusBadge({
  status,
  tone,
  label,
  className = "",
  children,
  ...props
}: StatusBadgeProps) {
  const entry = STATUS_MAP[status as StatusKey] as StatusMeta | undefined;
  const resolvedTone = tone ?? entry?.tone ?? "neutral";
  const resolvedLabel = label ?? entry?.label ?? status;

  return (
    <span
      className={`badge ${className}`.trim()}
      data-tone={resolvedTone}
      {...props}
    >
      {children ?? resolvedLabel}
    </span>
  );
}

export const Badge = StatusBadge;
