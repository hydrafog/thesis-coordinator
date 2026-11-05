import { STUDENT_NAME } from "../config/constants.js";
import { esc } from "../core/html.js";
import { formatLongDate } from "../core/format.js";
import { activeTopicOf, documentsOf, milestonesOf } from "../core/selectors.js";
import { badge } from "../components/badge.js";
import { button } from "../components/button.js";
import { emptyState } from "../components/empty-state.js";
import { icon } from "../components/icon.js";
import { panel } from "../components/panel.js";
import { person } from "../components/person.js";
import { sectionHeading } from "../components/section-heading.js";

function milestoneRow(milestone) {
  const fileId = `file-${esc(milestone.id)}`;
  return `<div class="milestone"><span class="milestone__mark" data-done="${milestone.done}" aria-hidden="true"></span><div class="milestone__info"><span class="person__name">${esc(milestone.name)}</span><span class="person__sub">Due ${esc(formatLongDate(milestone.due))}${milestone.version ? `, ${esc(milestone.version)}` : ""}</span></div><div class="milestone__actions">${badge(milestone.done ? "complete" : "pending")}<label class="btn btn--sm" for="${fileId}">${icon("i-upload-line", true)}<span>Upload</span></label><input class="sr-only" id="${fileId}" type="file" accept=".pdf,.zip" data-change="upload-milestone" data-id="${esc(milestone.id)}"></div></div>`;
}

export function renderMyThesis({ state, collapsed }) {
  const topic = activeTopicOf(state, STUDENT_NAME);
  if (!topic) {
    return `<section class="card">${emptyState({ title: "No proposal yet", text: "Find a coordinator and send a topic proposal to begin.", action: button({ label: "Find a coordinator", action: "go", id: "coordinators", variant: "btn--primary" }) })}</section>`;
  }
  const milestones = milestonesOf(state, STUDENT_NAME);
  const documents = documentsOf(state, STUDENT_NAME);
  const doneCount = milestones.filter((item) => item.done).length;
  const revise = topic.status === "changes-requested" ? button({ label: "Revise proposal", action: "revise", id: topic.id, variant: "btn--primary" }) : "";
  const milestoneList = milestones.length
    ? `<div class="milestones">${milestones.map(milestoneRow).join("")}</div>`
    : emptyState({ title: "No milestones yet", text: "Your coordinator adds milestones once your topic is approved." });
  const contact = `<div class="record">${person(topic.coordinator, "")}</div>`;
  const files = `<div class="file-list"><div class="file-list__row"><span>Final thesis</span>${badge(documents.final ? "complete" : "pending")}</div><div class="file-list__row"><span>Coordinator report</span>${badge("pending")}</div><div class="file-list__row"><span>Similarity report</span>${badge("pending")}</div></div>${documents.final ? `<p class="muted-block">${esc(documents.final)}</p>` : ""}<label class="btn btn--sm" for="final-file">${icon("i-upload-line", true)}<span>Select thesis PDF</span></label><input class="sr-only" id="final-file" type="file" accept=".pdf" data-change="upload-final">`;
  return `<div class="workspace"><section class="card workspace__main"><div class="split">${sectionHeading("Topic", badge(topic.status))}</div><h2 class="card__title">${esc(topic.title)}</h2><dl class="kv"><div class="kv__row"><dt class="kv__key">Description</dt><dd class="kv__value">${esc(topic.description)}</dd></div><div class="kv__row"><dt class="kv__key">Objectives</dt><dd class="kv__value">${esc(topic.objectives)}</dd></div><div class="kv__row"><dt class="kv__key">Technologies</dt><dd class="kv__value">${esc(topic.technologies)}</dd></div><div class="kv__row"><dt class="kv__key">Last updated</dt><dd class="kv__value">${esc(formatLongDate(topic.updated))}</dd></div></dl>${revise}<section class="section">${sectionHeading("Milestones", `<span class="section__count">${doneCount} completed</span>`)}${milestoneList}</section></section><aside class="workspace__rail">${panel({ id: "thesis-contact", title: "Supervisor", collapsed: collapsed.includes("thesis-contact"), body: contact })}${panel({ id: "thesis-files", title: "Defense file", collapsed: collapsed.includes("thesis-files"), body: files })}</aside></div>`;
}
