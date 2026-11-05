import { LIMITS } from "../config/constants.js";
import { esc } from "../core/html.js";
import { icon } from "../components/icon.js";
import { openDialog } from "./controls.js";

export function milestoneDialogMarkup() {
  return `<dialog class="dialog" id="milestone-dialog" aria-labelledby="milestone-title"><form class="dialog__form" data-submit="milestone" novalidate><div class="dialog__head"><h2 class="dialog__title" id="milestone-title">New milestone</h2><button class="btn btn--ghost btn--icon btn--sm" type="button" data-action="close-dialog" aria-label="Close">${icon("i-close-line", true)}</button></div><div class="dialog__fields"><div class="field"><label class="field__label" for="milestone-student">Student</label><select class="select" id="milestone-student" name="student" required></select></div><div class="field"><label class="field__label" for="milestone-name">Milestone</label><input class="input" id="milestone-name" name="name" required maxlength="${LIMITS.milestoneName}" placeholder="Chapter 1 draft"></div><div class="field"><label class="field__label" for="milestone-date">Deadline</label><input class="input" id="milestone-date" name="due" type="date" required></div></div><div class="dialog__actions"><button class="btn btn--ghost" type="button" data-action="close-dialog">Cancel</button><button class="btn btn--primary" type="submit">Add milestone</button></div></form></dialog>`;
}

export function openMilestoneDialog(studentNames) {
  const select = globalThis.document.getElementById("milestone-student");
  select.innerHTML = studentNames.map((name) => `<option>${esc(name)}</option>`).join("");
  globalThis.document.querySelector("#milestone-dialog form").reset();
  openDialog("milestone-dialog", "milestone-name");
}
