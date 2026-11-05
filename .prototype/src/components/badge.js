import { esc } from "../core/html.js";

const STATUS = Object.freeze({
  submitted: Object.freeze({ label: "Submitted", tone: "info" }),
  approved: Object.freeze({ label: "Approved", tone: "success" }),
  rejected: Object.freeze({ label: "Rejected", tone: "danger" }),
  "changes-requested": Object.freeze({ label: "Changes requested", tone: "warning" }),
  draft: Object.freeze({ label: "Draft", tone: "neutral" }),
  "needs-work": Object.freeze({ label: "Needs work", tone: "warning" }),
  ok: Object.freeze({ label: "OK", tone: "success" }),
  pending: Object.freeze({ label: "Pending", tone: "neutral" }),
  complete: Object.freeze({ label: "Complete", tone: "success" }),
});

export function badge(status) {
  const entry = STATUS[status] ?? { label: status, tone: "neutral" };
  return `<span class="badge" data-tone="${entry.tone}">${esc(entry.label)}</span>`;
}
