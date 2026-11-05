import { COORDINATOR_NAME } from "../config/constants.js";
import { esc } from "../core/html.js";
import { formatLongDate, formatShortDate } from "../core/format.js";
import {
  awaitingDecision,
  coordinatorByName,
  freePlaces,
  matchesQuery,
  milestonesOf,
  openMilestonesByDue,
  proposalsOf,
  usedPlaces,
} from "../core/selectors.js";
import { badge } from "../components/badge.js";
import { button } from "../components/button.js";
import { emptyState } from "../components/empty-state.js";
import { metric } from "../components/metric.js";
import { icon } from "../components/icon.js";
import { dateChip } from "../components/date-chip.js";
import { panel, railEmpty } from "../components/panel.js";
import { placesMeter } from "../components/progress.js";
import { sectionHeading } from "../components/section-heading.js";

const FILTERS = Object.freeze([
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Supervised" },
  { key: "changes-requested", label: "Changes requested" },
  { key: "rejected", label: "Rejected" },
]);

const ACTIVITY_TEXT = Object.freeze({
  submitted: "submitted a topic",
  approved: "topic approved",
  rejected: "topic rejected",
  "changes-requested": "changes requested",
  draft: "draft proposal",
});

function decisionCell(proposal) {
  if (["submitted", "changes-requested"].includes(proposal.status)) {
    const decide = (label, decision, iconId) =>
      button({
        label,
        action: "decide",
        id: proposal.id,
        variant: "btn--ghost",
        size: "btn--icon btn--sm",
        iconOnly: true,
        icon: icon(iconId, true),
        attrs: `data-decision="${decision}"`,
      });
    return `<div class="table__actions">${decide("Approve", "approved", "i-check-circle-line")}${decide("Request changes", "changes-requested", "i-chat-1-line")}${decide("Reject", "rejected", "i-close-line")}</div>`;
  }
  if (proposal.status === "approved") {
    return `<div class="table__actions">${button({ label: "Message", action: "open-chat", id: proposal.student, variant: "btn--ghost", size: "btn--icon btn--sm", iconOnly: true, icon: icon("i-chat-1-line", true) })}${button({ label: "Review", action: "go", id: "review", variant: "btn--ghost", size: "btn--icon btn--sm", iconOnly: true, icon: icon("i-document-2-line", true) })}</div>`;
  }
  return `<span class="muted">—</span>`;
}

function rowFor(state, proposal) {
  const milestones = milestonesOf(state, proposal.student);
  const done = milestones.filter((item) => item.done).length;
  const progress =
    proposal.status === "approved" && milestones.length
      ? `${done} of ${milestones.length}`
      : "—";
  return `<tr><td>${esc(proposal.student)}</td><td class="table__topic" title="${esc(proposal.description)}">${esc(proposal.title)}</td><td>${badge(proposal.status)}</td><td class="num">${esc(progress)}</td><td>${decisionCell(proposal)}</td></tr>`;
}

export function renderStudents({ state, collapsed, ui }) {
  const coordinator = coordinatorByName(state, COORDINATOR_NAME);
  const used = usedPlaces(state, COORDINATOR_NAME);
  const all = proposalsOf(state, COORDINATOR_NAME);
  const visible = all.filter(
    (proposal) =>
      (ui.proposalFilter === "all" || proposal.status === ui.proposalFilter) &&
      matchesQuery(ui.query, [
        proposal.student,
        proposal.title,
        proposal.status,
      ]),
  );
  const tabs = FILTERS.map(
    (filter) =>
      `<button class="tab" type="button" data-action="filter" data-id="${esc(filter.key)}" aria-pressed="${ui.proposalFilter === filter.key}">${esc(filter.label)}</button>`,
  ).join("");
  const table = visible.length
    ? `<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Student</th><th scope="col">Topic</th><th scope="col">Status</th><th scope="col">Milestones</th><th scope="col">Decision</th></tr></thead><tbody>${visible.map((proposal) => rowFor(state, proposal)).join("")}</tbody></table></div>`
    : emptyState({
        title: "No students match this filter",
        text: "Choose another filter or clear the search.",
      });
  const events = [...all]
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 4)
    .map(
      (proposal) =>
        `<div class="activity__item"><span class="activity__text"><strong>${esc(proposal.student)}</strong>, ${esc(ACTIVITY_TEXT[proposal.status] ?? proposal.status)}</span><span class="activity__time">${esc(formatLongDate(proposal.updated))}</span></div>`,
    )
    .join("");
  const activity = events
    ? `<div class="activity">${events}</div>`
    : railEmpty("No student activity.");
  const supervised = all
    .filter((proposal) => proposal.status === "approved")
    .map((proposal) => proposal.student);
  const due = openMilestonesByDue(state, supervised).slice(0, 4);
  const deadlines = due.length
    ? `<div class="records">${due
        .map(
          (item) =>
            `<div class="record record--dated"><div class="record__main"><span class="person__name">${esc(item.name)}</span></div>${dateChip(item.due)}</div>`,
        )
        .join("")}</div>`
    : "";
  return `<div class="stack"><div class="tabs" role="group" aria-label="Filter students">${tabs}</div><div class="workspace"><section class="card workspace__main"><div class="metrics">${metric({ label: "Awaiting decision", value: awaitingDecision(state, COORDINATOR_NAME).length })}${metric({ label: "Supervised", value: used, unit: `of ${coordinator.quota}`, meter: placesMeter(used, coordinator.quota) })}${metric({ label: "Open places", value: freePlaces(state, COORDINATOR_NAME) })}</div><section class="section">${sectionHeading("Students", `<span class="section__count">${visible.length} ${visible.length === 1 ? "student" : "students"}</span>`)}${table}</section></section><aside class="workspace__rail">${panel({ id: "activity", title: "Activity", collapsed: collapsed.includes("activity"), body: activity })}${panel({ id: "student-deadlines", title: "Deadlines", collapsed: collapsed.includes("student-deadlines"), body: deadlines || railEmpty("Milestones appear here once a student is supervised.") })}</aside></div></div>`;
}
