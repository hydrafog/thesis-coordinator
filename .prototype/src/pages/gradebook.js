import { CANDIDATE_STUDENTS, COMMITTEE_MEMBERS, ROLES, STUDENT_NAME } from "../config/constants.js";
import { esc } from "../core/html.js";
import { averageGrade, formatShortDate } from "../core/format.js";
import { gradeRecord } from "../core/selectors.js";
import { badge } from "../components/badge.js";
import { button } from "../components/button.js";
import { panel, railEmpty } from "../components/panel.js";
import { person } from "../components/person.js";
import { sectionHeading } from "../components/section-heading.js";
import { isGrade } from "../core/validation.js";

function studentView(state) {
  const record = gradeRecord(state, STUDENT_NAME);
  const result = record.closed
    ? `<p class="grades__result">${esc(averageGrade(record.values))}</p><p class="muted">Final grade out of 10</p>`
    : `<p class="muted-block">No published grade yet.</p>`;
  const evaluation = `<div class="kv"><div class="kv__row"><span class="kv__key">Status</span><span>${record.closed ? badge("approved") : badge("pending")}</span></div><div class="kv__row"><span class="kv__key">Calculation</span><span class="kv__value">Three-member average</span></div></div>`;
  return `<div class="workspace"><section class="card workspace__main">${sectionHeading("Defense result")}${result}</section><aside class="workspace__rail">${panel({ id: "my-grade-status", title: "Evaluation", collapsed: false, body: evaluation })}</aside></div>`;
}

export function renderGradebook({ state, collapsed, ui }) {
  if (state.role === ROLES.student) {
    return studentView(state);
  }
  const student = ui.gradeStudent;
  const record = gradeRecord(state, student);
  const valid = record.values.filter(isGrade).length;
  const topic = state.proposals.find((item) => item.student === student);
  const slot = state.slots.find((item) => item.student === student);
  const members = COMMITTEE_MEMBERS.map((name, index) => {
    const value = record.values[index] ?? "";
    return `<div class="grades__row">${person(name, index === 0 ? "President" : "Committee member")}<div class="field"><label class="field__label" for="grade-member-${index}">Grade</label><input class="input" id="grade-member-${index}" type="number" min="1" max="10" step="0.01" value="${esc(value)}" data-change="grade-input" data-index="${index}"${record.closed ? " disabled" : ""}></div></div>`;
  }).join("");
  const studentOptions = CANDIDATE_STUDENTS.map((name) => `<option${name === student ? " selected" : ""}>${esc(name)}</option>`).join("");
  const closeButton = record.closed
    ? `<p class="muted">Grades locked</p>${button({ label: "Export minutes", action: "export-minutes", id: student, variant: "btn--sm" })}`
    : button({ label: "Close grading", action: "close-grading", id: student, variant: "btn--primary", disabled: valid !== COMMITTEE_MEMBERS.length });
  const average = `<p class="grades__result grades__result--small num" id="grade-average">${esc(averageGrade(record.values))}</p><p class="muted">${record.closed ? "Finalized" : "Three grades required"}</p>`;
  const details = topic
    ? `<div class="kv"><div class="kv__row"><span class="kv__key">Topic</span><span class="kv__value">${esc(topic.title)}</span></div><div class="kv__row"><span class="kv__key">Supervisor</span><span class="kv__value">${esc(topic.coordinator)}</span></div><div class="kv__row"><span class="kv__key">Session</span><span class="kv__value">${slot ? `${esc(formatShortDate(slot.day))}, ${esc(slot.time)}, Room ${esc(slot.room)}` : "Not scheduled"}</span></div></div>`
    : railEmpty("No topic recorded.");
  return `<div class="workspace"><section class="card workspace__main">${sectionHeading("Committee grading")}<div class="field"><label class="field__label" for="grade-student">Student</label><select class="select" id="grade-student" data-change="grade-student">${studentOptions}</select></div><div class="grades">${members}</div><div class="cluster">${closeButton}</div></section><aside class="workspace__rail">${panel({ id: "grade-average-panel", title: "Committee average", collapsed: collapsed.includes("grade-average-panel"), body: average })}${panel({ id: "grade-candidate", title: "Candidate details", collapsed: collapsed.includes("grade-candidate"), body: details })}</aside></div>`;
}
