import { LIMITS } from "../config/constants.js";
import { icon } from "../components/icon.js";
import { openDialog } from "./controls.js";

export function topicDialogMarkup() {
  return `<dialog class="dialog" id="topic-dialog" aria-labelledby="topic-title"><form class="dialog__form" data-submit="topic" novalidate><div class="dialog__head"><h2 class="dialog__title" id="topic-title">Propose a thesis topic</h2><button class="btn btn--ghost btn--icon btn--sm" type="button" data-action="close-dialog" aria-label="Close">${icon("i-close-line", true)}</button></div><div class="dialog__fields"><div class="field"><label class="field__label" for="topic-coordinator">Coordinator</label><input class="input" id="topic-coordinator" name="coordinator" readonly></div><div class="field"><label class="field__label" for="topic-name">Topic title</label><input class="input" id="topic-name" name="title" required maxlength="${LIMITS.topicTitle}" placeholder="Title of your proposed thesis"></div><div class="field"><label class="field__label" for="topic-objectives">Objectives</label><textarea class="textarea" id="topic-objectives" name="objectives" required maxlength="${LIMITS.topicObjectives}" placeholder="What do you aim to accomplish?"></textarea></div><div class="field"><label class="field__label" for="topic-technologies">Technologies</label><input class="input" id="topic-technologies" name="technologies" required maxlength="${LIMITS.topicTechnologies}" placeholder="Tools, frameworks, or methods"></div><div class="field"><label class="field__label" for="topic-description">Short description</label><textarea class="textarea" id="topic-description" name="description" required maxlength="${LIMITS.topicDescription}" placeholder="Briefly describe the approach."></textarea></div></div><div class="dialog__actions"><button class="btn btn--ghost" type="button" data-action="close-dialog">Cancel</button><button class="btn btn--primary" type="submit" id="topic-submit">Send proposal</button></div></form></dialog>`;
}

export function openTopicDialog({ coordinator, proposal = null }) {
  const doc = globalThis.document;
  const form = doc.querySelector("#topic-dialog form");
  form.reset();
  form.dataset.editId = proposal ? proposal.id : "";
  doc.getElementById("topic-title").textContent = proposal ? "Revise topic proposal" : "Propose a thesis topic";
  doc.getElementById("topic-submit").textContent = proposal ? "Resubmit proposal" : "Send proposal";
  doc.getElementById("topic-coordinator").value = coordinator;
  if (proposal) {
    form.elements.title.value = proposal.title;
    form.elements.objectives.value = proposal.objectives;
    form.elements.technologies.value = proposal.technologies;
    form.elements.description.value = proposal.description;
  }
  openDialog("topic-dialog", "topic-name");
}

