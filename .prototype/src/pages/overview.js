import { COORDINATOR_NAME, STUDENT_NAME, ROLES } from "../config/constants.js";
import { esc } from "../core/html.js";
import {
  formatMonthShort,
  formatDayNumber,
  formatShortDate,
  formatLongDate,
} from "../core/format.js";
import {
  activeTopicOf,
  awaitingDecision,
  coordinatorByName,
  milestonesOf,
  openMilestonesByDue,
  sortedSlots,
  supervisedStudents,
  usedPlaces,
} from "../core/selectors.js";
import { badge } from "../components/badge.js";
import { button } from "../components/button.js";
import { icon } from "../components/icon.js";
import { dateChip } from "../components/date-chip.js";
import { emptyState } from "../components/empty-state.js";
import { metric } from "../components/metric.js";
import { person } from "../components/person.js";
import { panel, railEmpty } from "../components/panel.js";
import { capacityBar, placesMeter } from "../components/progress.js";
import { sectionHeading } from "../components/section-heading.js";

function coordinatorOverview(state, collapsed) {
  const used = usedPlaces(state, COORDINATOR_NAME);
  const quota = coordinatorByName(state, COORDINATOR_NAME).quota;
  const pending = awaitingDecision(state, COORDINATOR_NAME);
  const due = openMilestonesByDue(
    state,
    supervisedStudents(state, COORDINATOR_NAME).map((item) => item.student),
  ).slice(0, 4);
  const decisions = pending.length
    ? `<div class="records">${pending
        .map(
          (proposal) =>
            `<article class="record"><div class="record__main">${person(proposal.student, proposal.title)}</div><div class="record__end">${badge(proposal.status)}${button({ label: "Review", action: "go", id: "students", variant: "btn--ghost", size: "btn--icon btn--sm", iconOnly: true, icon: icon("i-document-2-line", true) })}</div></article>`,
        )
        .join("")}</div>`
    : emptyState({
        title: "No proposals awaiting a decision",
        text: "New topic proposals appear here when students submit them.",
      });
  const milestones = due.length
    ? `<div class="records">${due
        .map(
          (milestone) =>
            `<article class="record record--dated"><div class="record__main"><span class="person__name">${esc(milestone.name)}</span><span class="person__sub">${esc(milestone.student)}</span></div>${dateChip(milestone.due)}</article>`,
        )
        .join("")}</div>`
    : emptyState({
        title: "No open milestones",
        text: "Milestones for supervised students appear here until they are complete.",
      });
  const slots = sortedSlots(state.slots).slice(0, 4);
  const defenses = slots.length
    ? `<div class="activity">${slots
        .map(
          (slot) =>
            `<article class="record record--dated"><div class="record__main"><span class="person__name">${esc(slot.student)}</span><span class="person__sub">${esc(slot.time)}, ${esc(slot.committee)}, Room ${esc(slot.room)}</span></div>${dateChip(slot.day)}</article>`,
        )
        .join("")}</div>`
    : railEmpty("No defense sessions yet.");
  return `<div class="workspace"><div class="workspace__main"><section class="card"><div class="metrics">${metric(
    {
      label: "Supervised",
      value: used,
      unit: `of ${quota}`,
      meter: placesMeter(used, quota),
    },
  )}${metric({ label: "Awaiting decision", value: pending.length })}${metric({ label: "Open milestones", value: due.length })}</div><section class="section">${sectionHeading("Needs a decision")}${decisions}</section><section class="section">${sectionHeading("Next milestones")}${milestones}</section></section></div><aside class="workspace__rail">${panel({ id: "defenses", title: "Defenses", collapsed: collapsed.includes("defenses"), body: `${defenses}<p class="muted-block">Published slots: ${esc(state.slots.length)}</p>` })}</aside></div>`;
}

function studentOverview(state, collapsed) {
  const topic = activeTopicOf(state, STUDENT_NAME);
  const milestones = milestonesOf(state, STUDENT_NAME);
  const slot = state.slots.find((item) => item.student === STUDENT_NAME);
  const done = milestones.filter((item) => item.done).length;
  const open = milestones
    .filter((item) => !item.done)
    .sort((a, b) => a.due.localeCompare(b.due));
  const approved = topic?.status === "approved";
  const stage = !approved ? 0 : slot ? 2 : 1;
  const steps = [
    [
      "Topic approval",
      !topic
        ? "Not submitted"
        : topic.status === "changes-requested"
          ? "Changes requested"
          : approved
            ? "Approved"
            : "Awaiting decision",
    ],
    [
      "Supervision",
      approved
        ? milestones.length
          ? `${done} of ${milestones.length} milestones done`
          : "No milestones assigned"
        : "Starts after approval",
    ],
    [
      "Defense",
      slot ? `${formatLongDate(slot.day)}, ${slot.time}` : "Not scheduled",
    ],
  ];
  const callToAction = !topic
    ? button({
        label: "Browse coordinators",
        action: "go",
        id: "coordinators",
        variant: "btn--primary",
      })
    : button({
        label: approved
          ? "Open my thesis"
          : topic.status === "changes-requested"
            ? "Revise proposal"
            : "View my thesis",
        action: "go",
        id: "my-thesis",
        variant: "btn--primary",
      });
  const path = `<ol class="records">${steps
    .map(
      ([title, detail], index) =>
        `<li class="record"${index === stage ? ' aria-current="step"' : ""}><div class="record__main"><span class="person__name">${esc(title)}</span><span class="person__sub">${esc(detail)}</span></div><span class="badge" data-tone="${index < stage ? "success" : index === stage ? "info" : "neutral"}">${index < stage ? "Done" : index === stage ? "Current" : "Next"}</span></li>`,
    )
    .join("")}</ol>`;
  const deadlines = open.length
    ? `<div class="records">${open
        .slice(0, 4)
        .map(
          (item) =>
            `<div class="record record--dated"><div class="record__main"><span class="person__name">${esc(item.name)}</span></div>${dateChip(item.due)}</div>`,
        )
        .join("")}</div>`
    : railEmpty(
        approved
          ? "No open deadlines."
          : "Milestones appear after topic approval.",
      );
  const supervisor = topic
    ? `<div class="record"><div class="record__main">${person(topic.coordinator, coordinatorByName(state, topic.coordinator)?.research ?? "")}</div>${approved ? button({ label: "Open chat", action: "go", id: "chat", variant: "btn--sm" }) : ""}</div>`
    : railEmpty("Choose a coordinator to get started.");
  return `<div class="workspace"><div class="workspace__main"><section class="card"><div class="split">${badge(topic ? topic.status : "draft")}</div><h2 class="card__title">${esc(topic ? topic.title : "Choose a coordinator")}</h2><p class="card__lead">${esc(topic ? topic.description : "Find a supervisor and submit your proposal.")}</p><div class="cluster">${callToAction}</div><section class="section">${sectionHeading("Your path")}${path}</section></section></div><aside class="workspace__rail">${panel({ id: "supervisor", title: "Supervisor", collapsed: collapsed.includes("supervisor"), body: supervisor })}${panel({ id: "deadlines", title: "Deadlines", collapsed: collapsed.includes("deadlines"), body: deadlines })}</aside></div>`;
}

export function renderOverview({ state, collapsed }) {
  return state.role === ROLES.coordinator
    ? coordinatorOverview(state, collapsed)
    : studentOverview(state, collapsed);
}
