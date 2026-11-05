import { ROLES, STUDENT_NAME } from "../config/constants.js";
import { esc } from "../core/html.js";
import { formatShortDate, formatWeekday } from "../core/format.js";
import { activeTopicOf, matchesQuery, milestonesOf, sortedSlots, documentsOf } from "../core/selectors.js";
import { badge } from "../components/badge.js";
import { emptyState } from "../components/empty-state.js";
import { panel, railEmpty } from "../components/panel.js";
import { sectionHeading } from "../components/section-heading.js";

function agendaMarkup(slots) {
  const days = [...new Set(slots.map((slot) => slot.day))];
  return days
    .map((day) => {
      const entries = slots
        .filter((slot) => slot.day === day)
        .map(
          (slot) =>
            `<div class="agenda__entry"><time class="agenda__time" datetime="${esc(slot.day)}T${esc(slot.time)}">${esc(slot.time)}</time><div class="agenda__info"><span class="person__name">${esc(slot.student)}</span><span class="person__sub">${esc(slot.committee)}, Room ${esc(slot.room)}</span></div><span class="agenda__duration">${esc(slot.duration)} min</span></div>`,
        )
        .join("");
      return `<section class="agenda__day"><h3 class="agenda__date">${esc(formatShortDate(day))}, ${esc(formatWeekday(day))}</h3>${entries}</section>`;
    })
    .join("");
}

export function renderSchedule({ state, collapsed, ui }) {
  const base = state.role === ROLES.coordinator ? state.slots : state.slots.filter((slot) => slot.student === STUDENT_NAME);
  const slots = sortedSlots(base.filter((slot) => matchesQuery(ui.query, [slot.student, slot.day, slot.time, slot.room, slot.committee])));
  const agenda = slots.length
    ? agendaMarkup(slots)
    : emptyState({ title: "No defense sessions", text: ui.query ? "No sessions match your search." : "No defense slot is published yet." });
  const committees = [...new Set(state.slots.map((slot) => slot.committee))];
  const coordinatorRail = panel({
    id: "schedule-committees",
    title: "Committees",
    collapsed: collapsed.includes("schedule-committees"),
    body: committees.length
      ? `<div class="kv">${committees
          .map((committee) => {
            const count = state.slots.filter((slot) => slot.committee === committee);
            return `<div class="kv__row"><span class="kv__value">${esc(committee)}</span><span class="kv__key">Room ${esc(count[0]?.room ?? "—")}, ${count.length} ${count.length === 1 ? "slot" : "slots"}</span></div>`;
          })
          .join("")}</div>`
      : railEmpty("No committees assigned."),
  });
  const topic = activeTopicOf(state, STUDENT_NAME);
  const milestones = milestonesOf(state, STUDENT_NAME);
  const documents = documentsOf(state, STUDENT_NAME);
  const studentRail = panel({
    id: "schedule-readiness",
    title: "Defense readiness",
    collapsed: collapsed.includes("schedule-readiness"),
    body: `<div class="kv"><div class="kv__row"><span class="kv__key">Topic</span><span>${topic ? badge(topic.status) : badge("draft")}</span></div><div class="kv__row"><span class="kv__key">Milestones</span><span class="kv__value">${milestones.length ? `${milestones.filter((item) => item.done).length} of ${milestones.length} done` : "None assigned"}</span></div><div class="kv__row"><span class="kv__key">Final thesis file</span><span>${badge(documents.final ? "complete" : "pending")}</span></div></div>`,
  });
  const rail = state.role === ROLES.coordinator
    ? `${coordinatorRail}${panel({ id: "schedule-format", title: "Session format", collapsed: collapsed.includes("schedule-format"), body: `<div class="kv"><div class="kv__row"><span class="kv__key">Presentation</span><span class="kv__value">20 min</span></div><div class="kv__row"><span class="kv__key">Published slots</span><span class="kv__value num">${state.slots.length}</span></div></div>` })}`
    : studentRail;
  return `<div class="workspace"><section class="card workspace__main">${sectionHeading(state.role === ROLES.coordinator ? "Defense schedule" : "My defense", `<span class="section__count">${slots.length} ${slots.length === 1 ? "session" : "sessions"}</span>`)}<div class="agenda">${agenda}</div></section><aside class="workspace__rail">${rail}</aside></div>`;
}
