import { LIMITS } from "../config/constants.js";
import { icon } from "../components/icon.js";
import { openDialog } from "./controls.js";

export function reviewDialogMarkup() {
  return `<dialog class="dialog" id="review-dialog" aria-labelledby="review-dialog-title"><form class="dialog__form" data-submit="review" novalidate><input type="hidden" name="id"><div class="dialog__head"><h2 class="dialog__title" id="review-dialog-title">Chapter feedback</h2><button class="btn btn--ghost btn--icon btn--sm" type="button" data-action="close-dialog" aria-label="Close">${icon("i-close-line", true)}</button></div><div class="dialog__fields"><div class="field"><label class="field__label" for="review-status">Chapter status</label><select class="select" id="review-status" name="status"><option value="needs-work">Needs work</option><option value="ok">OK</option></select></div><div class="field"><label class="field__label" for="review-note">Feedback</label><textarea class="textarea" id="review-note" name="comment" required maxlength="${LIMITS.reviewComment}" placeholder="What should the student revise?"></textarea></div></div><div class="dialog__actions"><button class="btn btn--ghost" type="button" data-action="close-dialog">Cancel</button><button class="btn btn--primary" type="submit">Save feedback</button></div></form></dialog>`;
}

export function openReviewDialog(review) {
  const form = globalThis.document.querySelector("#review-dialog form");
  form.elements.id.value = review.id;
  form.elements.status.value = review.status;
  form.elements.comment.value = review.comment;
  openDialog("review-dialog", "review-status");
}
